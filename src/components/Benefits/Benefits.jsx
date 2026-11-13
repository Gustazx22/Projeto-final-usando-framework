import './Benefits.css'

function Benefits() {
  const benefits = [
    {
      icon: '🚚',
      title: 'Entrega Rápida',
      description: 'Receba seus produtos com praticidade e segurança em até 24h nas principais regiões.'
    },
    {
      icon: '🔒',
      title: 'Compra Segura',
      description: 'Seus dados e suas compras protegidos com criptografia de ponta e certificados de segurança.'
    },
    {
      icon: '✅',
      title: 'Produtos de Qualidade',
      description: 'Medicamentos e produtos originais, aprovados pela ANVISA, para sua saúde e família.'
    },
    {
      icon: '📄',
      title: 'Envio de Receita',
      description: 'Envie sua receita controlada em PDF de forma simples, segura e com retenção de lote.'
    }
  ]

  return (
    <section className="benefits" aria-labelledby="benefits-title">
      <div className="container">
        <h2 id="benefits-title" className="sr-only">Benefícios FarmaVida</h2>
        <div className="benefits-grid">
          {benefits.map((benefit, index) => (
            <article key={index} className="benefit-card">
              <div className="benefit-icon" aria-hidden="true">
                {benefit.icon}
              </div>
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Benefits