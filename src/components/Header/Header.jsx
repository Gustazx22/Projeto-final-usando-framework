import { useEffect, useState } from "react";
import { useCart } from "../../context/useCart.js";
import { useUser } from "../../context/useUser.js";
import "./Header.css";

const NAV_ITEMS = [
  { label: "Início", href: "#", icon: "⌂" },
  { label: "Medicamentos", href: "#medicamentos", icon: "✚" },
  { label: "Ofertas", href: "#ofertas", icon: "✦" },
  { label: "Receita", href: "#receita", icon: "▤" },
];

const SECTION_IDS = ["medicamentos", "ofertas", "receita"];

export default function Header({ onOpenWorkspace }) {
  const [menuAberto, setMenuAberto] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeId, setActiveId] = useState("");
  const [search, setSearch] = useState("");
  const { totalItems, toggleCart } = useCart();
  const { user, isLoggedIn, openAuth, openAccount } = useUser();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12);
      let current = "";
      for (const id of SECTION_IDS) {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= 180) current = id;
      }
      setActiveId(current);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!menuAberto) return;
    const onEscape = (event) => {
      if (event.key === "Escape") setMenuAberto(false);
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [menuAberto]);

  const goTo = (event, href) => {
    event.preventDefault();
    setMenuAberto(false);
    if (href === "#") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (href !== "#receita") {
      window.dispatchEvent(new CustomEvent("farmavida:navigate-category"));
    }
    window.requestAnimationFrame(() =>
      window.requestAnimationFrame(() => {
        document
          .getElementById(href.slice(1))
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }),
    );
  };

  const submitSearch = (event) => {
    event.preventDefault();
    setMenuAberto(false);
    window.dispatchEvent(
      new CustomEvent("farmavida:search-products", {
        detail: { query: search },
      }),
    );
    window.requestAnimationFrame(() => {
      document
        .getElementById("catalog-controls")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const initial = (user?.nome || user?.email || "?").trim()[0]?.toUpperCase();

  return (
    <>
      <a href="#main-content" className="skip-link">
        Pular para o conteúdo principal
      </a>
      <header
        className={`site-header ${scrolled ? "scrolled" : ""}`}
        role="banner"
      >
        <div className="container fv-header-main header-inner">
          <a
            href="#"
            className="brand fv-header-brand"
            aria-label="FarmaVida: voltar ao início"
            onClick={(event) => goTo(event, "#")}
          >
            <span className="brand-logo" aria-hidden="true">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <path d="M12 7v10M7 12h10" />
              </svg>
            </span>
            <span className="brand-text fv-brand-wordmark">
              <span className="fv-brand-name">
                <strong>Farma</strong>
                <span>Vida</span>
              </span>
              <small>Farmácia virtual</small>
            </span>
          </a>

          <form
            className="fv-header-search"
            role="search"
            onSubmit={submitSearch}
          >
            <label htmlFor="fv-header-search-input" className="sr-only">
              Pesquisar produtos no catálogo
            </label>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="10.7" cy="10.7" r="6.5" />
              <path d="m16 16 5 5" />
            </svg>
            <input
              id="fv-header-search-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="O que você procura hoje?"
              type="search"
              autoComplete="off"
            />
            <button type="submit" aria-label="Pesquisar produtos">
              Buscar <span aria-hidden="true">→</span>
            </button>
          </form>

          <div className="header-actions fv-header-actions">
            {onOpenWorkspace && (
              <button
                type="button"
                className="hd-workspace-switch"
                onClick={onOpenWorkspace}
                title="Abrir painel farmacêutico"
                aria-label="Abrir painel farmacêutico"
              >
                <span aria-hidden="true">▦</span>
                <span className="hd-workspace-label">Painel</span>
              </button>
            )}
            {isLoggedIn ? (
              <button
                type="button"
                className="hd-user"
                onClick={() => openAccount("dados")}
                aria-label="Minha conta"
              >
                <span className="hd-avatar" aria-hidden="true">
                  {initial}
                </span>
                <span className="hd-user-name">
                  {user.nome?.split(" ")[0] || "Conta"}
                </span>
              </button>
            ) : (
              <button
                type="button"
                className="hd-login"
                onClick={() => openAuth("login")}
                aria-label="Entrar na minha conta"
              >
                <span aria-hidden="true">◉</span>
                <span>Entrar</span>
              </button>
            )}
            <button
              type="button"
              className="cart-btn"
              onClick={toggleCart}
              aria-label={`Carrinho de compras (${totalItems} itens)`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {totalItems > 0 && (
                <span className="cart-count" aria-hidden="true">
                  {totalItems}
                </span>
              )}
            </button>
            <button
              type="button"
              className="menu-toggle"
              onClick={() => setMenuAberto((open) => !open)}
              aria-expanded={menuAberto}
              aria-controls="mobile-menu"
              aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
            >
              <span className="hamburger" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="fv-header-nav-strip">
          <nav
            className="main-nav container"
            role="navigation"
            aria-label="Navegação principal"
          >
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`nav-btn ${item.href === `#${activeId}` || (item.href === "#" && !activeId) ? "active" : ""}`}
                onClick={(event) => goTo(event, item.href)}
                aria-current={item.href === `#${activeId}` ? "page" : undefined}
              >
                <span className="nav-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </a>
            ))}
            <a
              href="#receita"
              className="fv-nav-cta"
              onClick={(event) => goTo(event, "#receita")}
            >
              Enviar receita <span aria-hidden="true">↗</span>
            </a>
          </nav>
        </div>

        {menuAberto && (
          <nav
            className="menu"
            id="mobile-menu"
            aria-label="Navegação para dispositivos móveis"
          >
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(event) => goTo(event, item.href)}
                aria-current={
                  item.href === `#${activeId}` ? "location" : undefined
                }
              >
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
        )}
      </header>
    </>
  );
}
