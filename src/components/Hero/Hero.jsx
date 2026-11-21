import './Hero.css'

function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="container hero-grid">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot" aria-hidden="true"></span>
            <span>PROJETO ACADÊMICO · AMBIENTE DE DEMONSTRAÇÃO</span>
          </div>
          <h1 id="hero-title">Sua saúde em <span className="highlight">boas mãos</span></h1>
          <p className="hero-subtitle">
            Protótipo acadêmico de farmácia virtual: explore produtos fictícios, simule compras e
            envie PDFs de teste para análise farmacêutica manual. Não há dispensação ou pagamento real.
          </p>
          <div className="hero-actions">
            <a href="#catalog-controls" className="btn btn-primary btn-lg">Comprar agora <span aria-hidden="true">→</span></a>
            <a href="#receita" className="btn btn-secondary btn-lg">Enviar receita <span aria-hidden="true">→</span></a>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <strong>Catálogo</strong>
              <span>demonstrativo</span>
            </div>
            <div className="stat">
              <strong>Pedidos</strong>
              <span>simulados</span>
            </div>
            <div className="stat">
              <strong>Receitas</strong>
              <span>análise manual</span>
            </div>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-image-stack">
            <img
              src="https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&q=80"
              alt="FarmaVida - Farmácia virtual"
              className="hero-img-main"
              loading="eager"
            />
            <img
              src="https://images.unsplash.com/photo-1576671081837-49000212a370?w=600&q=80"
              alt="Medicamentos e vitaminas"
              className="hero-img-overlay"
              loading="lazy"
            />
            <div className="hero-price-tag">
              <span className="price-label">FarmaVida</span>
              <span className="price-value">Projeto <strong>demo</strong></span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero