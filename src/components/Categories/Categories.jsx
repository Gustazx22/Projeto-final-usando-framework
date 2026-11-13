import { useState } from 'react'
import './Categories.css'

function Categories() {
  const [activeFilter, setActiveFilter] = useState('todos')

  const filters = [
    { id: 'todos', label: 'Todas' },
    { id: 'medicamentos', label: 'Medicamentos' },
    { id: 'genericos', label: 'Genéricos' },
    { id: 'vitaminas', label: 'Vitaminas' },
    { id: 'higiene', label: 'Higiene e Beleza' },
    { id: 'cuidados', label: 'Cuidados com a Saúde' },
    { id: 'ofertas', label: 'Ofertas' },
  ]

  const products = [
    {
      id: 1,
      name: 'Dipirona 500mg',
      category: 'medicamentos',
      price: 8.90,
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80',
      badge: 'bestseller',
      description: 'Analgésico e antitérmico genérico',
    },
    {
      id: 2,
      name: 'Vitamina C 1g',
      category: 'vitaminas',
      price: 12.50,
      image: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=300&q=80',
      badge: 'new',
      description: 'Suplemento vitamínico efervescente',
    },
    {
      id: 3,
      name: 'Protetor Solar FPS 50',
      category: 'higiene',
      price: 45.90,
      image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d79b?w=300&q=80',
      badge: 'sale',
      description: 'Proteção UVA/UVB resistente à água',
    },
    {
      id: 4,
      name: 'Paracetamol 750mg',
      category: 'medicamentos',
      price: 6.90,
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80',
      badge: null,
      description: 'Analgésico e antitérmico',
    },
    {
      id: 5,
      name: 'Ômega 3 1000mg',
      category: 'vitaminas',
      price: 38.90,
      image: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=300&q=80',
      badge: 'bestseller',
      description: 'Suplemento de ácidos graxos essenciais',
    },
    {
      id: 6,
      name: 'Shampoo Anticaspa',
      category: 'higiene',
      price: 28.90,
      image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d79b?w=300&q=80',
      badge: null,
      description: 'Tratamento para caspa e seborreia',
    },
    {
      id: 7,
      name: 'Ibuprofeno 600mg',
      category: 'medicamentos',
      price: 15.90,
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80',
      badge: 'sale',
      description: 'Anti-inflamatório não esteroidal',
    },
    {
      id: 8,
      name: 'Colágeno Hidrolisado',
      category: 'vitaminas',
      price: 55.90,
      image: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=300&q=80',
      badge: 'new',
      description: 'Suplemento para pele, cabelo e unhas',
    },
  ]

  const filteredProducts = activeFilter === 'todos'
    ? products
    : products.filter(p => p.category === activeFilter)

  const displayedProducts = filteredProducts.slice(0, 8)

  return (
    <section className="categories" aria-labelledby="categories-title">
      <div className="container">
        <div className="section-header">
          <h2 id="categories-title" className="section-title">Nossos Produtos</h2>
          <p className="section-subtitle">Qualidade farmacêutica, preço de outlet</p>
        </div>

        <div className="filter-bar" role="group" aria-label="Filtrar produtos por categoria">
          {filters.map((filter) => (
            <button
              key={filter.id}
              className={`filter-btn ${activeFilter === filter.id ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter.id)}
              aria-pressed={activeFilter === filter.id}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="products-grid" role="list">
          {displayedProducts.map((product) => (
            <article key={product.id} className="product-card" data-category={product.category} role="listitem">
              <div className="product-image">
                <img
                  src={product.image}
                  alt={product.name}
                  loading="lazy"
                />
                {product.badge && (
                  <div className="product-badge">
                    <span className={`badge badge-${product.badge}`}>
                      {product.badge === 'new' && 'Novo'}
                      {product.badge === 'sale' && 'Promoção'}
                      {product.badge === 'bestseller' && 'Mais Vendido'}
                      {product.badge === 'outlet' && 'Outlet'}
                    </span>
                  </div>
                )}
                <div className="product-quick-actions">
                  <button className="quick-action-btn" aria-label="Adicionar aos favoritos">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                  <button className="quick-action-btn" aria-label="Compartilhar produto">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <path d="M8.59 13.51a6 6 0 0 0 10.82 0" />
                      <path d="M8.59 6.49a6 6 0 0 0 0 10.82" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="product-info">
                <div className="product-meta">
                  <span className="product-category">{product.category}</span>
                  <span className="product-price">
                    {product.badge === 'sale' ? (
                      <>
                        R$ {product.price.toFixed(2).replace('.', ',')}
                        <span className="from"> R$ {(product.price * 1.3).toFixed(2).replace('.', ',')}</span>
                      </>
                    ) : (
                      `R$ ${product.price.toFixed(2).replace('.', ',')}`
                    )}
                  </span>
                </div>
                <h3 className="product-title">{product.name}</h3>
                <p className="product-desc">{product.description}</p>
                <div className="product-footer">
                  <div className="product-colors">
                    <span className="color-swatch" data-color="branco" aria-label="Branco"></span>
                    <span className="color-swatch" data-color="azul" aria-label="Azul"></span>
                    <span className="color-swatch" data-color="verde" aria-label="Verde"></span>
                  </div>
                  <button className="btn btn-primary btn-add-cart">
                    Adicionar
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="load-more-wrapper">
          <button className="btn btn-outline btn-lg">Carregar mais</button>
        </div>
      </div>
    </section>
  )
}

export default Categories