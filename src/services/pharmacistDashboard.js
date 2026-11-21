/** Indicadores agregados: apenas RPC protegida para usuários farmacêuticos. */
export const EMPTY_DASHBOARD = Object.freeze({
  orders_total: 0,
  orders_last_30_days: 0,
  orders_value: 0,
  orders_value_last_30_days: 0,
  pending_receipts: 0,
  approved_receipts: 0,
  rejected_receipts: 0,
  daily_orders: [],
  order_statuses: [],
})

export function normalizeDashboard(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Resposta inválida do dashboard.')
  const nonNegative = (v) => Number.isFinite(Number(v)) && Number(v) >= 0 ? Number(v) : 0
  return {
    orders_total: nonNegative(raw.orders_total),
    orders_last_30_days: nonNegative(raw.orders_last_30_days),
    orders_value: nonNegative(raw.orders_value),
    orders_value_last_30_days: nonNegative(raw.orders_value_last_30_days),
    pending_receipts: nonNegative(raw.pending_receipts),
    approved_receipts: nonNegative(raw.approved_receipts),
    rejected_receipts: nonNegative(raw.rejected_receipts),
    daily_orders: (Array.isArray(raw.daily_orders) ? raw.daily_orders : []).map((item) => ({
      date: String(item.date || ''), count: nonNegative(item.count), value: nonNegative(item.value),
    })),
    order_statuses: (Array.isArray(raw.order_statuses) ? raw.order_statuses : []).map((item) => ({
      status: String(item.status || ''), count: nonNegative(item.count),
    })),
  }
}

export function createPharmacistDashboard(client) {
  return {
    async getPharmacistDashboard() {
      if (!client) throw new Error('O painel requer Supabase configurado.')
      const { data, error } = await client.rpc('farmavida_pharmacist_dashboard')
      if (error) {
        if (['PGRST202', '42883'].includes(error.code)) {
          throw new Error('Painel ainda não configurado: execute supabase/painel-farmaceutico.sql no SQL Editor.')
        }
        if (error.code === '42501' || error.status === 403) throw new Error('Seu usuário não tem permissão para acessar este painel.')
        throw new Error(error.message || 'Não foi possível carregar o painel.')
      }
      return normalizeDashboard(data)
    },
  }
}
