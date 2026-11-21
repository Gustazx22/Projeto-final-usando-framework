/** Pedidos: somente ID + quantidade vão para o servidor; preços/status são calculados no banco. */
import { demoCatalog } from '../data/demoCatalog.js'
import { RECEIPT_BUCKET, validateReceiptFile, receiptStoragePath, displayReceiptError } from './receipts.js'

export const SHIPPING_FREE_FROM = 100
export const SHIPPING_FEE = 12.90
const PAYMENT_METHODS = new Set(['pix', 'cartao', 'boleto', 'whatsapp'])

function money(value) { return Math.round(value * 100) / 100 }

export function normalizeOrderInput(order) {
  if (!order || typeof order !== 'object') throw new Error('Informe um pedido válido.')
  if (!Array.isArray(order.items) || order.items.length === 0 || order.items.length > 50) {
    throw new Error('O pedido precisa conter de 1 a 50 produtos.')
  }
  const ids = new Set()
  const items = order.items.map((value) => {
    const id = Number(value?.id)
    const qtd = Number(value?.qtd)
    if (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(qtd) || qtd < 1 || qtd > 99) {
      throw new Error('Produto ou quantidade inválidos no carrinho (limite: 99 unidades por produto).')
    }
    if (ids.has(id)) throw new Error('O pedido contém produtos repetidos.')
    ids.add(id)
    return { id, qtd }
  })
  if (!PAYMENT_METHODS.has(order.payment)) throw new Error('Forma de pagamento inválida.')
  if (typeof order.addressId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(order.addressId)) {
    throw new Error('Selecione um endereço de entrega válido.')
  }
  const expectedTotal = Number(order.expectedTotal)
  if (!Number.isFinite(expectedTotal) || expectedTotal < 0 || expectedTotal > 99999999) {
    throw new Error('O valor do pedido é inválido.')
  }
  const observations = String(order.observacoes || '').trim()
  if (observations.length > 500) throw new Error('As observações devem ter até 500 caracteres.')
  if (order.receipt) validateReceiptFile(order.receipt)
  return { items, addressId: order.addressId, payment: order.payment,
    expectedTotal: money(expectedTotal), observations, receipt: order.receipt || null }
}

function translateOrderError(error) {
  const message = error?.message || 'Não foi possível registrar o pedido.'
  if (error?.code === 'PGRST202' || error?.code === '42883') {
    return new Error('Função de pedidos não encontrada. Execute supabase/etapa5-pedidos.sql no SQL Editor e tente novamente.')
  }
  if (error?.code === '42501') return new Error('Sem permissão para criar este pedido. Entre novamente na sua conta.')
  return new Error(message)
}

export function createRemoteOrders(client, { getToken } = {}) {
  return {
    async createOrder(input) {
      const order = normalizeOrderInput(input)
      if (!client) throw new Error('Configure o Supabase no arquivo .env.')
      if (getToken) await getToken()
      const baseParams = {
        p_items: order.items,
        p_address_id: order.addressId,
        p_payment: order.payment,
        p_observations: order.observations,
        p_expected_total: order.expectedTotal,
      }
      let uploadPath = null
      let data
      if (order.receipt) {
        // O arquivo é privado e só recebe vínculo após validação da transação SQL.
        const { data: authData, error: authError } = await client.auth.getUser()
        if (authError || !authData?.user?.id) throw new Error('Entre novamente para enviar sua receita.')
        uploadPath = receiptStoragePath(authData.user.id, crypto.randomUUID())
        const { error: uploadError } = await client.storage.from(RECEIPT_BUCKET).upload(uploadPath, order.receipt, {
          upsert: false, contentType: 'application/pdf', cacheControl: '0',
        })
        if (uploadError) throw displayReceiptError(uploadError)
      }
      try {
        const cleanName = uploadPath
          ? [...order.receipt.name].map((char) => (char.charCodeAt(0) < 32 || char === '/' || char === String.fromCharCode(92)) ? '_' : char).join('') : ''
        const fileName = cleanName.length > 160 ? `${cleanName.slice(0, 156)}.pdf` : cleanName
        const result = await client.rpc(uploadPath ? 'farmavida_create_order_with_receipt' : 'farmavida_create_order',
          uploadPath ? { ...baseParams, p_receipt_path: uploadPath, p_file_name: fileName } : baseParams)
        if (result.error) throw uploadPath ? displayReceiptError(result.error) : translateOrderError(result.error)
        data = result.data
      } catch (error) {
        // Evita arquivos órfãos caso a transação do pedido seja recusada.
        // A política de DELETE bloqueia a remoção de arquivos já vinculados.
        if (uploadPath) {
          try { await client.storage.from(RECEIPT_BUCKET).remove([uploadPath]) } catch { /* limpeza pode ser feita depois */ }
        }
        throw error
      }
      const created = Array.isArray(data) ? data[0] : data
      if (!created?.id || !Array.isArray(created.itens)) throw new Error('O Supabase não confirmou o pedido.')
      return created
    },
    async listOrders() {
      if (!client) throw new Error('Configure o Supabase no arquivo .env.')
      if (getToken) await getToken()
      const { data, error } = await client.from('orders').select('*').order('created_at', { ascending: false })
      if (error) throw translateOrderError(error)
      return data || []
    },
  }
}

// A demonstração reproduz as regras de preço, estado e titularidade do banco.
export function createLocalOrders({ loadDb, saveDb, currentLocalUserId, newId, catalog = demoCatalog }) {
  const products = new Map(catalog.flatMap((category) => category.products.map((product) => [product.id, product])))
  return {
    async createOrder(input) {
      const order = normalizeOrderInput(input)
      if (order.receipt) throw new Error('O envio de PDFs exige Supabase configurado. Não salve receitas reais no modo demonstração.')
      const db = loadDb()
      const owner = currentLocalUserId()
      if (!owner || !db.users.some((user) => user.id === owner)) throw new Error('Faça login para finalizar o pedido.')
      const address = db.addresses.find((row) => row.id === order.addressId && row.user_id === owner)
      if (!address) throw new Error('Endereço não encontrado ou sem permissão.')
      const itens = order.items.map(({ id, qtd }) => {
        const product = products.get(id)
        if (!product || product.active === false) throw new Error('Um dos produtos está indisponível.')
        if (product.requiresPrescription === true) throw new Error('Produto com receita: use o Supabase e anexe um PDF fictício para análise.')
        return { id, nome: product.name, qtd, preco: money(product.price) }
      })
      const subtotal = money(itens.reduce((value, item) => value + item.preco * item.qtd, 0))
      const entrega = subtotal >= SHIPPING_FREE_FROM ? 0 : SHIPPING_FEE
      const total = money(subtotal + entrega)
      if (total !== order.expectedTotal) {
        throw new Error('O preço do catálogo mudou. Atualize a página e adicione os produtos novamente antes de concluir.')
      }
      const addressFields = {
        label: address.label, cep: address.cep, endereco: address.endereco,
        numero: address.numero, complemento: address.complemento || '',
        bairro: address.bairro, cidade: address.cidade, estado: address.estado,
      }
      // Os dados do cartão e qualquer status enviado pelo navegador nunca são persistidos.
      const row = {
        id: newId(), user_id: owner, itens, subtotal, entrega, total,
        pagamento: order.payment, status: order.payment === 'whatsapp' ? 'pendente' : 'aguardando_pagamento',
        endereco: addressFields, observacoes: order.observations, receita: '',
        created_at: new Date().toISOString(),
      }
      db.orders.push(row)
      saveDb(db)
      return { ...row, itens: row.itens.map((item) => ({ ...item })), endereco: { ...row.endereco } }
    },
    async listOrders() {
      const id = currentLocalUserId()
      if (!id) return []
      return loadDb().orders.filter((order) => order.user_id === id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
    },
  }
}
