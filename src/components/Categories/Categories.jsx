import { useEffect, useState } from 'react'
import { db } from '../../services/db.js'
import ProductCarousel from '../ProductCarousel/ProductCarousel'
import './Categories.css'

function Categories() {
  const [categories, setCategories] = useState([])
  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [reloadId, setReloadId] = useState(0)

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

  const retry = () => {
    setStatus('loading')
    setReloadId((value) => value + 1)
  }

  return (
    <section className="categories" aria-labelledby="categories-title">
      <div className="container">
        <div className="section-header">
          <h2 id="categories-title" className="section-title">Nossos Produtos</h2>
          <p className="section-subtitle">Qualidade farmacêutica, preço de outlet — navegue por categoria</p>
        </div>

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
        {status === 'ready' && categories.map((category) => (
          <ProductCarousel
            key={category.id}
            id={category.id}
            title={category.label}
            products={category.products}
            showViewAll
            viewAllHref={`#${category.id}`}
          />
        ))}

      </div>
    </section>
  )
}

export default Categories
