import { CartProvider } from './context/CartContext'
import { ToastProvider } from './context/ToastContext'
import { UserProvider } from './context/UserContext'
import Header from './components/Header/Header'
import Hero from './components/Hero/Hero'
import Benefits from './components/Benefits/Benefits'
import Categories from './components/Categories/Categories'
import Footer from './components/Footer/Footer'
import CartDrawer from './components/CartDrawer/CartDrawer'
import CheckoutModal from './components/CheckoutModal/CheckoutModal'
import AuthModal from './components/AuthModal/AuthModal'
import AccountModal from './components/AccountModal/AccountModal'
import ReceitaSection from './components/ReceitaSection/ReceitaSection'
import { useState } from 'react'

function App() {
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [receipt, setReceipt] = useState(null)

  return (
    <CartProvider>
      <UserProvider>
        <ToastProvider>
          <Header />
          <main id="main-content">
            <Hero />
            <Benefits />
            <Categories />
            <ReceitaSection receipt={receipt} onReceiptChange={setReceipt} />
          </main>
          <Footer />
          <CartDrawer onCheckout={setCheckoutOpen} />
          <CheckoutModal
            isOpen={checkoutOpen}
            onClose={() => setCheckoutOpen(false)}
            receipt={receipt}
            onReceiptChange={setReceipt}
          />
          <AccountModal />
          <AuthModal />
        </ToastProvider>
      </UserProvider>
    </CartProvider>
  )
}

export default App