import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import './Modal.css'

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

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

export default function Modal({ open, onClose, title, subtitle, size = 'md', children, footer, className = '' }) {
  const id = useId()
  const modalRef = useRef(null)
  const closeRef = useRef(null)
  const titleId = `${id}-title`
  const subtitleId = `${id}-subtitle`
  const closeRefLatest = useRef(onClose)
  useEffect(() => { closeRefLatest.current = onClose }, [onClose])

  useEffect(() => {
    if (!open) return
    const previousFocus = document.activeElement
    stack.push(id)
    lockScroll()
    closeRef.current?.focus({ preventScroll: true })

    const onKey = (event) => {
      if (stack[stack.length - 1] !== id) return
      if (event.key === 'Escape') {
        event.preventDefault()
        closeRefLatest.current?.()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = [...(modalRef.current?.querySelectorAll(FOCUSABLE) ?? [])]
        .filter((el) => el.getClientRects().length > 0)
      if (!focusable.length) { event.preventDefault(); modalRef.current?.focus(); return }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && (document.activeElement === first || !modalRef.current?.contains(document.activeElement))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (document.activeElement === last || !modalRef.current?.contains(document.activeElement))) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      const index = stack.indexOf(id)
      if (index >= 0) stack.splice(index, 1)
      unlockScroll()
      if (previousFocus?.isConnected && typeof previousFocus.focus === 'function') previousFocus.focus({ preventScroll: true })
    }
  }, [open, id])

  if (!open) return null
  return createPortal(
    <div className="fv-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.() }}>
      <div ref={modalRef} tabIndex={-1} className={`fv-modal fv-${size} ${className}`} role="dialog" aria-modal="true"
        aria-labelledby={titleId} aria-describedby={subtitle ? subtitleId : undefined}>
        <header className="fv-modal-head">
          <div>
            <h2 id={titleId}>{title}</h2>
            {subtitle && <p id={subtitleId}>{subtitle}</p>}
          </div>
          <button ref={closeRef} type="button" className="fv-x" onClick={onClose} aria-label={`Fechar: ${title}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>
        <div className="fv-modal-body">{children}</div>
        {footer && <div className="fv-modal-foot">{footer}</div>}
      </div>
    </div>, document.body,
  )
}
