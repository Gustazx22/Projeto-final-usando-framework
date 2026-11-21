import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRemoteReceipts, createLocalReceipts, validateReceiptFile, receiptStoragePath, RECEIPT_BUCKET } from '../src/services/receipts.js'
import { createRemoteOrders, createLocalOrders } from '../src/services/orders.js'

const uid = '11111111-1111-4111-8111-111111111111'
const addr = '22222222-2222-4222-8222-222222222222'
const pdf = { name: 'receita-ficticia.pdf', type: 'application/pdf', size: 123 }
const checkout = (more = {}) => ({ items: [{ id: 1, qtd: 1 }], addressId: addr, payment: 'pix', expectedTotal: 21.80, observacoes: '', ...more })

function fakeClient(result = {}) {
  const calls = []
  const storage = {
    upload(path, file, options) { calls.push(['upload', path, file, options]); return Promise.resolve({ error: result.uploadError || null }) },
    remove(paths) { calls.push(['remove', paths]); return Promise.resolve({ data: paths, error: null }) },
    createSignedUrl(path, seconds) { calls.push(['signed', path, seconds]); return Promise.resolve({ data: { signedUrl: 'https://safe.invalid/temp' }, error: null }) },
  }
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: uid } }, error: null }) },
    storage: { from(bucket) { calls.push(['bucket', bucket]); return storage } },
    rpc(name, params) { calls.push(['rpc', name, params]); return Promise.resolve(result.rpc || { data: { id: 'order-1', itens: [{ id: 1 }], status: 'aguardando_analise' }, error: null }) },
  }
  return { client, calls }
}

test('receita inválida, vazia, grande e com extensão falsa é rejeitada', () => {
  for (const wrong of [null, {}, { ...pdf, type: 'text/plain' }, { ...pdf, name: 'receita.jpg' }, { ...pdf, size: 0 }, { ...pdf, size: 11 * 1024 * 1024 }]) {
    assert.throws(() => validateReceiptFile(wrong), Error)
  }
  assert.equal(validateReceiptFile(pdf), pdf)
})
test('caminho privado exige UUID do proprietário e do documento', () => {
  assert.equal(receiptStoragePath(uid, addr), `${uid}/${addr}.pdf`)
  assert.throws(() => receiptStoragePath('../admin', addr), /inválido/)
  assert.throws(() => receiptStoragePath(uid, 'pasta/arquivo'), /inválido/)
})
test('checkout com PDF armazena no bucket privado e chama RPC protegido sem preço editável', async () => {
  const { client, calls } = fakeClient()
  const result = await createRemoteOrders(client, { getToken: async () => {} }).createOrder(checkout({ receipt: pdf, status: 'pago', total: 0 }))
  assert.equal(result.status, 'aguardando_analise')
  assert.ok(calls.some(([op, bucket]) => op === 'bucket' && bucket === RECEIPT_BUCKET))
  const upload = calls.find(([type]) => type === 'upload')
  assert.match(upload[1], new RegExp(`^${uid}/[0-9a-f-]{36}\\.pdf$`))
  assert.equal(upload[3].upsert, false)
  assert.equal(upload[3].contentType, 'application/pdf')
  const rpc = calls.find(([type]) => type === 'rpc')
  assert.equal(rpc[1], 'farmavida_create_order_with_receipt')
  assert.deepEqual(rpc[2].p_items, [{ id: 1, qtd: 1 }])
  assert.equal(rpc[2].p_receipt_path, upload[1])
  assert.equal(rpc[2].p_file_name, pdf.name)
  assert.equal('p_status' in rpc[2], false)
  assert.equal('p_total' in rpc[2], false)
})
test('falha no upload bloqueia criação do pedido', async () => {
  const { client, calls } = fakeClient({ uploadError: { message: 'RLS denied', status: 403 } })
  await assert.rejects(() => createRemoteOrders(client).createOrder(checkout({ receipt: pdf })), /permissão/)
  assert.equal(calls.some(([op]) => op === 'rpc'), false)
})
test('falha na transação tenta remover PDF órfão, não conclui pedido', async () => {
  const { client, calls } = fakeClient({ rpc: { error: { message: 'Preço alterado' } } })
  await assert.rejects(() => createRemoteOrders(client).createOrder(checkout({ receipt: pdf })), /Preço alterado/)
  assert.equal(calls.filter(([op]) => op === 'remove').length, 1)
})
test('modo demonstração não salva PDF pessoal no armazenamento do navegador', async () => {
  const storage = { users: [{ id: uid }], addresses: [{ id: addr, user_id: uid }], orders: [] }
  const local = createLocalOrders({ loadDb: () => storage, saveDb: () => {}, currentLocalUserId: () => uid, newId: () => uid })
  await assert.rejects(() => local.createOrder(checkout({ receipt: pdf })), /exige Supabase/)
  assert.equal(storage.orders.length, 0)
  assert.equal(await createLocalReceipts().isPharmacist(), false)
})
test('checagem de revisor é realizada no servidor e retorna papel booleano', async () => {
  const { client, calls } = fakeClient({ rpc: { data: true, error: null } })
  assert.equal(await createRemoteReceipts(client).isPharmacist(), true)
  assert.equal(calls.at(-1)[1], 'farmavida_is_pharmacist')
})
test('rejeição exige motivo, e decisão válida usa RPC server-side', async () => {
  const { client, calls } = fakeClient({ rpc: { data: { status: 'rejeitada' }, error: null } })
  const service = createRemoteReceipts(client)
  await assert.rejects(() => service.reviewReceipt(addr, 'rejeitada', ''), /justificativa/)
  await assert.rejects(() => service.reviewReceipt(addr, 'pago', 'x'), /inválida/)
  assert.equal(calls.length, 0)
  await service.reviewReceipt(addr, 'rejeitada', 'Ausência de dados obrigatórios na receita fictícia')
  assert.equal(calls.at(-1)[1], 'farmavida_review_receipt')
  assert.equal(calls.at(-1)[2].p_note, 'Ausência de dados obrigatórios na receita fictícia')
})
test('URLs de PDF expiram em 60s e não são públicas', async () => {
  const { client, calls } = fakeClient()
  const service = createRemoteReceipts(client)
  assert.equal(await service.getReceiptUrl(`${uid}/${addr}.pdf`), 'https://safe.invalid/temp')
  assert.deepEqual(calls.at(-1), ['signed', `${uid}/${addr}.pdf`, 60])
  await assert.rejects(() => service.getReceiptUrl('../../secret.pdf'), /inválido/)
})
test('SQL usa bucket privado, papel de revisor explícito, auditoria e não concede alterações diretas ao cliente', () => {
  const sql = readFileSync(new URL('../supabase/etapas6-7-receitas.sql', import.meta.url), 'utf8')
  assert.match(sql, /farmavida-receitas', 'farmavida-receitas', false/)
  assert.match(sql, /create table if not exists public\.receipt_events/)
  assert.match(sql, /create table if not exists public\.pharmacist_users/)
  assert.match(sql, /revoke all on table public\.pharmacist_users from public, anon, authenticated/)
  assert.match(sql, /not private\.farmavida_has_pharmacist_role\(\)/)
  assert.match(sql, /for update;/)
  assert.match(sql, /already|já foi analisada/i)
  assert.match(sql, /grant select on public\.receipt_documents, public\.receipt_events to authenticated/)
  assert.doesNotMatch(sql, /grant (insert|update|delete|all) on public\.receipt_documents/)
})
