/** Catálogo público do FarmaVida. Não confia em alterações de preço feitas no navegador. */
import { demoCatalog } from '../data/demoCatalog.js'

/** Devolve novas estruturas no modo demonstração, evitando mutar a lista base. */
export function createLocalCatalog() {
  return {
    async listCatalog() {
      return demoCatalog.map(({ id, label, products }) => ({
        id, label, products: products.map((p) => ({ ...p })),
      }))
    },
  }
}

function checkResponse(response, table) {
  const { data, error } = response || {}
  if (error) {
    if (['42P01', 'PGRST205'].includes(error.code) ||
        /could not find the table|relation .* does not exist/i.test(error.message || '')) {
      throw new Error('Catálogo não configurado. Execute supabase/etapa3-catalogo.sql no SQL Editor.')
    }
    if (error.code === '42501') {
      throw new Error('Sem permissão para ler o catálogo. Confira as políticas de leitura do Supabase.')
    }
    throw new Error(`Não foi possível carregar ${table}: ${error.message || 'erro desconhecido'}`)
  }
  if (!Array.isArray(data)) throw new Error(`Resposta inválida do Supabase para ${table}.`)
  return data
}

function convertProduct(row) {
  const id = Number(row.id)
  const price = Number(row.price)
  if (!Number.isSafeInteger(id) || id <= 0 || !Number.isFinite(price) || price < 0 ||
      typeof row.name !== 'string' || !row.name.trim() || typeof row.image !== 'string') {
    throw new Error('Um produto do banco possui dados inválidos. Revise o cadastro no Supabase.')
  }
  return {
    id, name: row.name, category: row.category_id, price,
    image: row.image, badge: row.badge || null,
    description: row.description || '',
    requiresPrescription: row.requires_prescription === true,
  }
}

export function createRemoteCatalog(client) {
  return {
    async listCatalog() {
      if (!client) throw new Error('Configure a URL e a chave pública do Supabase no arquivo .env.')
      // As duas consultas são públicas e respeitam RLS; nenhuma chave secreta é usada no browser.
      const [categoriesResult, productsResult] = await Promise.all([
        client.from('product_categories')
          .select('id,label,sort_order')
          .eq('active', true)
          .order('sort_order', { ascending: true })
          .order('id', { ascending: true }),
        client.from('products')
          .select('id,category_id,name,price,image,badge,description,sort_order,requires_prescription')
          .eq('active', true)
          .order('sort_order', { ascending: true })
          .order('id', { ascending: true }),
      ])
      const categories = checkResponse(categoriesResult, 'categorias')
      const products = checkResponse(productsResult, 'produtos')
      const byCategory = new Map()
      for (const product of products) {
        const items = byCategory.get(product.category_id) || []
        items.push(convertProduct(product))
        byCategory.set(product.category_id, items)
      }
      return categories.map((category) => ({
        id: category.id,
        label: category.label,
        products: byCategory.get(category.id) || [],
      }))
    },
  }
}
