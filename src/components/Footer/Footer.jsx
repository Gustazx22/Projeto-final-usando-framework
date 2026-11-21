import './Footer.css'

function Footer() {
  const footerLinks = {
    'Institucional': [
      { label: 'Sobre nós', href: '#' },
      { label: 'Nossas lojas', href: '#' },
      { label: 'Trabalhe conosco', href: '#' },
      { label: 'Sustentabilidade', href: '#' },
    ],
    'Atendimento': [
      { label: 'Central de ajuda', href: '#' },
      { label: 'Como comprar', href: '#' },
      { label: 'Envio de receita', href: '#receita' },
      { label: 'Rastrear pedido', href: '#' },
    ],
    'Minha Conta': [
      { label: 'Meus pedidos', href: '#' },
      { label: 'Meus dados', href: '#' },
      { label: 'Endereços', href: '#' },
      { label: 'Lista de desejos', href: '#' },
    ],
    'Formas de Pagamento': [
      { label: 'Cartão de crédito', href: '#' },
      { label: 'Boleto bancário', href: '#' },
      { label: 'Pix', href: '#' },
      { label: 'Cartão FarmaVida', href: '#' },
    ],
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
                <strong>Farma</strong>
                <span>Vida</span>
                <small>Farmácia Virtual</small>
              </div>
            </div>
            <p className="footer-tagline">Sua saúde em boas mãos. Medicamentos, genéricos, vitaminas e dermocosméticos com entrega rápida e segura em todo Brasil.</p>
            <div className="footer-social" role="list" aria-label="Redes sociais">
              <a href="#" role="listitem" aria-label="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a href="#" role="listitem" aria-label="Facebook">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a href="#" role="listitem" aria-label="YouTube">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z" />
                  <path d="M10 15l5-3-5-3z" />
                </svg>
              </a>
            </div>
          </div>

          <nav className="footer-nav" aria-label="Links do rodapé">
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title} className="footer-col">
                <h4>{title}</h4>
                <ul>
                  {links.map((link) => (
                    <li key={link.href}>
                      <a href={link.href}>{link.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2024 FarmaVida. Todos os direitos reservados.</p>
          <p className="footer-legal">CNPJ: 00.000.000/0001-00 | Farmácia responsável: CRF/SP 00000</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer