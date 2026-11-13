import Header from './components/Header/Header'
import Hero from './components/Hero/Hero'
import Benefits from './components/Benefits/Benefits'
import Categories from './components/Categories/Categories'
import WhatsAppGroup from './components/WhatsAppGroup/WhatsAppGroup'
import Footer from './components/Footer/Footer'

function App() {
  return (
    <>
      <Header />
      <main id="main-content">
        <Hero />
        <Benefits />
        <Categories />
        <WhatsAppGroup />
      </main>
      <Footer />
    </>
  )
}

export default App