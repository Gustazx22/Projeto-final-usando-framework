import { CartProvider } from './context/CartContext'
import { ToastProvider } from './context/ToastContext'
import { UserProvider } from './context/UserContext'
import Header from './components/Header/Header'
import Hero from './components/Hero/Hero'
import Benefits from './components/Benefits/Benefits'
import Categories from './components/Categories/Categories'
import WhatsAppGroup from './components/WhatsAppGroup/WhatsAppGroup'
import Footer from './components/Footer/Footer'
import CartDrawer from './components/CartDrawer/CartDrawer'
import CheckoutModal from './components/CheckoutModal/CheckoutModal'
import { useState } from 'react'

function App() {
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  return (
    <CartProvider>
      <UserProvider>
        <ToastProvider>
          <Header />
          <main id="main-content">
            <Hero />
            <Benefits />
            <Categories />
            <WhatsAppGroup />
          </main>
          <Footer />
          <CartDrawer onCheckout={setCheckoutOpen} />
          <CheckoutModal isOpen={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
        </ToastProvider>
      </UserProvider>
    </CartProvider>
  )
}

export default App