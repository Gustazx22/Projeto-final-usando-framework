import { useState, useEffect } from 'react'
import { useCart } from '../../context/useCart.js'
import { useUser } from '../../context/useUser.js'
import './Header.css'

function Header({ onOpenWorkspace }) {
  const [menuAberto, setMenuAberto] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeId, setActiveId] = useState('')
  const { totalItems, toggleCart } = useCart()
  const { user, isLoggedIn, openAuth, openAccount } = useUser()

  const sectionIds = ['medicamentos', 'ofertas', 'receita']

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
      // Destaca no menu a seção que está na tela
      let current = ''
      for (const id of sectionIds) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= 140) current = id
      }
      setActiveId(current)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Clique no menu: rola suavemente até a seção (descontando a altura do cabeçalho)
  const goTo = (e, href) => {
    e.preventDefault()
    setMenuAberto(false)
    if (href === '#') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const targetId = href.slice(1)
    if (sectionIds.includes(targetId) && targetId !== 'receita') {
      // Uma categoria pode estar oculta pelos filtros; restaura a vitrine antes de rolar.
      window.dispatchEvent(new CustomEvent('farmavida:navigate-category'))
    }
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      const el = document.getElementById(targetId)
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 84
        window.scrollTo({ top, behavior: 'smooth' })
      }
    }))
  }

  useEffect(() => {
    if (!menuAberto) return
    const onEscape = (event) => {
      if (event.key === 'Escape') setMenuAberto(false)
    }
    document.addEventListener('keydown', onEscape)
    return () => document.removeEventListener('keydown', onEscape)
  }, [menuAberto])

  const initial = (user?.nome || user?.email || '?').trim()[0]?.toUpperCase()

  const navItems = [
      { label: 'Início', href: '#', icon: '🏠' },
      { label: 'Medicamentos', href: '#medicamentos', icon: '💊' },
      { label: 'Ofertas', href: '#ofertas', icon: '🔥' },
      { label: 'Receita', href: '#receita', icon: '📄' },
    ]

  return (
    <>
      <a href="#main-content" className="skip-link">Pular para o conteúdo principal</a>

      <header className={`site-header ${scrolled ? 'scrolled' : ''}`} role="banner">
        <div className="container header-inner">
          <div className="brand">
            <div className="brand-logo" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" aria-hidden="true">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="brand-text">
              <strong>Farma</strong>
              <span>Vida</span>
              <small>Farmácia Virtual</small>
            </div>
          </div>

          <nav className="main-nav" role="navigation" aria-label="Navegação principal">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`nav-btn ${item.href === `#${activeId}` || (item.href === '#' && !activeId) ? 'active' : ''}`}
                aria-label={item.label}
                onClick={(e) => goTo(e, item.href)}
              >
                <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </a>
            ))}
          </nav>

          <div className="header-actions">
            {onOpenWorkspace && (
              <button type="button" className="hd-workspace-switch" onClick={onOpenWorkspace}
                title="Abrir a área do farmacêutico" aria-label="Abrir painel farmacêutico">
                <span aria-hidden="true">▦</span> <span className="hd-workspace-label">Painel</span>
              </button>
            )}
            {isLoggedIn ? (
              <button type="button" className="hd-user" onClick={() => openAccount('dados')} aria-label="Minha conta">
                <span className="hd-avatar" aria-hidden="true">{initial}</span>
                <span className="hd-user-name">{user.nome?.split(' ')[0] || 'Conta'}</span>
              </button>
            ) : (
              <button type="button" className="hd-login" onClick={() => openAuth('login')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span>Entrar</span>
              </button>
            )}

            <button
              className="cart-btn"
              onClick={toggleCart}
              aria-label={`Carrinho de compras (${totalItems} itens)`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <span className="cart-count" aria-hidden="true">{totalItems}</span>
            </button>

            <a href="#receita" onClick={(e) => goTo(e, '#receita')} className="btn-whatsapp header-receipt-link" aria-label="Ir para envio de receitas">
              <span>Enviar receita</span>
            </a>

            <button
              type="button"
              className="menu-toggle"
              onClick={() => setMenuAberto(!menuAberto)}
              aria-expanded={menuAberto}
              aria-controls="mobile-menu"
              aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
            >
              <span className="hamburger" aria-hidden="true"></span>
            </button>
          </div>
        </div>

        {menuAberto && (
          <div className="menu" id="mobile-menu" role="navigation" aria-label="Navegação para dispositivos móveis">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} onClick={(e) => goTo(e, item.href)} aria-current={item.href === `#${activeId}` || (item.href === '#' && !activeId) ? 'location' : undefined}>
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </a>
            ))}
          </div>
        )}

      </header>
    </>
  )
}

export default Header