import { useCart } from '../../context/CartContext'
import { useEffect, useState } from 'react'
import './QuickViewModal.css'

export default function QuickViewModal({ product, isOpen, onClose }) {
  const { addItem } = useCart()
  const [selectedQty, setSelectedQty] = useState(1)

  useEffect(() => {
    if (isOpen) {
      setSelectedQty(1)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!product || !isOpen) return null

  const formatPrice = (price) => `R$ ${price.toFixed(2).replace('.', ',')}`

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
    })
    for (let i = 1; i < selectedQty; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
      })
    }
    onClose()
  }

  return (
    <>
      <div className="modal-overlay" onClick={onClose} aria-hidden="true"></div>
      <div className="modal quick-view-modal" role="dialog" aria-modal="true" aria-labelledby="quick-view-title">
        <button className="modal-close" onClick={onClose} aria-label="Fechar visualização rápida">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="modal-body quick-view-body">
          <div className="quick-view-grid">
            <div className="quick-view-image">
              <img src={product.image} alt={product.name} loading="eager" />
              {product.badge && (
                <span className={`badge badge-${product.badge}`}>
                  {product.badge === 'new' && 'Novo'}
                  {product.badge === 'sale' && 'Promoção'}
                  {product.badge === 'bestseller' && 'Mais Vendido'}
                  {product.badge === 'outlet' && 'Outlet'}
                </span>
              )}
            </div>

            <div className="quick-view-info">
              <span className="quick-view-category">{product.category}</span>
              <h2 id="quick-view-title" className="quick-view-title">{product.name}</h2>
              <p className="quick-view-description">{product.description}</p>

              <div className="quick-view-price">
                <span className="price-value">{formatPrice(product.price)}</span>
                <span className="price-per-unit">/ unidade</span>
              </div>

              <div className="quick-view-qty">
                <label htmlFor="qty-selector">Quantidade</label>
                <div className="quantity-selector-large">
                  <button
                    className="qty-btn-large"
                    onClick={() => setSelectedQty(prev => Math.max(1, prev - 1))}
                    aria-label="Diminuir quantidade"
                    disabled={selectedQty <= 1}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                  <input
                    id="qty-selector"
                    type="number"
                    value={selectedQty}
                    onChange={(e) => setSelectedQty(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    max="99"
                    className="qty-input"
                    aria-label="Quantidade"
                  />
                  <button
                    className="qty-btn-large"
                    onClick={() => setSelectedQty(prev => prev + 1)}
                    aria-label="Aumentar quantidade"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="quick-view-actions">
                <button className="btn btn-primary btn-lg btn-full" onClick={handleAddToCart}>
                  Adicionar ao carrinho ({selectedQty})
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                </button>
                <button className="btn btn-outline btn-lg btn-full" onClick={onClose}>
                  Continuar comprando
                </button>
              </div>

              <div className="quick-view-meta">
                <div className="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M5 12h14" />
                    <path d="M12 5l7 7-7 7" />
                  </svg>
                  <span>Entrega rápida disponível</span>
                </div>
                <div className="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>Compra segura</span>
                </div>
                <div className="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  <span>Favoritar produto</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}