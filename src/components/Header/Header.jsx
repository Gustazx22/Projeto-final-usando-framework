import { useState } from 'react'
import './Header.css'

function Header() {
  const [menuAberto, setMenuAberto] = useState(false)
  

  return (
    <header>
      <div className="header">
        <h1>FarmaVida</h1>

        <div className="search">
          <input
            type="text"
            placeholder="O que você está procurando?"
          />
          <button type="button">Buscar</button>
        </div>

        <div className="header-actions">
          <button type="button">Minha conta</button>
          <button type="button">Carrinho</button>
          <button type="button" className="menu-button" aria-label="Abrir menu"  onClick={() => setMenuAberto(!menuAberto)}>☰</button>
        </div></div>
            {menuAberto && (
            <div className="menu">
              <a href="#">Início</a>
              <a href="#">Produtos</a>
              <a href="#">Ofertas</a>
              <a href="#">Minha conta</a>
              <a href="#">Meus pedidos</a>
              <a href="#">Enviar receita</a>
              <a href="#">Carrinho</a>
            </div>
          )}
      
      <nav className="categories">
        <a href="#">Medicamentos</a>
        <a href="#">Genéricos</a>
        <a href="#">Higiene e Beleza</a>
        <a href="#">Vitaminas</a>
        <a href="#">Ofertas</a>
        <a href="#">Cuidados com a Saúde</a>
      </nav>
    </header>
  )
}

export default Header