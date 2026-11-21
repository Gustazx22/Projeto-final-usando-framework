import { useCart } from '../../context/CartContext'
import { useEffect } from 'react'
import './CartDrawer.css'

export default function CartDrawer({ onCheckout }) {
  const { items, totalItems, totalPrice, removeItem, updateQuantity, closeCart, clearCart, isOpen } = useCart()

  // Trap focus and prevent body scroll when cart is open
    useEffect(() => {
      if (!isOpen) return

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') closeCart()
      }
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        document.body.style.overflow = ''
      }
    }, [isOpen, closeCart])

  if (!isOpen) {
    return (
      <aside className="cart-drawer" role="dialog" aria-label="Carrinho de compras" aria-modal="true">
        <div className="cart-overlay" onClick={closeCart} aria-hidden="true"></div>
        <div className="cart-content">
          <div className="cart-header">
            <h2>Carrinho</h2>
            <button className="cart-close" onClick={closeCart} aria-label="Fechar carrinho">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="cart-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <p>Seu carrinho está vazio</p>
            <span>Adicione produtos para começar</span>
          </div>
        </div>
      </aside>
    )
  }

  const formatPrice = (price) => `R$ ${price.toFixed(2).replace('.', ',')}`
  const deliveryFee = totalPrice >= 100 ? 0 : 12.90
  const total = totalPrice + deliveryFee

  const handleCheckout = () => {
    closeCart()
    if (onCheckout) onCheckout(true)
  }

  return (
    <aside className="cart-drawer open" role="dialog" aria-label="Carrinho de compras" aria-modal="true">
      <div className="cart-overlay" onClick={closeCart} aria-hidden="true"></div>
      <div className="cart-content">
        <div className="cart-header">
          <h2>Carrinho ({totalItems})</h2>
          <button className="cart-close" onClick={closeCart} aria-label="Fechar carrinho">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="cart-items" role="list">
          {items.map(item => (
            <article key={item.id} className="cart-item" role="listitem">
              <img
                src={item.image}
                alt={item.name}
                className="cart-item-image"
                loading="lazy"
              />
              <div className="cart-item-info">
                <h3 className="cart-item-name">{item.name}</h3>
                <span className="cart-item-category">{item.category}</span>
                <span className="cart-item-price">{formatPrice(item.price)}</span>
              </div>
              <div className="cart-item-actions">
                <div className="quantity-selector">
                  <button
                    className="qty-btn"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    aria-label={`Diminuir quantidade de ${item.name}`}
                    disabled={item.quantity <= 1}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                  <span className="qty-value" aria-live="polite">{item.quantity}</span>
                  <button
                    className="qty-btn"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    aria-label={`Aumentar quantidade de ${item.name}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                </div>
                <button
                  className="cart-item-remove"
                  onClick={() => removeItem(item.id)}
                  aria-label={`Remover ${item.name} do carrinho`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="cart-footer">
          <div className="cart-summary">
            <div className="summary-row">
              <span>Subtotal ({totalItems} itens)</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            <div className="summary-row">
              <span>Entrega</span>
              <span>{deliveryFee === 0 ? 'Grátis' : formatPrice(deliveryFee)}</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
            {deliveryFee > 0 && (
              <p className="free-shipping-hint">
                Adicione mais {formatPrice(100 - totalPrice)} para frete grátis!
              </p>
            )}
          </div>
          <div className="cart-actions">
            <button className="btn btn-outline btn-full" onClick={clearCart}>
              Limpar carrinho
            </button>
            <button className="btn btn-primary btn-full btn-lg" onClick={handleCheckout}>
              Finalizar pedido
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.194 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.67-.297-.472-.404-.475-.67-.475h-.374c-.197 0-.497.124-.745.347-.248.224-.621.573-.94.82-.322.248-.57.372-.843.472-.272.099-.67.173-1.044.025-.372-.149-.916-.52-1.363-.82-.446-.298-.694-.372-.943-.372-.024 0-.149-.025-.223-.025-.074 0-.148.025-.198.075-.124.1-.248.248-.298.446-.049.198-.049.446-.049.744 0 .297.124.573.372.82.248.248.497.373.868.67.372.298.497.497.57.52.074.049.323.073.347.124.223.373 1.53 2.88 1.413 3.004-.173.197-.372.297-.768.373-.397.074-1.017.025-1.363-.223-.347-.248-.794-.448-1.19-.598-.397-.149-.718-.223-1.043-.322-.322-.099-.57-.223-.718-.223-.073 0-.147.025-.223.074-.075.049-.223.174-.223.322 0 .149.025.149.298.149.149 0 .297-.025.372-.149.075-.124.149-.223.223-.323.074-.099.148-.199.223-.323.073-.124.073-.223-.024-.446-.148-.297-.422-.573-.744-.871-.322-.297-.718-.67-1.043-.967-.322-.298-.57-.447-.718-.52-.149-.075-.248-.075-.347-.075-.148 0-.272.05-.347.1-.074.049-.149.124-.174.223-.024.075-.074.223-.099.347-.025.124-.099.173-.174.223-.074.049-.124.049-.173.049h-.398z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}