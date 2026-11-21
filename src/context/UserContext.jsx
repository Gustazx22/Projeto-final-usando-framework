import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import { db } from '../services/db'

const UserContext = createContext(undefined)

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [addresses, setAddresses] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [authOpen, setAuthOpen] = useState(false)
  const [authTab, setAuthTab] = useState('login')
  const [accountOpen, setAccountOpen] = useState(false)
  const [accountTab, setAccountTab] = useState('dados')

  const loadData = useCallback(async () => {
    const [addr, ord] = await Promise.all([db.listAddresses(), db.listOrders()])
    setAddresses(addr)
    setOrders(ord)
  }, [])

  // Restaura a sessão ao abrir o site
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const u = await db.restore()
        if (cancelled) return
        if (u) { setUser(u); await loadData() }
      } catch { /* sem sessão */ }
      if (!cancelled) setLoading(false)
    })()
    return () => { cancelled = true }
  }, [loadData])

  const register = useCallback(async (data) => {
    const result = await db.signUp(data)
    if (result.user) {
      setUser(result.user)
      await loadData()
    }
    return result
  }, [loadData])

  const login = useCallback(async (credentials) => {
    const u = await db.signIn(credentials)
    setUser(u)
    await loadData()
    return u
  }, [loadData])

  const logout = useCallback(async () => {
    await db.signOut()
    setUser(null)
    setAddresses([])
    setOrders([])
    setAccountOpen(false)
  }, [])

  const addAddress = useCallback(async (address) => {
    const created = await db.addAddress({ ...address, isDefault: address.isDefault || addresses.length === 0 })
    setAddresses(await db.listAddresses())
    return created
  }, [addresses.length])

  const removeAddress = useCallback(async (id) => {
    await db.removeAddress(id)
    const list = await db.listAddresses()
    if (list.length > 0 && !list.some((a) => a.isDefault)) {
      await db.setDefaultAddress(list[0].id)
      setAddresses(await db.listAddresses())
    } else {
      setAddresses(list)
    }
  }, [])

  const setDefaultAddress = useCallback(async (id) => {
    await db.setDefaultAddress(id)
    setAddresses(await db.listAddresses())
  }, [])

  const placeOrder = useCallback(async (order) => {
    const created = await db.createOrder(order)
    setOrders((prev) => [created, ...prev])
    return created
  }, [])

  const openAuth = useCallback((tab = 'login') => { setAuthTab(tab); setAuthOpen(true) }, [])
  const closeAuth = useCallback(() => setAuthOpen(false), [])
  const openAccount = useCallback((tab = 'dados') => { setAccountTab(tab); setAccountOpen(true) }, [])
  const closeAccount = useCallback(() => setAccountOpen(false), [])

  const value = useMemo(() => ({
    user,
    isLoggedIn: !!user,
    loading,
    register,
    login,
    logout,
    addresses,
    defaultAddress: addresses.find((a) => a.isDefault) || addresses[0] || null,
    addAddress,
    removeAddress,
    setDefaultAddress,
    orders,
    placeOrder,
    authOpen, authTab, setAuthTab, openAuth, closeAuth,
    accountOpen, accountTab, setAccountTab, openAccount, closeAccount,
  }), [user, loading, register, login, logout, addresses, addAddress, removeAddress, setDefaultAddress,
    orders, placeOrder, authOpen, authTab, openAuth, closeAuth, accountOpen, accountTab, openAccount, closeAccount])

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) throw new Error('useUser deve ser usado dentro de um UserProvider')
  return context
}
