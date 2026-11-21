const CATEGORY_STYLES = {
  MEDICAMENTOS: { bg: '#fff4ee', accent: '#ff7a30', icon: '💊' },
  GENÉRICOS: { bg: '#eef7ff', accent: '#4f8cff', icon: '🧪' },
  HIGIENE: { bg: '#f0fbf8', accent: '#20b486', icon: '🧴' },
  VITAMINAS: { bg: '#fff8ea', accent: '#ffb21d', icon: '💪' },
  OFERTAS: { bg: '#f6f0ff', accent: '#7c5cff', icon: '🏷️' },
  CUIDADOS: { bg: '#eef7ff', accent: '#008a6b', icon: '❤️' },
}

function escapeText(text = '') {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function getProductFallback(category = '', name = 'Produto FarmaVida') {
  const key = String(category || '').trim().toUpperCase()
  const { bg, accent, icon } = CATEGORY_STYLES[key] || { bg: '#f3f7f6', accent: '#0a8b68', icon: '🛍️' }
  const title = escapeText(name)
  const subtitle = escapeText(category || 'FarmaVida')
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" role="img" aria-label="${title}">
    <defs>
      <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="${bg}"/>
        <stop offset="100%" stop-color="#ffffff"/>
      </linearGradient>
    </defs>
    <rect width="600" height="600" rx="36" fill="url(#g)"/>
    <circle cx="300" cy="210" r="96" fill="${accent}" opacity="0.12"/>
    <text x="300" y="230" text-anchor="middle" font-size="88">${icon}</text>
    <rect x="72" y="332" width="456" height="136" rx="24" fill="#ffffff" opacity="0.96"/>
    <text x="300" y="386" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="#6b7d76" letter-spacing="1">${subtitle}</text>
    <text x="300" y="426" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700" fill="#17332c">${title}</text>
  </svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export function getProductImageSrc(product) {
  const local = getLocalProductImage(product)
  // A versão antiga do catálogo usa a mesma foto por categoria. Nesses casos,
  // preferimos a imagem exclusiva local até a atualização SQL ser executada.
  if (local && (!product?.image || /images\.unsplash\.com\/photo-(1584308666744|1550572017|1576671081837|1556228578)/.test(product.image))) {
    return local
  }
  return product?.image || local || getProductFallback(product?.category, product?.name)
}

export function getLocalProductImage(product) {
  if (product?.category === 'higiene') return product?.image || null
  const id = Number(product?.id)
  return Number.isInteger(id) && id > 0 && id <= 36 ? `/products/catalogo/${id}.svg` : null
}

export function handleProductImageError(event, product) {
  const fallback = getLocalProductImage(product) || getProductFallback(product?.category, product?.name)
  if (event.currentTarget.dataset.fallbackApplied === 'true') {
    event.currentTarget.src = getProductFallback(product?.category, product?.name)
    return
  }
  event.currentTarget.dataset.fallbackApplied = 'true'
  event.currentTarget.src = fallback
}
