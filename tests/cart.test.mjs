import test from 'node:test'
import assert from 'node:assert/strict'
import {
  CART_STORAGE_KEY, MAX_CART_QUANTITY, normalizeCartItem,
  sanitizeCart, readStoredCart, writeStoredCart,
} from '../src/services/cart.js'

const valid = (id = 1) => ({ id, name: `Produto ${id}`, category: 'cuidados', image: '/img.svg', price: 8.9, quantity: 2 })
const storage = (initial = null) => {
  const map = new Map(initial === null ? [] : [[CART_STORAGE_KEY, initial]])
  return { getItem: (key) => map.get(key) ?? null, setItem: (key, value) => map.set(key, value) }
}

test('carrinho vazio, JSON corrompido e armazenamento bloqueado não derrubam a aplicação', () => {
  assert.deepEqual(readStoredCart(storage()), [])
  assert.deepEqual(readStoredCart(storage('corrupted')), [])
  assert.deepEqual(readStoredCart({ getItem() { throw new Error('bloqueado') } }), [])
  assert.equal(writeStoredCart([valid()], { setItem() { throw new Error('bloqueado') } }), false)
})

test('itens inválidos e HTML/snapshots malformados são descartados na restauração', () => {
  assert.deepEqual(sanitizeCart([null, {}, { ...valid(), price: -1 }, { ...valid(), quantity: 0 }, valid()]), [valid()])
  assert.equal(normalizeCartItem({ ...valid(), id: 'not-an-id' }), null)
  assert.equal(normalizeCartItem({ ...valid(), name: '' }), null)
})

test('não duplica IDs e restringe quantidade a 99', () => {
  const recovered = sanitizeCart([valid(), { ...valid(), quantity: 98 }])
  assert.equal(recovered.length, 1)
  assert.equal(recovered[0].quantity, MAX_CART_QUANTITY)
})

test('limita linhas do carrinho e aceita dados antigos válidos', () => {
  assert.equal(sanitizeCart(Array.from({ length: 70 }, (_, i) => valid(i + 1))).length, 50)
  const source = storage(JSON.stringify([valid(2), valid(4)]))
  assert.equal(readStoredCart(source).length, 2)
  assert.equal(writeStoredCart([valid(2)], source), true)
  assert.equal(JSON.parse(source.getItem(CART_STORAGE_KEY))[0].id, 2)
})
