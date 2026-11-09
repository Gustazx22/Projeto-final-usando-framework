import './Hero.css'

function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <h2>Sua saúde em primeiro lugar</h2>

        <p>
          Encontre medicamentos, produtos de saúde e cuidados
          para toda a família.
        </p>

        <div className="hero-buttons">
          <button type="button">Comprar agora</button>
          <button type="button">Enviar receita</button>
        </div>
      </div>
    </section>
  )
}

export default Hero