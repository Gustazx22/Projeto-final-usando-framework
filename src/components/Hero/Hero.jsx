import './Hero.css'

function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="container hero-grid">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot" aria-hidden="true"></span>
            <span>ENTREGA RÁPIDA EM TODO BRASIL</span>
          </div>
          <h1 id="hero-title">Sua saúde em <span className="highlight">boas mãos</span></h1>
          <p className="hero-subtitle">
            Farmácia e drogaria virtual com entrega facilitada, receita digital em PDF para controlados
            e retenção de lote. Compre medicamentos, genéricos, vitaminas e dermocosméticos com segurança.
          </p>
          <div className="hero-actions">
            <a href="#medicamentos" className="btn btn-primary btn-lg">Comprar agora <span aria-hidden="true">→</span></a>
            <a href="#receita" className="btn btn-secondary btn-lg">Enviar receita <span aria-hidden="true">→</span></a>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <strong>10k+</strong>
              <span>produtos</span>
            </div>
            <div className="stat">
              <strong>24h</strong>
              <span>entrega expressa</span>
            </div>
            <div className="stat">
              <strong>5★</strong>
              <span>avaliações</span>
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
              <span className="price-label">A partir de</span>
              <span className="price-value">R$ <strong>5</strong>,90</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero