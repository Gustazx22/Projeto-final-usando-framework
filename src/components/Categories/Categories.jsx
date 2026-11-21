import { useState } from 'react'
import { useCart } from '../../context/CartContext'
import { useToast } from '../../context/ToastContext'
import ProductCarousel from '../ProductCarousel/ProductCarousel'
import './Categories.css'

function Categories() {
  const { addItem, openCart } = useCart()
  const { showToast } = useToast()

  // Products organized by category
  const categories = [
    {
      id: 'medicamentos',
      label: 'Medicamentos',
      products: [
        { id: 1, name: 'Dipirona 500mg', category: 'medicamentos', price: 8.90, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80', badge: 'bestseller', description: 'Analgésico e antitérmico genérico' },
        { id: 4, name: 'Paracetamol 750mg', category: 'medicamentos', price: 6.90, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80', badge: null, description: 'Analgésico e antitérmico' },
        { id: 7, name: 'Ibuprofeno 600mg', category: 'medicamentos', price: 15.90, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80', badge: 'sale', description: 'Anti-inflamatório não esteroidal' },
        { id: 9, name: 'Dorflex 35mg', category: 'medicamentos', price: 12.90, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80', badge: 'bestseller', description: 'Relaxante muscular e analgésico' },
        { id: 10, name: 'Buscopan 10mg', category: 'medicamentos', price: 18.50, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80', badge: null, description: 'Antiespasmódico para cólicas' },
        { id: 11, name: 'Tylenol 750mg', category: 'medicamentos', price: 22.90, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80', badge: 'new', description: 'Paracetamol de liberação prolongada' },
      ]
    },
    {
      id: 'genericos',
      label: 'Genéricos',
      products: [
        { id: 12, name: 'Amoxicilina 500mg (Genérico)', category: 'genericos', price: 14.90, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80', badge: 'bestseller', description: 'Antibiótico de amplo espectro' },
        { id: 13, name: 'Losartana 50mg (Genérico)', category: 'genericos', price: 9.90, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80', badge: null, description: 'Para hipertensão arterial' },
        { id: 14, name: 'Metformina 850mg (Genérico)', category: 'genericos', price: 7.50, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80', badge: 'sale', description: 'Diabetes tipo 2' },
        { id: 15, name: 'Omeprazol 20mg (Genérico)', category: 'genericos', price: 11.90, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80', badge: null, description: 'Protetor gástrico' },
        { id: 16, name: 'Sinvastatina 20mg (Genérico)', category: 'genericos', price: 8.90, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80', badge: 'bestseller', description: 'Controle de colesterol' },
        { id: 17, name: 'Atenolol 25mg (Genérico)', category: 'genericos', price: 6.50, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80', badge: null, description: 'Betabloqueador para pressão' },
      ]
    },
    {
      id: 'vitaminas',
      label: 'Vitaminas e Suplementos',
      products: [
        { id: 2, name: 'Vitamina C 1g', category: 'vitaminas', price: 12.50, image: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=300&q=80', badge: 'new', description: 'Suplemento vitamínico efervescente' },
        { id: 5, name: 'Ômega 3 1000mg', category: 'vitaminas', price: 38.90, image: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=300&q=80', badge: 'bestseller', description: 'Ácidos graxos essenciais' },
        { id: 8, name: 'Colágeno Hidrolisado', category: 'vitaminas', price: 55.90, image: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=300&q=80', badge: 'new', description: 'Pele, cabelo e unhas' },
        { id: 18, name: 'Vitamina D3 2000UI', category: 'vitaminas', price: 28.90, image: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=300&q=80', badge: 'bestseller', description: 'Imunidade e ossos' },
        { id: 19, name: 'Magnésio Quelato', category: 'vitaminas', price: 32.90, image: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=300&q=80', badge: null, description: 'Relaxamento muscular' },
        { id: 20, name: 'Complexo B', category: 'vitaminas', price: 19.90, image: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=300&q=80', badge: 'sale', description: 'Energia e metabolismo' },
      ]
    },
    {
      id: 'higiene',
      label: 'Higiene e Beleza',
      products: [
        { id: 3, name: 'Protetor Solar FPS 50', category: 'higiene', price: 45.90, image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d79b?w=300&q=80', badge: 'sale', description: 'UVA/UVB resistente à água' },
        { id: 6, name: 'Shampoo Anticaspa', category: 'higiene', price: 28.90, image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d79b?w=300&q=80', badge: null, description: 'Caspa e seborreia' },
        { id: 21, name: 'Hidratante Corporal', category: 'higiene', price: 35.90, image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d79b?w=300&q=80', badge: 'new', description: 'Pele seca e sensível' },
        { id: 22, name: 'Sabonete Líquido Neutro', category: 'higiene', price: 18.90, image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d79b?w=300&q=80', badge: null, description: 'Limpeza suave diária' },
        { id: 23, name: 'Creme Dental Clareador', category: 'higiene', price: 14.90, image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d79b?w=300&q=80', badge: 'bestseller', description: 'Branqueamento gradual' },
        { id: 24, name: 'Desodorante Roll-on 48h', category: 'higiene', price: 22.90, image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d79b?w=300&q=80', badge: null, description: 'Proteção prolongada' },
      ]
    },
    {
      id: 'cuidados',
      label: 'Cuidados com a Saúde',
      products: [
        { id: 25, name: 'Termômetro Digital', category: 'cuidados', price: 24.90, image: 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=300&q=80', badge: 'bestseller', description: 'Leitura rápida e precisa' },
        { id: 26, name: 'Monitor Pressão Braço', category: 'cuidados', price: 189.90, image: 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=300&q=80', badge: null, description: 'Automático com memória' },
        { id: 27, name: 'Glicosímetro + Tiras', category: 'cuidados', price: 89.90, image: 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=300&q=80', badge: 'sale', description: 'Diabetes - kit completo' },
        { id: 28, name: 'Nebulizador Ultrassônico', category: 'cuidados', price: 159.90, image: 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=300&q=80', badge: 'new', description: 'Silencioso e portátil' },
        { id: 29, name: 'Oxímetro de Dedo', category: 'cuidados', price: 69.90, image: 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=300&q=80', badge: 'bestseller', description: 'Saturação e batimentos' },
        { id: 30, name: 'Bolsa Térmica Gel', category: 'cuidados', price: 19.90, image: 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=300&q=80', badge: null, description: 'Quente/frio para dores' },
      ]
    },
    {
      id: 'ofertas',
      label: 'Ofertas Especiais',
      products: [
        { id: 31, name: 'Kit Higiene Bucal', category: 'ofertas', price: 29.90, image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d79b?w=300&q=80', badge: 'sale', description: 'Escova + pasta + fio dental' },
        { id: 32, name: 'Kit Primeiros Socorros', category: 'ofertas', price: 49.90, image: 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=300&q=80', badge: 'bestseller', description: 'Curativos, antisséptico, tesoura' },
        { id: 33, name: 'Protetor Solar + Pós-sol', category: 'ofertas', price: 59.90, image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d79b?w=300&q=80', badge: 'sale', description: 'Dupla proteção verão' },
        { id: 34, name: 'Vitamina C + Zinco', category: 'ofertas', price: 34.90, image: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=300&q=80', badge: 'new', description: 'Imunidade reforçada' },
        { id: 35, name: 'Shampoo + Condicionador', category: 'ofertas', price: 42.90, image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d79b?w=300&q=80', badge: null, description: 'Cabelos saudáveis' },
        { id: 36, name: 'Kit Bebê Completo', category: 'ofertas', price: 79.90, image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d79b?w=300&q=80', badge: 'bestseller', description: 'Sabonete, shampoo, pomada, óleo' },
      ]
    },
  ]

  const handleAddToCart = (product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
    })
    showToast(`${product.name} adicionado ao carrinho!`, 'success')
    openCart()
  }

  const handleQuickView = (product) => {
    // QuickView is handled inside ProductCarousel
  }

  const handleShare = (product) => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      showToast('Link copiado!', 'info')
    }
  }

  return (
    <>
      <section className="categories" aria-labelledby="categories-title">
        <div className="container">
          <div className="section-header">
            <h2 id="categories-title" className="section-title">Nossos Produtos</h2>
            <p className="section-subtitle">Qualidade farmacêutica, preço de outlet — navegue por categoria</p>
          </div>

          {categories.map((category) => (
            <ProductCarousel
              key={category.id}
              title={category.label}
              products={category.products}
              showViewAll
              viewAllHref={`#${category.id}`}
            />
          ))}

          <div className="categories-cta">
            <p>Não encontrou o que procura?</p>
            <a href="#receita" className="btn btn-primary">Envie sua receita e nós encontramos para você</a>
          </div>
        </div>
      </section>
    </>
  )
}

export default Categories