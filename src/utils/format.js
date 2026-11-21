export const formatBRL = (v) => `R$ ${Number(v || 0).toFixed(2).replace('.', ',')}`

const digits = (s) => String(s || '').replace(/\D/g, '')

export const maskCPF = (v) => {
  const d = digits(v).slice(0, 11)
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2')
}

export const maskPhone = (v) => {
  const d = digits(v).slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export const maskCEP = (v) => {
  const d = digits(v).slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

export const maskCard = (v) => digits(v).slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ')

export const maskExpiry = (v) => {
  const d = digits(v).slice(0, 4)
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
}

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim())

export function isValidCPF(value) {
  const c = digits(value)
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false
  const calc = (len) => {
    let sum = 0
    for (let i = 0; i < len; i++) sum += Number(c[i]) * (len + 1 - i)
    const r = (sum * 10) % 11
    return r === 10 ? 0 : r
  }
  return calc(9) === Number(c[9]) && calc(10) === Number(c[10])
}

// Algoritmo de Luhn (validação do número do cartão)
export function isValidCardNumber(value) {
  const d = digits(value)
  if (d.length < 13 || d.length > 19) return false
  let sum = 0
  let alt = false
  for (let i = d.length - 1; i >= 0; i--) {
    let n = Number(d[i])
    if (alt) { n *= 2; if (n > 9) n -= 9 }
    sum += n
    alt = !alt
  }
  return sum % 10 === 0
}

export function cardBrand(value) {
  const d = digits(value)
  if (/^4/.test(d)) return 'Visa'
  if (/^(5[1-5]|2[2-7])/.test(d)) return 'Mastercard'
  if (/^3[47]/.test(d)) return 'Amex'
  if (/^(4011|4312|4389|4514|4576|5041|5066|5067|509|6277|6362|6363|650|6516|6550)/.test(d)) return 'Elo'
  if (/^(606282|3841)/.test(d)) return 'Hipercard'
  return ''
}

export function isValidExpiry(value) {
  const m = /^(\d{2})\/(\d{2})$/.exec(value)
  if (!m) return false
  const month = Number(m[1])
  const year = 2000 + Number(m[2])
  if (month < 1 || month > 12) return false
  const now = new Date()
  return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)
}

/* ---------- PIX (BR Code "copia e cola") ---------- */
const tlv = (id, value) => `${id}${String(value.length).padStart(2, '0')}${value}`

function crc16(str) {
  let crc = 0xffff
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

const ascii = (s, max) =>
  String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9 ]/g, '').slice(0, max)

export function buildPixPayload({ key, name, city, amount, txid }) {
  const merchant = tlv('00', 'br.gov.bcb.pix') + tlv('01', key)
  const payload =
    tlv('00', '01') +
    tlv('26', merchant) +
    tlv('52', '0000') +
    tlv('53', '986') +
    tlv('54', Number(amount).toFixed(2)) +
    tlv('58', 'BR') +
    tlv('59', ascii(name, 25) || 'LOJA') +
    tlv('60', ascii(city, 15) || 'BRASIL') +
    tlv('62', tlv('05', ascii(txid, 25).replace(/ /g, '') || '***')) +
    '6304'
  return payload + crc16(payload)
}
