import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'

const CartContext = createContext(undefined)

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('farmavida-cart')
    return saved ? JSON.parse(saved) : []
  })
  const [isOpen, setIsOpen] = useState(false)

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('farmavida-cart', JSON.stringify(items))
  }, [items])

  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items])
  const totalPrice = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items])

  const addItem = useCallback((newItem) => {
    setItems(prev => {
      const existing = prev.find(item => item.id === newItem.id)
      if (existing) {
        return prev.map(item =>
          item.id === newItem.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { ...newItem, quantity: 1 }]
    })
    setIsOpen(true)
  }, [])

  const removeItem = useCallback((id) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }, [])

  const updateQuantity = useCallback((id, quantity) => {
    if (quantity <= 0) {
      removeItem(id)
      return
    }
    setItems(prev => prev.map(item => item.id === id ? { ...item, quantity } : item))
  }, [removeItem])

  const clearCart = useCallback(() => {
    setItems([])
    setIsOpen(false)
  }, [])

  const openCart = useCallback(() => setIsOpen(true), [])
  const closeCart = useCallback(() => setIsOpen(false), [])
  const toggleCart = useCallback(() => setIsOpen(prev => !prev), [])

  const value = useMemo(() => ({
    items,
    totalItems,
    totalPrice,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    isOpen,
    openCart,
    closeCart,
    toggleCart,
  }), [items, totalItems, totalPrice, addItem, removeItem, updateQuantity, clearCart, isOpen, openCart, closeCart, toggleCart])

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart deve ser usado dentro de um CartProvider')
  }
  return context
}