import { useState, useCallback, useMemo, useEffect } from 'react'
import { CartContext } from './contexts.js'
import {
  CART_STORAGE_KEY, MAX_CART_LINES, MAX_CART_QUANTITY,
  normalizeCartItem, readStoredCart, writeStoredCart,
} from '../services/cart.js'


export function CartProvider({ children }) {
  const [items, setItems] = useState(readStoredCart)
  const [isOpen, setIsOpen] = useState(false)

  // Carrinho persistente, mesmo se o armazenamento estiver corrompido/indisponível.
  useEffect(() => { writeStoredCart(items) }, [items])

  // Outras abas abertas no navegador recebem as alterações sem exigir F5.
  useEffect(() => {
    const sync = (event) => {
      if (event.key === CART_STORAGE_KEY || event.key === null) {
        setItems(readStoredCart())
      }
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items])
  const totalPrice = useMemo(() => Math.round(items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100, [items])

  const addItem = useCallback((newItem) => {
    const item = normalizeCartItem({ ...newItem, quantity: 1 })
    if (!item) return
    setItems((previous) => {
      const existing = previous.find((x) => x.id === item.id)
      if (existing) return previous.map((x) => x.id === item.id
        ? { ...item, quantity: Math.min(MAX_CART_QUANTITY, x.quantity + 1) } : x)
      if (previous.length >= MAX_CART_LINES) return previous
      return [...previous, item]
    })
    setIsOpen(true)
  }, [])

  const removeItem = useCallback((id) => { setItems((previous) => previous.filter((x) => x.id !== id)) }, [])
  const updateQuantity = useCallback((id, quantity) => {
    if (!Number.isSafeInteger(quantity)) return
    setItems((previous) => quantity <= 0
      ? previous.filter((x) => x.id !== id)
      : previous.map((x) => x.id === id ? { ...x, quantity: Math.min(quantity, MAX_CART_QUANTITY) } : x))
  }, [])

  const clearCart = useCallback(() => { setItems([]); setIsOpen(false) }, [])
  const openCart = useCallback(() => setIsOpen(true), [])
  const closeCart = useCallback(() => setIsOpen(false), [])
  const toggleCart = useCallback(() => setIsOpen((previous) => !previous), [])

  const value = useMemo(() => ({
    items, totalItems, totalPrice, addItem, removeItem, updateQuantity,
    clearCart, isOpen, openCart, closeCart, toggleCart,
  }), [items, totalItems, totalPrice, addItem, removeItem, updateQuantity,
    clearCart, isOpen, openCart, closeCart, toggleCart])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

