const ESTADOS = new Set('AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' '))

export function normalizeAddress(value) {
  if (!value || typeof value !== 'object') throw new Error('Informe um endereço válido.')
  const field = (name) => String(value[name] ?? '').trim()
  const cepDigits = field('cep').replace(/\D/g, '')
  const estado = field('estado').toUpperCase()
  const data = {
    label: field('label') || 'Casa',
    cep: cepDigits.length === 8 ? `${cepDigits.slice(0, 5)}-${cepDigits.slice(5)}` : field('cep'),
    endereco: field('endereco'), numero: field('numero'),
    complemento: field('complemento'), bairro: field('bairro'),
    cidade: field('cidade'), estado, isDefault: value.isDefault === true,
  }
  if (cepDigits.length !== 8) throw new Error('Informe um CEP válido de 8 dígitos.')
  if (!data.endereco || !data.numero || !data.bairro || !data.cidade) {
    throw new Error('Preencha rua, número, bairro e cidade.')
  }
  if (!ESTADOS.has(estado)) throw new Error('Selecione uma UF válida.')
  if (data.label.length > 80 || data.endereco.length > 200 || data.numero.length > 30 ||
      data.complemento.length > 120 || data.bairro.length > 120 || data.cidade.length > 120) {
    throw new Error('Um dos campos do endereço está muito longo.')
  }
  return data
}

export const addrFromDb = (a) => ({
  id: a.id, label: a.label, cep: a.cep, endereco: a.endereco, numero: a.numero,
  complemento: a.complemento || '', bairro: a.bairro, cidade: a.cidade, estado: a.estado,
  isDefault: Boolean(a.is_default),
})

const addrToDb = (address) => {
  const a = normalizeAddress(address)
  return {
    label: a.label, cep: a.cep, endereco: a.endereco, numero: a.numero,
    complemento: a.complemento, bairro: a.bairro, cidade: a.cidade, estado: a.estado,
    is_default: a.isDefault,
  }
}

export function createRemoteAddresses(client, { getToken } = {}) {
  const requireLogin = async () => {
    if (!client) throw new Error('Configure o Supabase no .env e reinicie o Vite.')
    if (getToken) await getToken()
  }
  const check = ({ data, error }) => {
    if (error) {
      if (error.code === '42P01' || /relation .*addresses.* does not exist/i.test(error.message || '')) {
        throw new Error('Tabela de endereços não encontrada. Execute o SQL da etapa 2 no Supabase.')
      }
      if (error.code === 'PGRST202' || error.code === '42883') {
        throw new Error('Funções de endereços ausentes. Execute supabase/etapa2-enderecos.sql no SQL Editor.')
      }
      if (error.code === '42501') throw new Error('Você não tem permissão para alterar este endereço.')
      throw new Error(error.message || 'Não foi possível acessar seus endereços.')
    }
    return data
  }
  const requireId = (id) => {
    if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id)) {
      throw new Error('Identificador de endereço inválido.')
    }
    return id
  }
  const invoke = async (name, params) => {
    await requireLogin()
    return check(await client.rpc(name, params))
  }
  return {
    async listAddresses() {
      await requireLogin()
      const rows = check(await client.from('addresses').select('*').order('created_at', { ascending: true }))
      return (rows ?? []).map(addrFromDb)
    },
    async addAddress(address) {
      const saved = await invoke('farmavida_save_address', { p_address: addrToDb(address) })
      if (!saved?.id) throw new Error('O Supabase não confirmou o cadastro do endereço.')
      return addrFromDb(saved)
    },
    async updateAddress(id, address) {
      const saved = await invoke('farmavida_save_address', { p_id: requireId(id), p_address: addrToDb(address) })
      if (!saved?.id) throw new Error('O Supabase não confirmou a edição do endereço.')
      return addrFromDb(saved)
    },
    async removeAddress(id) {
      await invoke('farmavida_remove_address', { p_id: requireId(id) })
    },
    async setDefaultAddress(id) {
      await invoke('farmavida_set_default_address', { p_id: requireId(id) })
    },
  }
}

export function createLocalAddresses({ loadDb, saveDb, currentLocalUserId, newId }) {
  const requireUser = (database) => {
    const id = currentLocalUserId()
    if (!id || !database.users.some((u) => u.id === id)) {
      throw new Error('Faça login para gerenciar endereços.')
    }
    return id
  }
  const publicRow = (row) => {
    const address = { ...row }
    delete address.user_id
    return address
  }
  return {
    async listAddresses() {
      const owner = currentLocalUserId()
      return loadDb().addresses.filter((a) => a.user_id === owner).map(publicRow)
    },
    async addAddress(address) {
      const data = normalizeAddress(address)
      const database = loadDb()
      const owner = requireUser(database)
      const mine = database.addresses.filter((a) => a.user_id === owner)
      const makeDefault = data.isDefault || mine.length === 0
      if (makeDefault) mine.forEach((a) => { a.isDefault = false })
      const row = { ...data, id: newId(), user_id: owner, isDefault: makeDefault }
      database.addresses.push(row)
      saveDb(database)
      return publicRow(row)
    },
    async updateAddress(addrId, address) {
      const data = normalizeAddress(address)
      const database = loadDb()
      const owner = requireUser(database)
      const row = database.addresses.find((a) => a.id === addrId && a.user_id === owner)
      if (!row) throw new Error('Endereço não encontrado ou sem permissão.')
      const makeDefault = row.isDefault || data.isDefault
      if (makeDefault) database.addresses.forEach((a) => { if (a.user_id === owner) a.isDefault = false })
      Object.assign(row, data, { isDefault: makeDefault })
      saveDb(database)
      return publicRow(row)
    },
    async removeAddress(addrId) {
      const database = loadDb()
      const owner = requireUser(database)
      const index = database.addresses.findIndex((a) => a.id === addrId && a.user_id === owner)
      if (index < 0) throw new Error('Endereço não encontrado ou sem permissão.')
      const [removed] = database.addresses.splice(index, 1)
      if (removed.isDefault) {
        const next = database.addresses.find((a) => a.user_id === owner)
        if (next) next.isDefault = true
      }
      saveDb(database)
    },
    async setDefaultAddress(addrId) {
      const database = loadDb()
      const owner = requireUser(database)
      if (!database.addresses.some((a) => a.id === addrId && a.user_id === owner)) {
        throw new Error('Endereço não encontrado ou sem permissão.')
      }
      database.addresses.forEach((a) => { if (a.user_id === owner) a.isDefault = a.id === addrId })
      saveDb(database)
    },
  }
}
