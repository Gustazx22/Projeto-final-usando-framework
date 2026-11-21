import test from 'node:test'
import assert from 'node:assert/strict'
import { createLocalCatalog } from '../src/services/catalog.js'
import { filterCatalog, normalizeCatalogText, countCatalogProducts } from '../src/services/catalogFilters.js'

const source = await createLocalCatalog().listCatalog()

const names = (groups) => groups.flatMap((group) => group.products.map((product) => product.name))

test('sem filtros: mantém as 6 categorias e os 36 produtos originais', () => {
  const filtered = filterCatalog(source)
  assert.equal(filtered.length, 6)
  assert.equal(countCatalogProducts(filtered), 36)
  assert.deepEqual(filtered.map(({ id }) => id), source.map(({ id }) => id))
})

test('busca por nome, mesmo em minúsculas e sem acentos', () => {
  const filtered = filterCatalog(source, { query: 'termometro' })
  assert.deepEqual(names(filtered), ['Termômetro Digital'])
  assert.equal(countCatalogProducts(filtered), 1)
})

test('busca pela descrição do produto', () => {
  const filtered = filterCatalog(source, { query: 'caspa e seborreia' })
  assert.deepEqual(names(filtered), ['Shampoo Anticaspa'])
})

test('busca por várias palavras independente de maiúsculas, acentos e espaços', () => {
  const filtered = filterCatalog(source, { query: '  PROTETOR   solar  ' })
  assert.ok(names(filtered).includes('Protetor Solar FPS 50'))
  assert.ok(names(filtered).includes('Protetor Solar + Pós-sol'))
  assert.equal(normalizeCatalogText('HIGIENE e BELEZA'), 'higiene e beleza')
})

test('filtro de categoria mostra só seus produtos', () => {
  const filtered = filterCatalog(source, { categoryId: 'higiene' })
  assert.equal(filtered.length, 1)
  assert.equal(filtered[0].id, 'higiene')
  assert.equal(filtered[0].products.length, 6)
})

test('busca e categoria são combinadas', () => {
  const filtered = filterCatalog(source, { query: 'solar', categoryId: 'higiene' })
  assert.deepEqual(names(filtered), ['Protetor Solar FPS 50'])
})

test('termo inexistente retorna lista vazia para exibir estado sem resultados', () => {
  const filtered = filterCatalog(source, { query: 'produto-que-nao-existe-123' })
  assert.deepEqual(filtered, [])
  assert.equal(countCatalogProducts(filtered), 0)
})

test('categoria desconhecida também retorna resultado vazio', () => {
  assert.deepEqual(filterCatalog(source, { categoryId: 'inexistente' }), [])
})

test('busca só com espaços mantém catálogo; não altera origem', () => {
  const before = JSON.stringify(source)
  assert.equal(countCatalogProducts(filterCatalog(source, { query: '   ' })), 36)
  filterCatalog(source, { query: 'shampoo' })[0].products.pop()
  assert.equal(JSON.stringify(source), before)
})

test('função aceita catálogo vazio', () => {
  assert.deepEqual(filterCatalog([]), [])
  assert.equal(countCatalogProducts([]), 0)
})
