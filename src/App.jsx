import { useState } from "react";
import { CartProvider } from "./context/CartContext";
import { ToastProvider } from "./context/ToastContext";
import { UserProvider } from "./context/UserContext";
import { useUser } from "./context/useUser.js";
import Header from "./components/Header/Header";
import Hero from "./components/Hero/Hero";
import Categories from "./components/Categories/Categories";
import Footer from "./components/Footer/Footer";
import CartDrawer from "./components/CartDrawer/CartDrawer";
import CheckoutModal from "./components/CheckoutModal/CheckoutModal";
import AuthModal from "./components/AuthModal/AuthModal";
import AccountModal from "./components/AccountModal/AccountModal";
import ReceitaSection from "./components/ReceitaSection/ReceitaSection";
import PharmacistWorkspace from "./components/PharmacistWorkspace/PharmacistWorkspace";

function FarmaVidaPages() {
  const { isPharmacist, roleLoaded, user } = useUser();
  const [view, setView] = useState({ userId: null, choice: "auto" });
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const selectedView = view.userId === user?.id ? view.choice : "auto";
  const pharmacistView = Boolean(
    user && isPharmacist && selectedView !== "client",
  );

  if (user && !roleLoaded)
    return (
      <>
        <main
          id="main-content"
          className="fv-role-loading"
          role="status"
          aria-live="polite"
        >
          Preparando sua área do FarmaVida…
        </main>
        <AccountModal />
        <AuthModal />
      </>
    );

  return (
    <>
      {pharmacistView ? (
        <PharmacistWorkspace
          onViewStore={() => {
            setView({ userId: user.id, choice: "client" });
            window.scrollTo(0, 0);
          }}
        />
      ) : (
        <>
          <Header
            onOpenWorkspace={
              isPharmacist
                ? () => {
                    setView({ userId: user.id, choice: "pharmacist" });
                    window.scrollTo(0, 0);
                  }
                : undefined
            }
          />
          <main id="main-content" tabIndex={-1}>
            <Hero />
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
        </>
      )}
      <AccountModal />
      <AuthModal />
    </>
  );
}

export default function App() {
  return (
    <CartProvider>
      <UserProvider>
        <ToastProvider>
          <FarmaVidaPages />
        </ToastProvider>
      </UserProvider>
    </CartProvider>
  );
}
