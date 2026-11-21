/**
 * Camada de banco de dados do FarmaVida.
 *
 * - Com URL e chave pública no .env, usa o Supabase
 *   (PostgreSQL + autenticação). O cliente oficial gerencia a sessão; as tabelas usam REST.
 * - Sem essas variáveis, usa o modo demonstração: tudo fica no localStorage do navegador.
 *
 * Os componentes continuam usando as mesmas operações em ambos os modos.
 */
import { isRemote, supabase, supabaseConfigError } from './supabase.js'
import { createRemoteAuth } from './auth.js'
import { validatePasswordChange } from './passwords.js'
import { createRemoteAddresses, createLocalAddresses } from './addresses.js'
import { createRemoteCatalog, createLocalCatalog } from './catalog.js'
import { createRemoteOrders, createLocalOrders } from './orders.js'
import { createRemoteReceipts, createLocalReceipts } from './receipts.js'

export { isRemote } from './supabase.js'

const remoteAuth = createRemoteAuth(supabase, {
  configurationError: supabaseConfigError,
  redirectTo: typeof window !== 'undefined' ? window.location.origin + window.location.pathname : undefined,
})
const getToken = () => remoteAuth.getToken()
const remoteAddresses = createRemoteAddresses(supabase, { getToken })

const SESSION_KEY = 'farmavida-session'
const LOCAL_DB_KEY = 'farmavida-localdb'

const readJSON = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}
const writeJSON = (key, value) => localStorage.setItem(key, JSON.stringify(value))

const remote = {
  ...createRemoteCatalog(supabase),
  ...remoteAuth,
  ...remoteAddresses,
  ...createRemoteOrders(supabase, { getToken }),
  ...createRemoteReceipts(supabase, { getToken }),
}

/* ====================== Modo demonstração (localStorage) ====================== */
const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`)
const loadDb = () => readJSON(LOCAL_DB_KEY, { users: [], addresses: [], orders: [] })
const saveDb = (db) => writeJSON(LOCAL_DB_KEY, db)

async function hash(text) {
  if (crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`farmavida:${text}`))
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
  }
  return btoa(unescape(encodeURIComponent(`farmavida:${text}`)))
}

const currentLocalUserId = () => readJSON(SESSION_KEY, null)?.userId
const publicUser = (u) => ({ id: u.id, email: u.email, nome: u.nome, telefone: u.telefone, cpf: u.cpf })
const localAuthListeners = new Set()
const notifyLocalAuth = (user, event) => localAuthListeners.forEach((listener) => listener(user, event))

const localAddresses = createLocalAddresses({ loadDb, saveDb, currentLocalUserId, newId })

const local = {
  ...createLocalCatalog(),
  async signUp({ email, password, nome, telefone, cpf }) {
    const db = loadDb()
    const mail = email.trim().toLowerCase()
    if (db.users.some((u) => u.email === mail)) throw new Error('Este e-mail já está cadastrado.')
    if (password.length < 6) throw new Error('A senha precisa ter pelo menos 6 caracteres.')
    const user = { id: newId(), email: mail, nome, telefone, cpf, hash: await hash(password) }
    db.users.push(user)
    saveDb(db)
    writeJSON(SESSION_KEY, { userId: user.id })
    notifyLocalAuth(publicUser(user), 'SIGNED_IN')
    return { user: publicUser(user), needsConfirmation: false }
  },
  async signIn({ email, password }) {
    const db = loadDb()
    const user = db.users.find((u) => u.email === email.trim().toLowerCase())
    if (!user || user.hash !== (await hash(password))) throw new Error('E-mail ou senha incorretos.')
    writeJSON(SESSION_KEY, { userId: user.id })
    notifyLocalAuth(publicUser(user), 'SIGNED_IN')
    return publicUser(user)
  },
  async changePassword({ currentPassword, newPassword }) {
    validatePasswordChange({ currentPassword, newPassword })
    const id = currentLocalUserId()
    if (!id) throw new Error('Faça login para alterar a senha.')
    const database = loadDb()
    const user = database.users.find((u) => u.id === id)
    if (!user) throw new Error('Sua sessão expirou. Entre novamente.')
    if (user.hash !== await hash(currentPassword)) throw new Error('A senha atual está incorreta.')
    user.hash = await hash(newPassword)
    saveDb(database)
  },
  async requestPasswordReauth() {
    throw new Error('A confirmação por e-mail só está disponível com Supabase.')
  },
  async signOut() {
    localStorage.removeItem(SESSION_KEY)
    notifyLocalAuth(null, 'SIGNED_OUT')
  },
  subscribeAuth(listener) {
    localAuthListeners.add(listener)
    const onStorage = async (event) => {
      if (event.key === SESSION_KEY || event.key === null) {
        const user = await local.restore()
        listener(user, user ? 'SIGNED_IN' : 'SIGNED_OUT')
      }
    }
    window.addEventListener('storage', onStorage)
    return () => {
      localAuthListeners.delete(listener)
      window.removeEventListener('storage', onStorage)
    }
  },
  async restore() {
    const id = currentLocalUserId()
    const user = id && loadDb().users.find((u) => u.id === id)
    return user ? publicUser(user) : null
  },
  ...localAddresses,
  ...createLocalOrders({ loadDb, saveDb, currentLocalUserId, newId }),
  ...createLocalReceipts(),
}

export const db = isRemote ? remote : local
