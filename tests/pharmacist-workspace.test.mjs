import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createPharmacistDashboard, normalizeDashboard } from '../src/services/pharmacistDashboard.js'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('dashboard converte métricas e valida formato de resposta', () => {
  const result = normalizeDashboard({ orders_total: '4', orders_value: 22.5, pending_receipts: 1,
    daily_orders: [{ date: '2026-11-21', count: '3', value: '20' }],
    order_statuses: [{ status: 'pendente', count: '2' }] })
  assert.equal(result.orders_total, 4)
  assert.equal(result.orders_value, 22.5)
  assert.equal(result.daily_orders[0].count, 3)
  assert.equal(result.order_statuses[0].count, 2)
  assert.equal(result.rejected_receipts, 0)
  assert.throws(() => normalizeDashboard(null), /Resposta inválida/)
})

test('dashboard não utiliza consultas diretas a pedidos de terceiros', async () => {
  const used = []
  const client = { rpc: async (name) => { used.push(name); return {data:{orders_total:2}, error:null} } }
  const stats = await createPharmacistDashboard(client).getPharmacistDashboard()
  assert.equal(stats.orders_total, 2)
  assert.deepEqual(used, ['farmavida_pharmacist_dashboard'])
})

test('erros da RPC são tratados para SQL ausente e acesso negado', async () => {
  const notInstalled = {rpc: async () => ({data:null,error:{code:'PGRST202'}})}
  await assert.rejects(createPharmacistDashboard(notInstalled).getPharmacistDashboard(),/painel-farmaceutico.sql/)
  const noRole = {rpc: async () => ({data:null,error:{code:'42501'}})}
  await assert.rejects(createPharmacistDashboard(noRole).getPharmacistDashboard(),/permissão/)
})

test('páginas e navegação do farmacêutico são separadas da área da conta', () => {
  const app = read('src/App.jsx')
  const account = read('src/components/AccountModal/AccountModal.jsx')
  const panel = read('src/components/PharmacistWorkspace/PharmacistWorkspace.jsx')
  assert.match(app, /isPharmacist && selectedView !== 'client'/)
  assert.match(app, /onViewStore/)
  assert.doesNotMatch(app,/import Benefits/)
  assert.doesNotMatch(account,/ReceiptReviewPanel|\['analise'/)
  assert.match(panel,/Ver loja do cliente/)
  assert.match(panel,/Visão geral/)
  assert.match(panel,/Análise de receitas/)
  assert.match(panel,/ReceiptReviewPanel/)
})

test('SQL restringe indicadores ao farmacêutico e não expõe dados pessoais', () => {
  const sql = read('supabase/painel-farmaceutico.sql')
  assert.match(sql,/private\.farmavida_has_pharmacist_role\(\)/)
  assert.match(sql,/security definer/i)
  assert.match(sql,/revoke all on function public\.farmavida_pharmacist_dashboard\(\) from public, anon/i)
  assert.doesNotMatch(sql,/grant select on public\.orders to authenticated/i)
})

test('hero não deixa o card sobreposto fora de sua área e respeita movimento reduzido', () => {
  const css = read('src/components/Hero/Hero.css')
  assert.match(css,/bottom:\s*3\.5%/)
  assert.match(css,/@media \(prefers-reduced-motion: reduce\)/)
})

test('permissão de farmacêutico carrega antes de selecionar o painel inicial', () => {
  const provider = read('src/context/UserContext.jsx')
  const app = read('src/App.jsx')
  assert.match(provider, /setRoleLoaded\(true\)/)
  assert.match(app, /user && !roleLoaded/)
  assert.match(app, /view\.userId === user\?\.id/)
})
