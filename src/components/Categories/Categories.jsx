import './Categories.css'

function Categories() {
  return (
    <section className="categories-section">
      <h2>Encontre o que você precisa</h2>

      <div className="categories-grid">
        <div className="category-card">
          <h3>Medicamentos</h3>
          <p>Remédios e cuidados para sua saúde.</p>
        </div>

        <div className="category-card">
          <h3>Genéricos</h3>
          <p>Alternativas com qualidade e economia.</p>
        </div>

        <div className="category-card">
          <h3>Vitaminas</h3>
          <p>Suplementos e vitaminas para o seu dia a dia.</p>
        </div>

        <div className="category-card">
          <h3>Higiene e Beleza</h3>
          <p>Produtos para seus cuidados pessoais.</p>
        </div>

        <div className="category-card">
          <h3>Cuidados com a Saúde</h3>
          <p>Produtos para cuidar de toda a família.</p>
        </div>

        <div className="category-card">
          <h3>Ofertas</h3>
          <p>Confira produtos com preços especiais.</p>
        </div>
      </div>
    </section>
  )
}

export default Categories