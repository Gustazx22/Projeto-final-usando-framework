import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'

const UserContext = createContext(undefined)

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('farmavida-user')
    return saved ? JSON.parse(saved) : null
  })
  const [addresses, setAddresses] = useState(() => {
    const saved = localStorage.getItem('farmavida-addresses')
    return saved ? JSON.parse(saved) : []
  })
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Persist user
  useEffect(() => {
    if (user) {
      localStorage.setItem('farmavida-user', JSON.stringify(user))
      setIsLoggedIn(true)
    } else {
      localStorage.removeItem('farmavida-user')
      setIsLoggedIn(false)
    }
  }, [user])

  // Persist addresses
  useEffect(() => {
    localStorage.setItem('farmavida-addresses', JSON.stringify(addresses))
  }, [addresses])

  const login = useCallback((userData) => {
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  const addAddress = useCallback((address) => {
    const newAddress = {
      ...address,
      id: Date.now().toString(),
      isDefault: addresses.length === 0
    }
    setAddresses(prev => [...prev, newAddress])
    return newAddress
  }, [addresses])

  const updateAddress = useCallback((id, addressData) => {
    setAddresses(prev => prev.map(addr => 
      addr.id === id ? { ...addr, ...addressData } : addr
    ))
  }, [])

  const removeAddress = useCallback((id) => {
    setAddresses(prev => {
      const filtered = prev.filter(addr => addr.id !== id)
      // If we removed the default, make the first one default
      if (filtered.length > 0 && !filtered.some(a => a.isDefault)) {
        filtered[0].isDefault = true
      }
      return filtered
    })
  }, [])

  const setDefaultAddress = useCallback((id) => {
    setAddresses(prev => prev.map(addr => ({
      ...addr,
      isDefault: addr.id === id
    })))
  }, [])

  const value = useMemo(() => ({
    user,
    isLoggedIn,
    login,
    logout,
    addresses,
    addAddress,
    updateAddress,
    removeAddress,
    setDefaultAddress,
    defaultAddress: addresses.find(a => a.isDefault) || addresses[0] || null
  }), [user, isLoggedIn, login, logout, addresses, addAddress, updateAddress, removeAddress, setDefaultAddress])

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser deve ser usado dentro de um UserProvider')
  }
  return context
}