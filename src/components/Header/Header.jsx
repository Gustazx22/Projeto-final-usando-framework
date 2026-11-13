import { useState, useEffect } from 'react'
import './Header.css'

function Header() {
  const [menuAberto, setMenuAberto] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { label: 'Início', href: '#', icon: '🏠' },
    { label: 'Medicamentos', href: '#medicamentos', icon: '💊' },
    { label: 'Genéricos', href: '#genericos', icon: '🧪' },
    { label: 'Higiene e Beleza', href: '#higiene', icon: '🧴' },
    { label: 'Vitaminas', href: '#vitaminas', icon: '💪' },
    { label: 'Ofertas', href: '#ofertas', icon: '🔥' },
    { label: 'Enviar Receita', href: '#receita', icon: '📄' },
  ]

  const categoryItems = [
    { label: 'Medicamentos', href: '#medicamentos' },
    { label: 'Genéricos', href: '#genericos' },
    { label: 'Higiene e Beleza', href: '#higiene' },
    { label: 'Vitaminas', href: '#vitaminas' },
    { label: 'Cuidados com a Saúde', href: '#cuidados' },
    { label: 'Ofertas', href: '#ofertas' },
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
            {navItems.map((item, index) => (
              <a
                key={item.href}
                href={item.href}
                className="nav-btn"
                aria-label={item.label}
              >
                <span className="nav-icon" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </a>
            ))}
          </nav>

          <div className="header-actions">
            <button
              className="cart-btn"
              aria-label="Carrinho de compras (0 itens)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <span className="cart-count" aria-hidden="true">0</span>
            </button>

            <a
              href="https://wa.me/5511999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp"
              aria-label="Fale conosco no WhatsApp"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.194 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.67-.297-.472-.404-.475-.67-.475h-.374c-.197 0-.497.124-.745.347-.248.224-.621.573-.94.82-.322.248-.57.372-.843.472-.272.099-.67.173-1.044.025-.372-.149-.916-.52-1.363-.82-.446-.298-.694-.372-.943-.372-.024 0-.149-.025-.223-.025-.074 0-.148.025-.198.075-.124.1-.248.248-.298.446-.049.198-.049.446-.049.744 0 .297.124.573.372.82.248.248.497.373.868.67.372.298.497.497.57.52.074.049.323.073.347.124.223.373 1.53 2.88 1.413 3.004-.173.197-.372.297-.768.373-.397.074-1.017.025-1.363-.223-.347-.248-.794-.448-1.19-.598-.397-.149-.718-.223-1.043-.322-.322-.099-.57-.223-.718-.223-.073 0-.147.025-.223.074-.075.049-.223.174-.223.322 0 .149.025.149.298.149.149 0 .297-.025.372-.149.075-.124.149-.223.223-.323.074-.099.148-.199.223-.323.073-.124.073-.223-.024-.446-.148-.297-.422-.573-.744-.871-.322-.297-.718-.67-1.043-.967-.322-.298-.57-.447-.718-.52-.149-.075-.248-.075-.347-.075-.148 0-.272.05-.347.1-.074.049-.149.124-.174.223-.024.075-.074.223-.099.347-.025.124-.099.173-.174.223-.074.049-.124.049-.173.049h-.398z" />
              </svg>
              <span>WhatsApp</span>
            </a>

            <button
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
          <div className="menu" id="mobile-menu" role="navigation" aria-label="Menu mobile">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setMenuAberto(false)}>
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </a>
            ))}
          </div>
        )}

        <nav className={`nav-categories ${categoriesOpen ? 'open' : ''}`} role="navigation" aria-label="Categorias">
          <div className="nav-categories-list">
            {categoryItems.map((item) => (
              <a key={item.href} href={item.href}>{item.label}</a>
            ))}
          </div>
        </nav>
      </header>
    </>
  )
}

export default Header