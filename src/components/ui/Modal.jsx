import { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'
import './Modal.css'

// Controle de modais empilhados: ESC fecha só o de cima e o scroll da página
// sempre volta ao normal quando o último modal fecha.
const stack = []
let lockCount = 0
let previousOverflow = ''

function lockScroll() {
  if (lockCount++ === 0) {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
}
function unlockScroll() {
  if (--lockCount <= 0) {
    lockCount = 0
    document.body.style.overflow = previousOverflow
  }
}

export default function Modal({ open, onClose, title, subtitle, size = 'md', children, footer, className = '' }) {
  const id = useId()

  useEffect(() => {
    if (!open) return
    stack.push(id)
    lockScroll()
    const onKey = (e) => {
      if (e.key === 'Escape' && stack[stack.length - 1] === id) onClose?.()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      const i = stack.indexOf(id)
      if (i >= 0) stack.splice(i, 1)
      unlockScroll()
    }
  }, [open, onClose, id])

  if (!open) return null

  return createPortal(
    <div
      className="fv-overlay"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.() }}
    >
      <div className={`fv-modal fv-${size} ${className}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="fv-modal-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" className="fv-x" onClick={onClose} aria-label="Fechar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>
        <div className="fv-modal-body">{children}</div>
        {footer && <div className="fv-modal-foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
