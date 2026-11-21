import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createLocalCatalog, createRemoteCatalog } from '../src/services/catalog.js'

const sampleCategory = { id: 'higiene', label: 'Higiene e Beleza', sort_order: 3 }
const sampleProduct = {
  id: 3, category_id: 'higiene', name: 'Protetor Solar FPS 50', price: '45.90',
  image: '/products/higiene/protetor-solar.svg', badge: 'sale',
  description: 'UVA/UVB resistente à água', sort_order: 0, requires_prescription: false,
}

function remoteFixture({ categories = [sampleCategory], products = [sampleProduct], failures = {} } = {}) {
  const calls = []
  const client = {
    from(table) {
      calls.push(['from', table])
      const query = {
        select(columns) { calls.push(['select', table, columns]); return query },
        eq(field, value) { calls.push(['eq', table, field, value]); return query },
        order(column, params) { calls.push(['order', table, column, params]); return query },
        then(resolve, reject) {
          return Promise.resolve(failures[table] ?? { data: table === 'products' ? products : categories, error: null })
            .then(resolve, reject)
        },
      }
      return query
    },
  }
  return { catalog: createRemoteCatalog(client), calls }
}

test('demonstração mantém 6 categorias, 36 produtos e ids únicos', async () => {
  const categories = await createLocalCatalog().listCatalog()
  assert.deepEqual(categories.map((x) => x.id), [
    'medicamentos', 'genericos', 'vitaminas', 'higiene', 'cuidados', 'ofertas',
  ])
  assert.equal(categories.length, 6)
  assert.equal(categories.reduce((total, x) => total + x.products.length, 0), 36)
  const ids = categories.flatMap((x) => x.products.map((p) => p.id))
  assert.equal(new Set(ids).size, 36)
  assert.ok(categories.flatMap((x) => x.products).every((p) => Number.isFinite(p.price)))
})

test('demonstração preserva os 6 SVGs locais de Higiene e Beleza', async () => {
  const categories = await createLocalCatalog().listCatalog()
  const hygiene = categories.find((x) => x.id === 'higiene')
  assert.equal(hygiene.products.length, 6)
  assert.ok(hygiene.products.every((p) => p.image.startsWith('/products/higiene/') && p.image.endsWith('.svg')))
})

test('demonstração não compartilha objetos mutáveis entre consultas', async () => {
  const local = createLocalCatalog()
  const first = await local.listCatalog()
  first[0].products[0].price = 0
  first[0].products.push({ id: 999 })
  const second = await local.listCatalog()
  assert.equal(second[0].products[0].price, 8.9)
  assert.equal(second[0].products.length, 6)
})

test('Supabase converte preço numeric do banco para número, mantendo IDs e campos do carrossel', async () => {
  const { catalog } = remoteFixture()
  const rows = await catalog.listCatalog()
  assert.deepEqual(rows, [{
    id: 'higiene', label: 'Higiene e Beleza', products: [{
      id: 3, name: 'Protetor Solar FPS 50', category: 'higiene', price: 45.9,
      image: '/products/higiene/protetor-solar.svg', badge: 'sale',
      description: 'UVA/UVB resistente à água', requiresPrescription: false,
    }],
  }])
})

test('Supabase consulta apenas registros ativos e ordenados, sem escrever no banco', async () => {
  const { catalog, calls } = remoteFixture()
  await catalog.listCatalog()
  assert.deepEqual(calls.filter((x) => x[0] === 'from').map((x) => x[1]), ['product_categories', 'products'])
  assert.deepEqual(calls.filter((x) => x[0] === 'eq'), [
    ['eq', 'product_categories', 'active', true],
    ['eq', 'products', 'active', true],
  ])
  assert.equal(calls.filter((x) => x[0] === 'order').length, 4)
  assert.deepEqual(calls.filter((x) => x[0] === 'select').length, 2)
})

test('Supabase mostra categorias vazias sem criar produtos falsos', async () => {
  const { catalog } = remoteFixture({ products: [] })
  assert.deepEqual(await catalog.listCatalog(), [{ id: 'higiene', label: 'Higiene e Beleza', products: [] }])
})

test('Supabase não mostra produtos cuja categoria não está ativa ou foi removida', async () => {
  const { catalog } = remoteFixture({ categories: [], products: [sampleProduct] })
  assert.deepEqual(await catalog.listCatalog(), [])
})

test('Supabase retorna instrução útil quando não encontrou tabela', async () => {
  const { catalog } = remoteFixture({ failures: {
    products: { data: null, error: { code: 'PGRST205', message: 'Table not found' } },
  } })
  await assert.rejects(catalog.listCatalog(), /etapa3-catalogo.sql/)
})

test('Supabase acusa erro de permissão sem cair no modo demonstração', async () => {
  const { catalog } = remoteFixture({ failures: {
    product_categories: { data: null, error: { code: '42501', message: 'permission denied' } },
  } })
  await assert.rejects(catalog.listCatalog(), /políticas/)
})

test('Supabase rejeita preços inválidos em vez de mostrar preço incorreto', async () => {
  const { catalog } = remoteFixture({ products: [{ ...sampleProduct, price: 'NaN' }] })
  await assert.rejects(catalog.listCatalog(), /dados inválidos/)
})

test('Supabase rejeita resposta inesperada sem fingir resultado vazio', async () => {
  const { catalog } = remoteFixture({ failures: { products: { data: null, error: null } } })
  await assert.rejects(catalog.listCatalog(), /Resposta inválida/)
})

test('O SQL protege o catálogo contra escritas pelo frontend e sem apagar registros', () => {
  const sql = readFileSync(new URL('../supabase/etapa3-catalogo.sql', import.meta.url), 'utf8')
  assert.match(sql, /enable row level security/g)
  assert.match(sql, /grant select on table public.products to anon, authenticated;/)
  assert.match(sql, /grant select on table public.product_categories to anon, authenticated;/)
  assert.match(sql, /on conflict \(id\) do nothing;/g)
  assert.doesNotMatch(sql, /\btruncate\b|\bdelete from\b/i)
})
