import "./Benefits.css";

function Benefits() {
  const benefits = [
    {
      icon: "🚚",
      title: "Checkout Simulado",
      description:
        "Experimente a montagem do carrinho e o registro de pedidos, sem entrega ou cobrança real.",
    },
    {
      icon: "🔒",
      title: "Compra Segura",
      description:
        "Pedidos simulados, com validações do lado do servidor e acesso controlado aos dados.",
    },
    {
      icon: "✅",
      title: "Produtos de Qualidade",
      description:
        "Catálogo demonstrativo com produtos fictícios para o projeto acadêmico.",
    },
    {
      icon: "📄",
      title: "Envio de Receita",
      description:
        "Anexe um PDF fictício ao pedido para análise manual simulada em armazenamento privado.",
    },
  ];

  return (
    <section className="benefits" aria-labelledby="benefits-title">
      <div className="container">
        <h2 id="benefits-title" className="sr-only">
          Benefícios FarmaVida
        </h2>
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
  );
}

export default Benefits;
