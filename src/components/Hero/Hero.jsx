import "./Hero.css";

function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="container hero-grid">
        <div className="hero-content">
          <h1 id="hero-title">
            Sua saúde em <span className="highlight">boas mãos</span>
          </h1>
          <p className="hero-subtitle">
            Plataforma de farmácia virtual para explorar produtos, realizar
            pedidos e enviar receitas em PDF para análise farmacêutica. Não há
            dispensação ou pagamento real.
          </p>
          <div className="hero-actions">
            <a href="#catalog-controls" className="btn btn-primary btn-lg">
              Comprar agora <span aria-hidden="true">→</span>
            </a>
            <a href="#receita" className="btn btn-secondary btn-lg">
              Enviar receita <span aria-hidden="true">→</span>
            </a>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <strong>Catálogo</strong>
              <span>produtos</span>
            </div>
            <div className="stat">
              <strong>Pedidos</strong>
              <span>acompanhamento</span>
            </div>
            <div className="stat">
              <strong>Receitas</strong>
              <span>análise farmacêutica</span>
            </div>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-image-stack">
            <img
              src="https://images.unsplash.com/photo-1580281657527-47f249e8f4df?auto=format&fit=crop&w=1100&q=85"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src =
                  "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&q=80";
              }}
              alt="Farmacêutica em ambiente de farmácia"
              className="hero-img-main"
              loading="eager"
            />
            <img
              src="https://images.unsplash.com/photo-1576671081837-49000212a370?w=600&q=80"
              alt="Medicamentos e vitaminas"
              className="hero-img-overlay"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
