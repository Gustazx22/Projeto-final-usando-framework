export function normalizeCatalogText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim()
    .replace(/\s+/g, ' ')
}

export function filterCatalog(categories, { query = '', categoryId = 'all' } = {}) {
  const words = normalizeCatalogText(query).split(' ').filter(Boolean)
  const filtering = words.length > 0 || categoryId !== 'all'
  const source = Array.isArray(categories) ? categories : []

  return source
    .filter((category) => categoryId === 'all' || category.id === categoryId)
    .map((category) => ({
      ...category,
      products: category.products.filter((product) => {
        const searchable = normalizeCatalogText(
          `${product.name} ${product.description ?? ''} ${category.label}`,
        )
        return words.every((word) => searchable.includes(word))
      }),
    }))
    .filter((category) => !filtering || category.products.length > 0)
}

export function countCatalogProducts(categories) {
  return categories.reduce((count, category) => count + category.products.length, 0)
}
