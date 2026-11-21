import { useState, useRef, useEffect } from "react";
import { useCart } from "../../context/useCart.js";
import { useToast } from "../../context/useToast.js";
import QuickViewModal from "../QuickViewModal/QuickViewModal";
import {
  getProductImageSrc,
  handleProductImageError,
} from "../../utils/productImage.js";
import {
  carouselMetrics,
  clampCarouselOffset,
} from "../../utils/carouselMetrics.js";
import "./ProductCarousel.css";

export default function ProductCarousel({
  id,
  title,
  products,
  showViewAll = false,
  viewAllHref = "#",
  onViewAll,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const carouselRef = useRef(null);
  const { addItem, openCart } = useCart();
  const { showToast } = useToast();

  const [metrics, setMetrics] = useState({
    step: 1,
    maxIndex: 0,
    maxScroll: 0,
  });

  useEffect(() => {
    const track = carouselRef.current;
    if (!track) return undefined;

    const update = () => {
      const first = track.querySelector(".product-card");
      if (!first) {
        setMetrics({ step: 1, maxIndex: 0, maxScroll: 0 });
        setCurrentIndex(0);
        return;
      }
      const gap =
        Number.parseFloat(window.getComputedStyle(track).columnGap) || 0;
      const next = carouselMetrics({
        scrollWidth: track.scrollWidth,
        clientWidth: track.clientWidth,
        cardWidth: first.getBoundingClientRect().width,
        gap,
      });
      setMetrics(next);
      setCurrentIndex(
        Math.min(next.maxIndex, Math.round(track.scrollLeft / next.step)),
      );
    };

    update();
    track.addEventListener("scroll", update, { passive: true });
    // Atualiza as setas quando a largura do carrossel muda.
    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    observer?.observe(track);
    window.addEventListener("resize", update);
    return () => {
      track.removeEventListener("scroll", update);
      observer?.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [products.length]);

  const goToIndex = (index) => {
    const track = carouselRef.current;
    if (!track) return;
    const target = clampCarouselOffset(index * metrics.step, metrics.maxScroll);
    track.scrollTo({ left: target, behavior: "smooth" });
  };

  const scrollLeft = () => goToIndex(currentIndex - 1);
  const scrollRight = () => goToIndex(currentIndex + 1);

  const canScrollLeft = currentIndex > 0;
  const canScrollRight = currentIndex < metrics.maxIndex;

  const handleAddToCart = (product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: getProductImageSrc(product),
      category: product.category,
      requiresPrescription: product.requiresPrescription === true,
    });
    showToast(`${product.name} adicionado ao carrinho!`, "success");
    openCart();
  };

  const handleQuickView = (product) => {
    setQuickViewProduct(product);
  };

  const handleShare = async (product) => {
    try {
      const url = `${window.location.origin}${window.location.pathname}#${id}`;
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text: product.description,
          url,
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        showToast("Link da categoria copiado!", "info");
      } else {
        showToast("Compartilhamento não disponível neste navegador.", "info");
      }
    } catch (error) {
      if (error?.name !== "AbortError")
        showToast("Não foi possível compartilhar.", "error");
    }
  };

  return (
    <>
      <section
        id={id}
        className="product-carousel-section"
        aria-labelledby={`${title.toLowerCase().replace(/\s+/g, "-")}-title`}
      >
        <div className="container">
          <div className="carousel-header">
            <h2
              id={`${title.toLowerCase().replace(/\s+/g, "-")}-title`}
              className="carousel-title"
            >
              {title}
            </h2>
            {showViewAll &&
              (onViewAll ? (
                <button
                  type="button"
                  className="view-all-link"
                  onClick={() => onViewAll(id)}
                >
                  Ver todos{" "}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <a href={viewAllHref} className="view-all-link">
                  Ver todos{" "}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </a>
              ))}
          </div>

          <div className="carousel-wrapper">
            <button
              className="carousel-arrow carousel-arrow-left"
              onClick={scrollLeft}
              disabled={!canScrollLeft}
              aria-label="Produtos anteriores"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <div className="carousel-track" ref={carouselRef} role="list">
              {products.map((product) => (
                <article
                  key={product.id}
                  className="product-card"
                  role="listitem"
                >
                  <div className="product-image">
                    <img
                      src={getProductImageSrc(product)}
                      alt={product.name}
                      loading="lazy"
                      onError={(event) =>
                        handleProductImageError(event, product)
                      }
                    />
                    <button
                      type="button"
                      className="product-image-open"
                      onClick={() => handleQuickView(product)}
                      aria-label={`Ver detalhes de ${product.name}`}
                    >
                      Ver detalhes
                    </button>
                    {product.badge && (
                      <div className="product-badge">
                        <span className={`badge badge-${product.badge}`}>
                          {product.badge === "new" && "Novo"}
                          {product.badge === "sale" && "Promoção"}
                          {product.badge === "bestseller" && "Mais Vendido"}
                          {product.badge === "outlet" && "Outlet"}
                        </span>
                      </div>
                    )}
                    <div className="product-quick-actions">
                      <button
                        className="quick-action-btn"
                        aria-label={`Compartilhar ${product.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(product);
                        }}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden="true"
                        >
                          <circle cx="18" cy="5" r="3" />
                          <circle cx="6" cy="12" r="3" />
                          <circle cx="18" cy="19" r="3" />
                          <path d="M9 10.5l6-4M9 13.5l6 4" />
                        </svg>
                      </button>
                      <button
                        className="quick-action-btn"
                        aria-label={`Visualizar ${product.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickView(product);
                        }}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden="true"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="product-info">
                    <div className="product-meta">
                      <span className="product-category">
                        {product.category}
                      </span>
                      <span className="product-price">
                        {formatPrice(product.price)}
                      </span>
                    </div>
                    <h3 className="product-title">{product.name}</h3>
                    <p className="product-desc">{product.description}</p>
                    <div className="product-footer">
                      <div className="product-colors">
                        <span
                          className="color-swatch"
                          data-color="branco"
                          aria-hidden="true"
                        ></span>
                        <span
                          className="color-swatch"
                          data-color="azul"
                          aria-hidden="true"
                        ></span>
                        <span
                          className="color-swatch"
                          data-color="verde"
                          aria-hidden="true"
                        ></span>
                      </div>
                      <button
                        className="btn btn-primary btn-add-cart"
                        onClick={() => handleAddToCart(product)}
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <button
              className="carousel-arrow carousel-arrow-right"
              onClick={scrollRight}
              disabled={!canScrollRight}
              aria-label="Próximos produtos"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          {metrics.maxIndex > 0 && (
            <div
              className="carousel-indicators"
              aria-label="Posição do carrossel"
            >
              {Array.from({ length: metrics.maxIndex + 1 }, (_, i) => (
                <button
                  key={i}
                  className={`carousel-indicator ${i === currentIndex ? "active" : ""}`}
                  onClick={() => goToIndex(i)}
                  aria-label={`Ir para grupo ${i + 1}`}
                  aria-current={i === currentIndex ? "true" : "false"}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <QuickViewModal
        key={quickViewProduct?.id ?? "closed"}
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </>
  );
}

function formatPrice(price) {
  return `R$ ${price.toFixed(2).replace(".", ",")}`;
}
