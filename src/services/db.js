/**
 * Camada de banco de dados do FarmaVida.
 *
 * - Com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env, usa o Supabase
 *   (banco PostgreSQL de verdade + autenticação), via fetch, sem biblioteca extra.
 * - Sem essas variáveis, usa o modo demonstração: tudo fica no localStorage do navegador.
 *
 * As duas versões expõem exatamente as mesmas funções.
 */
const URL_BASE = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
export const isRemote = Boolean(URL_BASE && ANON_KEY)

const SESSION_KEY = 'farmavida-session'
const LOCAL_DB_KEY = 'farmavida-localdb'

const readJSON = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}
const writeJSON = (key, value) => localStorage.setItem(key, JSON.stringify(value))

/* ============================ Supabase ============================ */
async function request(path, { method = 'GET', body, token, headers = {} } = {}) {
  const res = await fetch(`${URL_BASE}${path}`, {
    method,
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${token || ANON_KEY}`,
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let data
  try { data = text ? JSON.parse(text) : null } catch { data = null }
  if (!res.ok) {
    const msg = data?.msg || data?.message || data?.error_description || data?.error || `Erro ${res.status}`
    throw new Error(translateError(msg))
  }
  return data
}

function translateError(msg) {
  const m = String(msg).toLowerCase()
  if (m.includes('invalid login')) return 'E-mail ou senha incorretos.'
  if (m.includes('already registered') || m.includes('already been registered')) return 'Este e-mail já está cadastrado.'
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar (veja sua caixa de entrada).'
  if (m.includes('password')) return 'A senha precisa ter pelo menos 6 caracteres.'
  if (m.includes('failed to fetch')) return 'Sem conexão com o servidor. Verifique sua internet.'
  return msg
}

const toUser = (u) => ({
  id: u.id,
  email: u.email,
  nome: u.user_metadata?.nome || '',
  telefone: u.user_metadata?.telefone || '',
  cpf: u.user_metadata?.cpf || '',
})

function saveSession(data) {
  const session = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
    user: toUser(data.user),
  }
  writeJSON(SESSION_KEY, session)
  return session
}

async function getToken() {
  const s = readJSON(SESSION_KEY, null)
  if (!s) throw new Error('Faça login para continuar.')
  if (s.expires_at - 60 > Date.now() / 1000) return s.access_token
  try {
    const data = await request('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      body: { refresh_token: s.refresh_token },
    })
    return saveSession(data).access_token
  } catch {
    localStorage.removeItem(SESSION_KEY)
    throw new Error('Sua sessão expirou. Entre novamente.')
  }
}

const addrFromDb = (a) => ({
  id: a.id, label: a.label, cep: a.cep, endereco: a.endereco, numero: a.numero,
  complemento: a.complemento || '', bairro: a.bairro, cidade: a.cidade, estado: a.estado,
  isDefault: !!a.is_default,
})
const addrToDb = (a) => ({
  label: a.label || 'Casa', cep: a.cep, endereco: a.endereco, numero: a.numero,
  complemento: a.complemento || '', bairro: a.bairro, cidade: a.cidade, estado: a.estado,
  is_default: !!a.isDefault,
})

const remote = {
  async signUp({ email, password, nome, telefone, cpf }) {
    const data = await request('/auth/v1/signup', {
      method: 'POST',
      body: { email, password, data: { nome, telefone, cpf } },
    })
    if (data?.access_token) {
      return { user: saveSession(data).user, needsConfirmation: false }
    }
    return { user: null, needsConfirmation: true }
  },
  async signIn({ email, password }) {
    const data = await request('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: { email, password },
    })
    return saveSession(data).user
  },
  async signOut() {
    const s = readJSON(SESSION_KEY, null)
    localStorage.removeItem(SESSION_KEY)
    if (s) { try { await request('/auth/v1/logout', { method: 'POST', token: s.access_token }) } catch { /* ignora */ } }
  },
  async restore() {
    const s = readJSON(SESSION_KEY, null)
    if (!s) return null
    try { await getToken() } catch { return null }
    return readJSON(SESSION_KEY, null)?.user || null
  },
  async listAddresses() {
    const token = await getToken()
    const rows = await request('/rest/v1/addresses?select=*&order=created_at.asc', { token })
    return rows.map(addrFromDb)
  },
  async addAddress(address) {
    const token = await getToken()
    if (address.isDefault) {
      await request('/rest/v1/addresses?is_default=eq.true', { method: 'PATCH', token, body: { is_default: false } })
    }
    const rows = await request('/rest/v1/addresses', {
      method: 'POST', token, headers: { Prefer: 'return=representation' }, body: addrToDb(address),
    })
    return addrFromDb(rows[0])
  },
  async removeAddress(id) {
    const token = await getToken()
    await request(`/rest/v1/addresses?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', token })
  },
  async setDefaultAddress(id) {
    const token = await getToken()
    await request('/rest/v1/addresses?is_default=eq.true', { method: 'PATCH', token, body: { is_default: false } })
    await request(`/rest/v1/addresses?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', token, body: { is_default: true } })
  },
  async createOrder(order) {
    const token = await getToken()
    const rows = await request('/rest/v1/orders', {
      method: 'POST', token, headers: { Prefer: 'return=representation' }, body: order,
    })
    return rows[0]
  },
  async listOrders() {
    const token = await getToken()
    return request('/rest/v1/orders?select=*&order=created_at.desc', { token })
  },
}

/* ====================== Modo demonstração (localStorage) ====================== */
const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`)
const loadDb = () => readJSON(LOCAL_DB_KEY, { users: [], addresses: [], orders: [] })
const saveDb = (db) => writeJSON(LOCAL_DB_KEY, db)

async function hash(text) {
  if (crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`farmavida:${text}`))
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
  }
  return btoa(unescape(encodeURIComponent(`farmavida:${text}`)))
}

const currentLocalUserId = () => readJSON(SESSION_KEY, null)?.userId
const publicUser = (u) => ({ id: u.id, email: u.email, nome: u.nome, telefone: u.telefone, cpf: u.cpf })

const local = {
  async signUp({ email, password, nome, telefone, cpf }) {
    const db = loadDb()
    const mail = email.trim().toLowerCase()
    if (db.users.some((u) => u.email === mail)) throw new Error('Este e-mail já está cadastrado.')
    if (password.length < 6) throw new Error('A senha precisa ter pelo menos 6 caracteres.')
    const user = { id: newId(), email: mail, nome, telefone, cpf, hash: await hash(password) }
    db.users.push(user)
    saveDb(db)
    writeJSON(SESSION_KEY, { userId: user.id })
    return { user: publicUser(user), needsConfirmation: false }
  },
  async signIn({ email, password }) {
    const db = loadDb()
    const user = db.users.find((u) => u.email === email.trim().toLowerCase())
    if (!user || user.hash !== (await hash(password))) throw new Error('E-mail ou senha incorretos.')
    writeJSON(SESSION_KEY, { userId: user.id })
    return publicUser(user)
  },
  async signOut() { localStorage.removeItem(SESSION_KEY) },
  async restore() {
    const id = currentLocalUserId()
    const user = id && loadDb().users.find((u) => u.id === id)
    return user ? publicUser(user) : null
  },
  async listAddresses() {
    const id = currentLocalUserId()
    return loadDb().addresses.filter((a) => a.user_id === id).map((a) => ({ ...a, user_id: undefined }))
  },
  async addAddress(address) {
    const db = loadDb()
    const id = currentLocalUserId()
    if (address.isDefault) db.addresses.forEach((a) => { if (a.user_id === id) a.isDefault = false })
    const row = { ...address, id: newId(), user_id: id }
    db.addresses.push(row)
    saveDb(db)
    return { ...row, user_id: undefined }
  },
  async removeAddress(addrId) {
    const db = loadDb()
    db.addresses = db.addresses.filter((a) => a.id !== addrId)
    saveDb(db)
  },
  async setDefaultAddress(addrId) {
    const db = loadDb()
    const id = currentLocalUserId()
    db.addresses.forEach((a) => { if (a.user_id === id) a.isDefault = a.id === addrId })
    saveDb(db)
  },
  async createOrder(order) {
    const db = loadDb()
    const row = { ...order, id: newId(), user_id: currentLocalUserId(), created_at: new Date().toISOString() }
    db.orders.push(row)
    saveDb(db)
    return row
  },
  async listOrders() {
    const id = currentLocalUserId()
    return loadDb().orders.filter((o) => o.user_id === id).sort((a, b) => b.created_at.localeCompare(a.created_at))
  },
}

export const db = isRemote ? remote : local
