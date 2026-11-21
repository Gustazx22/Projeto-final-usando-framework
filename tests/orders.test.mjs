import test from 'node:test'
import assert from 'node:assert/strict'
import { createRemoteOrders, createLocalOrders, normalizeOrderInput } from '../src/services/orders.js'

const addr1 = '11111111-1111-4111-8111-111111111111'
const addr2 = '22222222-2222-4222-8222-222222222222'
const checkout = (override = {}) => ({
  items: [{ id: 1, qtd: 2 }], addressId: addr1,
  payment: 'pix', expectedTotal: 30.70, observacoes: '', ...override,
})
function fixture() {
  let id = 'u1'
  let writes = 0
  const database = {
    users: [{ id: 'u1' }, { id: 'u2' }],
    addresses: [
      { id: addr1, user_id: 'u1', endereco: 'Rua A', cep: '00000-000', numero: '1', bairro: 'Centro', cidade: 'Teste', estado: 'RS', label: 'Casa' },
      { id: addr2, user_id: 'u2', endereco: 'Rua B', cep: '00000-000', numero: '2', bairro: 'Centro', cidade: 'Teste', estado: 'SP', label: 'Casa' },
    ],
    orders: [],
  }
  const service = createLocalOrders({
    loadDb: () => database, saveDb: () => { writes++ },
    currentLocalUserId: () => id, newId: () => `order-${writes}`,
  })
  return { service, database, getWrites: () => writes, setUser: (user) => { id = user } }
}

test('normalização remove preços, totais e status enviados maliciosamente pelo cliente', () => {
  const result = normalizeOrderInput({ ...checkout(), items: [{ id: 1, qtd: 2, preco: 0, nome: 'fake' }], status: 'pago', total: 0 })
  assert.deepEqual(result.items, [{ id: 1, qtd: 2 }])
  assert.equal('status' in result, false)
  assert.equal('total' in result, false)
})

test('rejeita carrinho vazio, duplicatas, quantidade inválida e pagamento inválido', () => {
  for (const input of [
    checkout({ items: [] }), checkout({ items: [{ id: 1, qtd: -1 }] }),
    checkout({ items: [{ id: 1, qtd: 100 }] }),
    checkout({ items: [{ id: 1, qtd: 1 }, { id: 1, qtd: 1 }] }),
    checkout({ payment: 'admin' }), checkout({ expectedTotal: -50 }),
  ]) assert.throws(() => normalizeOrderInput(input), Error)
})

test('modo demonstração usa preço do catálogo, frete calculado e estado não pago', async () => {
  const { service, database, getWrites } = fixture()
  const result = await service.createOrder({ ...checkout(), status: 'pago', total: 0, itens: [{ preco: 0 }] })
  assert.equal(result.subtotal, 17.80)
  assert.equal(result.entrega, 12.90)
  assert.equal(result.total, 30.70)
  assert.equal(result.status, 'aguardando_pagamento')
  assert.equal(result.itens[0].preco, 8.90)
  assert.equal(result.receita, '')
  assert.equal(database.orders.length, 1)
  assert.equal(getWrites(), 1)
})

test('modo demonstração calcula entrega grátis a partir de R$ 100', async () => {
  const { service } = fixture()
  const result = await service.createOrder(checkout({ items: [{ id: 1, qtd: 12 }], expectedTotal: 106.80, payment: 'whatsapp' }))
  assert.equal(result.entrega, 0)
  assert.equal(result.status, 'pendente')
})

test('não aceita preço antigo, item inexistente ou endereço de outro cliente', async () => {
  const { service, database } = fixture()
  await assert.rejects(() => service.createOrder(checkout({ expectedTotal: 0 })), /preço/i)
  await assert.rejects(() => service.createOrder(checkout({ items: [{ id: 777, qtd: 2 }] })), /indisponível/i)
  await assert.rejects(() => service.createOrder(checkout({ addressId: addr2 })), /sem permissão/i)
  assert.equal(database.orders.length, 0)
})

test('nenhuma conta enxerga pedidos da outra no modo demonstração', async () => {
  const { service, setUser } = fixture()
  await service.createOrder(checkout())
  setUser('u2')
  assert.deepEqual(await service.listOrders(), [])
  setUser(null)
  await assert.rejects(() => service.createOrder(checkout()), /login/i)
})

test('produtos que exigem receita não são concluídos até a etapa 6', async () => {
  const { service: unused } = fixture()
  const database = { users: [{ id: 'u1' }], addresses: [{ id: addr1, user_id: 'u1' }], orders: [] }
  const service = createLocalOrders({
    loadDb: () => database, saveDb: () => {}, currentLocalUserId: () => 'u1', newId: () => 'id',
    catalog: [{ products: [{ id: 1, name: 'Rx', price: 8.9, requiresPrescription: true }] }],
  })
  assert.ok(unused)
  await assert.rejects(() => service.createOrder(checkout()), /receita/i)
})

test('Supabase chama somente RPC e manda IDs, quantidades, endereço, pagamento e total esperado', async () => {
  const calls = []
  const client = {
    rpc(name, args) {
      calls.push([name, args])
      return Promise.resolve({ data: { id: 'o1', itens: [{ id: 1, qtd: 2, preco: 8.9 }], status: 'aguardando_pagamento' }, error: null })
    },
  }
  const service = createRemoteOrders(client, { getToken: async () => {} })
  const result = await service.createOrder({ ...checkout(), status: 'pago', subtotal: 0, total: 0 })
  assert.equal(result.id, 'o1')
  assert.equal(calls.length, 1)
  assert.equal(calls[0][0], 'farmavida_create_order')
  assert.deepEqual(Object.keys(calls[0][1]).sort(), ['p_address_id', 'p_expected_total', 'p_items', 'p_observations', 'p_payment'])
  assert.deepEqual(calls[0][1].p_items, [{ id: 1, qtd: 2 }])
})

test('Supabase fornece instruções quando SQL da etapa 5 ainda não foi aplicado', async () => {
  const client = { rpc: async () => ({ data: null, error: { code: 'PGRST202', message: 'missing' } }) }
  await assert.rejects(() => createRemoteOrders(client).createOrder(checkout()), /etapa5-pedidos.sql/)
})

test('Supabase retorna apenas pedidos carregados pelo RLS', async () => {
  const calls = []
  const query = { select(value) { calls.push(value); return this }, order(value, params) { calls.push([value, params]); return Promise.resolve({ data: [{ id: 'o1' }], error: null }) } }
  const client = { from(table) { calls.push(table); return query } }
  const result = await createRemoteOrders(client).listOrders()
  assert.equal(result.length, 1)
  assert.equal(calls[0], 'orders')
  assert.equal(calls[1], '*')
})
