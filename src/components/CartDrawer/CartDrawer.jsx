import { useCart } from '../../context/useCart.js'
import { STORE } from '../../config'
import { formatBRL } from '../../utils/format'
import Modal from '../ui/Modal'
import './CartDrawer.css'
import { getProductFallback, getLocalProductImage } from '../../utils/productImage.js'

const EMOJI = { medicamentos: '💊', genericos: '🧪', vitaminas: '💪', higiene: '🧴', cuidados: '🩺', ofertas: '🔥' }

export default function CartDrawer({ onCheckout }) {
  const { items, totalItems, totalPrice, removeItem, updateQuantity, clearCart, closeCart, isOpen } = useCart()

  const deliveryFee = totalPrice >= STORE.freeShippingFrom || totalPrice === 0 ? 0 : STORE.deliveryFee
  const total = totalPrice + deliveryFee
  const missing = Math.max(0, STORE.freeShippingFrom - totalPrice)
  const progress = Math.min(100, (totalPrice / STORE.freeShippingFrom) * 100)

  const handleCheckout = () => {
    closeCart()
    onCheckout?.(true)
  }

  const footer = items.length > 0 && (
    <div className="cm-footer">
      <dl className="cm-summary">
        <div><dt>Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'itens'})</dt><dd>{formatBRL(totalPrice)}</dd></div>
        <div><dt>Entrega</dt><dd className={deliveryFee === 0 ? 'cm-free' : ''}>{deliveryFee === 0 ? 'Grátis' : formatBRL(deliveryFee)}</dd></div>
        <div className="cm-total"><dt>Total</dt><dd>{formatBRL(total)}</dd></div>
      </dl>
      <button type="button" className="btn btn-primary btn-lg btn-full" onClick={handleCheckout}>
        Finalizar pedido
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true" style={{ width: 18, height: 18 }}>
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
      <div className="cm-links">
        <button type="button" onClick={closeCart}>← Continuar comprando</button>
        <button type="button" onClick={clearCart}>Limpar carrinho</button>
      </div>
    </div>
  )

  return (
    <Modal
      open={isOpen}
      onClose={closeCart}
      size="md"
      title={`Meu carrinho${totalItems ? ` (${totalItems})` : ''}`}
      footer={footer || null}
      className="cm-modal"
    >
      {items.length === 0 ? (
        <div className="cm-empty">
          <div className="cm-empty-icon" aria-hidden="true">🛒</div>
          <h3>Seu carrinho está vazio</h3>
          <p>Adicione produtos para começar sua compra.</p>
          <button type="button" className="btn btn-primary" onClick={closeCart}>Ver produtos</button>
        </div>
      ) : (
        <>
          <div className="cm-ship">
            <p>
              {missing > 0
                ? <>Falta <strong>{formatBRL(missing)}</strong> para <strong>entrega grátis</strong></>
                : <>🎉 Você ganhou <strong>entrega grátis</strong>!</>}
            </p>
            <div className="cm-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>

          <ul className="cm-list">
            {items.map((item) => (
              <li key={item.id} className="cm-item">
                <div className="cm-thumb">
                  <span aria-hidden="true">{EMOJI[item.category] || '💊'}</span>
                  <img src={item.image || getProductFallback(item.category, item.name)} alt="" loading="lazy" onError={(event) => { event.currentTarget.src = event.currentTarget.dataset.fallbackApplied === 'true' ? getProductFallback(item.category, item.name) : (getLocalProductImage(item) || getProductFallback(item.category, item.name)); event.currentTarget.dataset.fallbackApplied = 'true' }} />
                </div>

                <div className="cm-info">
                  <h3>{item.name}</h3>
                  <span className="cm-cat">{item.category}</span>
                  <span className="cm-unit">{formatBRL(item.price)} cada</span>
                </div>

                <div className="cm-side">
                  <strong className="cm-line-total">{formatBRL(item.price * item.quantity)}</strong>
                  <div className="cm-qty" aria-label={`Quantidade de ${item.name}`}>
                    <button type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label="Diminuir quantidade">−</button>
                    <span aria-live="polite">{item.quantity}</span>
                    <button type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label="Aumentar quantidade">+</button>
                  </div>
                  <button type="button" className="cm-remove" onClick={() => removeItem(item.id)}>Remover</button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Modal>
  )
}
