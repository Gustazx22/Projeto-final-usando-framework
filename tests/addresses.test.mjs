import test from 'node:test'
import assert from 'node:assert/strict'
import { createLocalAddresses, createRemoteAddresses, normalizeAddress } from '../src/services/addresses.js'

const fullAddress = (extra = {}) => ({
  label: 'Casa', cep: '98765432', endereco: 'Rua das Flores', numero: '100',
  complemento: '', bairro: 'Centro', cidade: 'Santo Ângelo', estado: 'RS', ...extra,
})

function localFixture() {
  const database = { users: [{ id: 'usuario-A' }, { id: 'usuario-B' }], addresses: [], orders: [] }
  let owner = 'usuario-A'
  let sequence = 0
  const api = createLocalAddresses({
    loadDb: () => structuredClone(database),
    saveDb: (next) => Object.assign(database, structuredClone(next)),
    currentLocalUserId: () => owner,
    newId: () => `endereco-${++sequence}`,
  })
  return { api, database, as: (id) => { owner = id } }
}

test('normaliza CEP, aparas e UF sem confiar em campos extras', () => {
  const data = normalizeAddress({ ...fullAddress({ cep: ' 98765-432 ', estado: ' rs ', label: '  Trabalho  ', user_id: 'fraude' }) })
  assert.equal(data.cep, '98765-432')
  assert.equal(data.estado, 'RS')
  assert.equal(data.label, 'Trabalho')
  assert.equal('user_id' in data, false)
})

test('rejeita campos obrigatórios e UF ou CEP inválidos', () => {
  assert.throws(() => normalizeAddress(fullAddress({ cep: 'ABC' })), /CEP/)
  assert.throws(() => normalizeAddress(fullAddress({ numero: '' })), /Preencha/)
  assert.throws(() => normalizeAddress(fullAddress({ estado: 'ZZ' })), /UF/)
})

test('modo demo: primeiro é principal; edição preserva id e principal', async () => {
  const { api } = localFixture()
  const first = await api.addAddress(fullAddress())
  assert.equal(first.isDefault, true)
  const second = await api.addAddress(fullAddress({ label: 'Escritório', numero: '200' }))
  assert.equal(second.isDefault, false)
  const changed = await api.updateAddress(first.id, fullAddress({ label: 'Casa nova', numero: '888' }))
  assert.equal(changed.id, first.id)
  assert.equal(changed.numero, '888')
  assert.equal(changed.isDefault, true)
  const list = await api.listAddresses()
  assert.equal(list.length, 2)
  assert.deepEqual(list.map((a) => a.isDefault), [true, false])
  assert.equal(list[0].user_id, undefined)
})

test('modo demo: trocar principal e excluir principal promove outro', async () => {
  const { api } = localFixture()
  const a = await api.addAddress(fullAddress())
  const b = await api.addAddress(fullAddress({ label: 'Trabalho' }))
  await api.setDefaultAddress(b.id)
  assert.deepEqual((await api.listAddresses()).map((a) => a.isDefault), [false, true])
  await api.removeAddress(b.id)
  assert.deepEqual((await api.listAddresses()).map((a) => a.isDefault), [true])
  await api.removeAddress(a.id)
  assert.equal((await api.listAddresses()).length, 0)
})

test('modo demo: nenhuma conta edita, remove ou torna principal o endereço alheio', async () => {
  const { api, as, database } = localFixture()
  const a = await api.addAddress(fullAddress())
  as('usuario-B')
  assert.equal((await api.listAddresses()).length, 0)
  await assert.rejects(api.updateAddress(a.id, fullAddress({ numero: '999' })), /sem permissão/)
  await assert.rejects(api.removeAddress(a.id), /sem permissão/)
  await assert.rejects(api.setDefaultAddress(a.id), /sem permissão/)
  assert.equal(database.addresses[0].numero, '100')
  assert.equal(database.addresses[0].isDefault, true)
  const b = await api.addAddress(fullAddress({ numero: '200' }))
  assert.equal(b.isDefault, true)
  as('usuario-A')
  assert.deepEqual((await api.listAddresses()).map((x) => x.id), [a.id])
})

test('modo demo: sem sessão não cria nem altera endereços', async () => {
  const { api, as } = localFixture()
  as(null)
  await assert.rejects(api.addAddress(fullAddress()), /Faça login/)
  await assert.rejects(api.updateAddress('x', fullAddress()), /Faça login/)
  await assert.rejects(api.removeAddress('x'), /Faça login/)
  await assert.rejects(api.setDefaultAddress('x'), /Faça login/)
})

function remoteFixture({ auth = true, failures = {} } = {}) {
  const calls = []
  const id = 'b8e06a29-3996-4cd8-9eca-95dc34977130'
  const data = { ...fullAddress({ cep: '98765-432' }), id, is_default: true }
  const client = {
    from: (table) => ({
      select: (columns) => ({
        order: async (column, options) => {
          calls.push(['select', table, columns, column, options])
          return failures.select || { data: [data], error: null }
        },
      }),
    }),
    rpc: async (name, params) => {
      calls.push(['rpc', name, params])
      return failures[name] || { data: name === 'farmavida_save_address' ? data : null, error: null }
    },
  }
  const api = createRemoteAddresses(client, {
    getToken: async () => { calls.push(['auth']); if (!auth) throw new Error('Faça login para continuar.') },
  })
  return { api, calls, id }
}

test('remoto: lista do banco mapeia is_default e ordena por criação', async () => {
  const { api, calls } = remoteFixture()
  const rows = await api.listAddresses()
  assert.equal(rows[0].isDefault, true)
  assert.deepEqual(calls[1], ['select', 'addresses', '*', 'created_at', { ascending: true }])
})

test('remoto: CRUD chama RPCs corretas; owner não é aceito na entrada', async () => {
  const { api, calls, id } = remoteFixture()
  await api.addAddress({ ...fullAddress(), user_id: 'fraude' })
  await api.updateAddress(id, fullAddress({ label: 'Casa nova' }))
  await api.setDefaultAddress(id)
  await api.removeAddress(id)
  const actions = calls.filter((x) => x[0] === 'rpc')
  assert.deepEqual(actions.map((x) => x[1]), ['farmavida_save_address', 'farmavida_save_address', 'farmavida_set_default_address', 'farmavida_remove_address'])
  assert.equal('user_id' in actions[0][2].p_address, false)
  assert.equal(actions[1][2].p_id, id)
  assert.equal(actions[2][2].p_id, id)
})

test('remoto: não tenta consultar ou escrever se a sessão não existir', async () => {
  const { api, calls } = remoteFixture({ auth: false })
  await assert.rejects(api.listAddresses(), /Faça login/)
  await assert.rejects(api.addAddress(fullAddress()), /Faça login/)
  assert.deepEqual(calls, [['auth'], ['auth']])
})

test('remoto: orienta quando o SQL não foi aplicado', async () => {
  const { api } = remoteFixture({ failures: {
    farmavida_save_address: { data: null, error: { code: 'PGRST202', message: 'No function' } },
  } })
  await assert.rejects(api.addAddress(fullAddress()), /Execute supabase\/etapa2-enderecos.sql/)
})

test('remoto: rejeita ID inválido e propaga falha de permissão', async () => {
  const { api, id } = remoteFixture({ failures: {
    farmavida_remove_address: { data: null, error: { code: '42501', message: 'permission denied' } },
  } })
  await assert.rejects(api.removeAddress('invalido'), /Identificador/)
  await assert.rejects(api.removeAddress(id), /permissão/)
})
