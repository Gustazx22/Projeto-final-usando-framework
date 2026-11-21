import { useEffect, useMemo, useState } from 'react'
import { db } from '../../services/db.js'
import { countCatalogProducts, filterCatalog } from '../../services/catalogFilters.js'
import ProductCarousel from '../ProductCarousel/ProductCarousel'
import './Categories.css'

function Categories() {
  const [categories, setCategories] = useState([])
  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [reloadId, setReloadId] = useState(0)
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    let cancelled = false
    db.listCatalog()
      .then((data) => {
        if (cancelled) return
        setCategories(data)
        setErrorMessage('')
        setStatus('ready')
      })
      .catch((error) => {
        if (cancelled) return
        setErrorMessage(error.message || 'Não foi possível carregar os produtos.')
        setStatus('error')
      })
    return () => { cancelled = true }
  }, [reloadId])

  // Se o usuário usar o menu principal, restaura as seções antes de navegar.
  useEffect(() => {
    const showSections = () => {
      setQuery('')
      setSelectedCategory('all')
    }
    window.addEventListener('farmavida:navigate-category', showSections)
    return () => window.removeEventListener('farmavida:navigate-category', showSections)
  }, [])

  const filteredCategories = useMemo(
    () => filterCatalog(categories, { query, categoryId: selectedCategory }),
    [categories, query, selectedCategory],
  )
  const total = countCatalogProducts(filteredCategories)
  const isFiltering = query.trim().length > 0 || selectedCategory !== 'all'

  const clearFilters = () => {
    setQuery('')
    setSelectedCategory('all')
  }

  const showAllFromCategory = (categoryId) => {
    setQuery('')
    setSelectedCategory(categoryId)
    document.getElementById('catalog-controls')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const retry = () => {
    setStatus('loading')
    setReloadId((value) => value + 1)
  }

  return (
    <section className="categories" aria-labelledby="categories-title">
      <div className="container">
        <div className="section-header">
          <h2 id="categories-title" className="section-title">Nossos Produtos</h2>
          <p className="section-subtitle">Explore nosso catálogo demonstrativo e encontre produtos por nome ou categoria.</p>
        </div>

        <div id="catalog-controls" className="catalog-controls">
          <label className="catalog-search-label" htmlFor="catalog-search">Pesquisar produtos</label>
          <div className="catalog-search-field">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m16 16 5 5" />
            </svg>
            <input
              id="catalog-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Busque medicamentos, vitaminas, higiene..."
              autoComplete="off"
              aria-controls="catalog-results"
            />
            {query && (
              <button className="catalog-clear-search" type="button" onClick={() => setQuery('')} aria-label="Limpar busca">
                Limpar
              </button>
            )}
          </div>

          {status === 'ready' && categories.length > 0 && (
            <div className="catalog-categories-filter" role="group" aria-label="Filtrar por categoria">
              <span className="catalog-filter-label">Categorias</span>
              <div className="filter-bar catalog-filter-list">
                <button
                  type="button"
                  className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                  aria-pressed={selectedCategory === 'all'}
                  onClick={() => setSelectedCategory('all')}
                >
                  Todas
                </button>
                {categories.map((category) => (
                  <button
                    type="button"
                    key={category.id}
                    className={`filter-btn ${selectedCategory === category.id ? 'active' : ''}`}
                    aria-pressed={selectedCategory === category.id}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div id="catalog-results">
          {status === 'loading' && (
            <div className="catalog-loading">
              <p role="status" className="catalog-feedback">Carregando produtos...</p>
              <div aria-hidden="true">
                {Array.from({ length: 6 }, (_, sectionIndex) => (
                  <section className="catalog-placeholder-section" key={sectionIndex}>
                    <div className="catalog-placeholder-title catalog-shimmer" />
                    <div className="catalog-placeholder-grid">
                      {Array.from({ length: 4 }, (_, cardIndex) => (
                        <div className="catalog-placeholder-card" key={cardIndex}>
                          <div className="catalog-placeholder-image catalog-shimmer" />
                          <div className="catalog-placeholder-info">
                            <div className="catalog-placeholder-line catalog-shimmer" />
                            <div className="catalog-placeholder-line short catalog-shimmer" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          )}
          {status === 'error' && (
            <div role="alert" className="catalog-feedback">
              <p>{errorMessage}</p>
              <button type="button" className="btn btn-primary" onClick={retry}>Tentar novamente</button>
            </div>
          )}
          {status === 'ready' && categories.length === 0 && (
            <p role="status" className="catalog-feedback">Nenhuma categoria disponível no momento.</p>
          )}
          {status === 'ready' && categories.length > 0 && (
            <>
              <p className="catalog-result-count" role="status" aria-live="polite">
                {total} {total === 1 ? 'produto encontrado' : 'produtos encontrados'}
                {isFiltering && (
                  <button type="button" className="catalog-reset-link" onClick={clearFilters}>
                    Limpar filtros
                  </button>
                )}
              </p>
              {total === 0 ? (
                <div className="catalog-empty" role="status">
                  <h3>Nenhum produto encontrado</h3>
                  <p>Tente outra palavra ou selecione uma categoria diferente.</p>
                  <button type="button" className="btn btn-primary" onClick={clearFilters}>Ver todos os produtos</button>
                </div>
              ) : (
                filteredCategories.map((category) => (
                  <ProductCarousel
                    key={category.id}
                    id={category.id}
                    title={category.label}
                    products={category.products}
                    showViewAll={!isFiltering && categories.length > 1}
                    onViewAll={showAllFromCategory}
                  />
                ))
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}

export default Categories
