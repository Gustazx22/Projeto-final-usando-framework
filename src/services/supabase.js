import { createClient } from '@supabase/supabase-js'

// Uma configuração parcial não deve criar contas locais por engano.
export function readSupabaseConfig(env = {}) {
  const url = (env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '')
  const key = (env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || '').trim()
  const enabled = Boolean(url || key)
  let error = ''

  if (enabled) {
    if (!url || !key) {
      error = 'Preencha a URL e a chave pública do Supabase no arquivo .env e reinicie o Vite.'
    } else {
      try {
        const parsed = new URL(url)
        const local = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname)
        if (parsed.protocol !== 'https:' && !(local && parsed.protocol === 'http:')) throw new Error()
        if (parsed.pathname !== '/' || parsed.search || parsed.hash || parsed.username || parsed.password) throw new Error()
        if (/seu-projeto|sua-chave/i.test(`${url} ${key}`)) throw new Error()
      } catch {
        error = 'A configuração do Supabase é inválida. Confira a URL e a chave pública no .env.'
      }
      if (key.startsWith('sb_secret_')) {
        error = 'Use somente a chave pública anon ou publishable no frontend.'
      }
      // Chaves legadas são JWTs. A chave service_role nunca pertence ao frontend.
      try {
        const payload = key.split('.')[1]
        if (payload && JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))).role === 'service_role') {
          error = 'Use somente a chave pública anon ou publishable no frontend.'
        }
      } catch { /* Uma publishable key não é um JWT. */ }
    }
  }
  return { url, key, enabled, error }
}

const config = readSupabaseConfig(import.meta.env)
export const isRemote = config.enabled
export const supabaseUrl = config.url
export const supabaseKey = config.key
export const supabaseConfigError = config.error
export const supabase = config.enabled && !config.error
  ? createClient(config.url, config.key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  })
  : null
