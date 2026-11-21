import { useUser } from '../../context/useUser.js'
import './Footer.css'

const explore = [
  { label: 'Catálogo completo', href: '#catalog-controls' },
  { label: 'Medicamentos', href: '#medicamentos' },
  { label: 'Vitaminas', href: '#vitaminas' },
  { label: 'Enviar receita', href: '#receita' },
]
const accountLinks = [
  { label: 'Meus dados', tab: 'dados' },
  { label: 'Endereços', tab: 'enderecos' },
  { label: 'Pedidos', tab: 'pedidos' },
  { label: 'Segurança', tab: 'seguranca' },
]

export default function Footer() {
  const { isLoggedIn, openAuth, openAccount } = useUser()

  const openAccountTab = (tab) => {
    if (isLoggedIn) openAccount(tab)
    else openAuth('login')
  }

  const goTo = (event, href) => {
    if (/^#(medicamentos|vitaminas)$/.test(href)) {
      event.preventDefault()
      window.dispatchEvent(new CustomEvent('farmavida:navigate-category'))
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
        document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }))
    }
  }

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="brand">
              <div className="brand-logo" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" aria-hidden="true">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <div className="brand-text">
                <strong>Farma</strong><span>Vida</span><small>Farmácia Virtual</small>
              </div>
            </div>
            <p className="footer-tagline">
              Projeto desenvolvido para a disciplina de Laboratório de Desenvolvimento,
              com foco em catálogo, pedidos e análise farmacêutica digital.
            </p>
          </div>
          <nav className="footer-nav" aria-label="Navegação do rodapé">
            <div className="footer-col">
              <h4>Explorar</h4>
              <ul>{explore.map(({ href, label }) => (
                <li key={href}><a href={href} onClick={(event) => goTo(event, href)}>{label}</a></li>
              ))}</ul>
            </div>
            <div className="footer-col">
              <h4>Minha conta</h4>
              <ul>{accountLinks.map(({ tab, label }) => (
                <li key={tab}><button type="button" onClick={() => openAccountTab(tab)}>{label}</button></li>
              ))}</ul>
            </div>
            <div className="footer-col">
              <h4>Sobre o projeto</h4>
              <p className="footer-note">Projeto acadêmico em React, Vite e Supabase, com fluxo de catálogo, pedidos e análise farmacêutica.</p>
              <p className="footer-note">Use somente dados e receitas fictícios nos testes.</p>
            </div>
          </nav>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} FarmaVida · Projeto acadêmico</p>
          <p className="footer-legal">Projeto acadêmico apresentado para fins educacionais.</p>
        </div>
      </div>
    </footer>
  )
}
