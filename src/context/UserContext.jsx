import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { UserContext } from './contexts.js'
import { db } from '../services/db'

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [addresses, setAddresses] = useState([])
  const [orders, setOrders] = useState([])
  const [receipts, setReceipts] = useState([])
  const [receiptEvents, setReceiptEvents] = useState([])
  const [reviewQueue, setReviewQueue] = useState([])
  const [isPharmacist, setIsPharmacist] = useState(false)
  const [roleLoaded, setRoleLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const [dataError, setDataError] = useState('')
  const [dataLoading, setDataLoading] = useState(false)
  const userRef = useRef(null)
  const dataRequest = useRef(0)
  const authRevision = useRef(0)
  const alive = useRef(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authTab, setAuthTab] = useState('login')
  const [accountOpen, setAccountOpen] = useState(false)
  const [accountTab, setAccountTab] = useState('dados')

  // Erros no carregamento de dados não invalidam o login.
  const loadData = useCallback(async (userId) => {
    if (!alive.current || !userId || userRef.current?.id !== userId) return
    const request = ++dataRequest.current
    setDataLoading(true)
    setDataError('')
    const [addr, ord, docs, events, pharmacist] = await Promise.allSettled([
      db.listAddresses(), db.listOrders(), db.listMyReceipts(), db.listReceiptEvents(), db.isPharmacist(),
    ])
    let queue = { status: 'fulfilled', value: [] }
    if (pharmacist.status === 'fulfilled' && pharmacist.value === true) {
      try { queue = { status: 'fulfilled', value: await db.listReviewQueue() } }
      catch (error) { queue = { status: 'rejected', reason: error } }
    }
    if (!alive.current || request !== dataRequest.current || userRef.current?.id !== userId) return
    setAddresses(addr.status === 'fulfilled' ? addr.value : [])
    setOrders(ord.status === 'fulfilled' ? ord.value : [])
    setReceipts(docs.status === 'fulfilled' ? docs.value : [])
    setReceiptEvents(events.status === 'fulfilled' ? events.value : [])
    setIsPharmacist(pharmacist.status === 'fulfilled' && pharmacist.value === true)
    setRoleLoaded(true)
    setReviewQueue(queue.status === 'fulfilled' ? queue.value : [])
    if ([addr, ord, docs, events, pharmacist, queue].some((result) => result.status === 'rejected')) {
      setDataError('Sua conta está conectada, mas alguns dados não carregaram. Confira o SQL das etapas 5–7 e tente novamente.')
    }
    setDataLoading(false)
  }, [])

  const applyUser = useCallback((nextUser) => {
    if (!alive.current) return
    const changed = userRef.current?.id !== nextUser?.id
    userRef.current = nextUser
    setUser(nextUser)
    setLoading(false)
    setAuthError('')
    if (changed || !nextUser) {
      ++dataRequest.current
      setAddresses([])
      setOrders([])
      setReceipts([])
      setReceiptEvents([])
      setReviewQueue([])
      setIsPharmacist(false)
      setRoleLoaded(false)
      setDataError('')
      setDataLoading(Boolean(nextUser))
      if (!nextUser) setAccountOpen(false)
      if (nextUser) queueMicrotask(() => { void loadData(nextUser.id) })
    }
  }, [loadData])

  useEffect(() => {
    let active = true
    alive.current = true
    const unsubscribe = db.subscribeAuth((nextUser) => {
      if (!active) return
      ++authRevision.current
      applyUser(nextUser)
    })
    const revision = authRevision.current
    void db.restore().then((restored) => {
      if (active && revision === authRevision.current) applyUser(restored)
    }).catch((error) => {
      if (active && revision === authRevision.current) {
        setAuthError(error.message || 'Não foi possível restaurar sua sessão. Tente entrar novamente.')
        setLoading(false)
      }
    })
    return () => {
      active = false
      alive.current = false
      dataRequest.current += 1
      unsubscribe()
    }
  }, [applyUser])

  const register = useCallback(async (data) => {
    setAuthError('')
    return db.signUp(data)
  }, [])

  const login = useCallback(async (credentials) => {
    setAuthError('')
    return db.signIn(credentials)
  }, [])

  const changePassword = useCallback(async (data) => db.changePassword(data), [])
  const requestPasswordReauth = useCallback(async () => db.requestPasswordReauth(), [])

  const logout = useCallback(async () => {
    await db.signOut()
  }, [])

  const reloadAccountData = useCallback(() => loadData(userRef.current?.id), [loadData])

  const addAddress = useCallback(async (address) => {
    const owner = userRef.current?.id
    const created = await db.addAddress(address)
    const list = await db.listAddresses()
    if (alive.current && owner === userRef.current?.id) setAddresses(list)
    return created
  }, [])

  const updateAddress = useCallback(async (id, address) => {
    const owner = userRef.current?.id
    const updated = await db.updateAddress(id, address)
    const list = await db.listAddresses()
    if (alive.current && owner === userRef.current?.id) setAddresses(list)
    return updated
  }, [])

  const removeAddress = useCallback(async (id) => {
    const owner = userRef.current?.id
    await db.removeAddress(id)
    const list = await db.listAddresses()
    if (alive.current && owner === userRef.current?.id) setAddresses(list)
  }, [])

  const setDefaultAddress = useCallback(async (id) => {
    const owner = userRef.current?.id
    await db.setDefaultAddress(id)
    const list = await db.listAddresses()
    if (alive.current && owner === userRef.current?.id) setAddresses(list)
  }, [])

  const placeOrder = useCallback(async (order) => {
    const owner = userRef.current?.id
    const created = await db.createOrder(order)
    if (alive.current && owner === userRef.current?.id) {
      setOrders((prev) => [created, ...prev])
      if (order.receipt) void loadData(owner)
    }
    return created
  }, [loadData])

  const reviewReceipt = useCallback(async (receiptId, decision, note) => {
    const result = await db.reviewReceipt(receiptId, decision, note)
    await loadData(userRef.current?.id)
    return result
  }, [loadData])
  const getReceiptUrl = useCallback((path) => db.getReceiptUrl(path), [])

  const openAuth = useCallback((tab = 'login') => { setAuthTab(tab); setAuthOpen(true) }, [])
  const closeAuth = useCallback(() => setAuthOpen(false), [])
  const openAccount = useCallback((tab = 'dados') => { setAccountTab(tab); setAccountOpen(true) }, [])
  const closeAccount = useCallback(() => setAccountOpen(false), [])

  const value = useMemo(() => ({
    user,
    isLoggedIn: !!user,
    loading, authError, dataError, dataLoading, reloadAccountData,
    register,
    login,
    logout, changePassword, requestPasswordReauth,
    addresses,
    defaultAddress: addresses.find((a) => a.isDefault) || addresses[0] || null,
    addAddress,
    updateAddress,
    removeAddress,
    setDefaultAddress,
    orders, receipts, receiptEvents, reviewQueue, isPharmacist, roleLoaded, reviewReceipt, getReceiptUrl,
    placeOrder,
    authOpen, authTab, setAuthTab, openAuth, closeAuth,
    accountOpen, accountTab, setAccountTab, openAccount, closeAccount,
  }), [user, loading, authError, dataError, dataLoading, reloadAccountData, register, login, logout, changePassword, requestPasswordReauth, addresses, addAddress, updateAddress, removeAddress, setDefaultAddress,
    orders, receipts, receiptEvents, reviewQueue, isPharmacist, roleLoaded, reviewReceipt, getReceiptUrl, placeOrder, authOpen, authTab, openAuth, closeAuth, accountOpen, accountTab, openAccount, closeAccount])

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

