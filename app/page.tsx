import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import "./landing.css";

const STROVA_BUSINESS_URL = "https://strova.com";

export default function LandingPage() {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <Link href="/" className="landing-nav__brand">
          <span className="landing-nav__logo-box">
            <Icon name="storefront" />
          </span>
          StrovaStore
        </Link>
        <div className="landing-nav__links">
          <Link href="/catalog" className="landing-nav__link">
            Tiendas
          </Link>
          <Link href="/catalog?tab=productos" className="landing-nav__link">
            Productos
          </Link>
          <a
            href={STROVA_BUSINESS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="landing-nav__link"
          >
            ¿Tenés un negocio?
          </a>
        </div>
        <Link href="/catalog" className="landing-nav__cta">
          Entrar en store
        </Link>
      </nav>

      <section className="landing-hero">
        <div className="landing-hero__inner">
          <div>
            <h1 className="landing-hero__title">
              Todas las tiendas de tu ciudad, en un solo lugar
            </h1>
            <p className="landing-hero__subtitle">
              Descubrí productos locales de cercanía. Desde el café de la esquina
              hasta la ferretería del barrio. Todo a un WhatsApp de distancia.
            </p>
            <div className="landing-hero__ctas">
              <Link href="/catalog" className="landing-btn landing-btn--primary">
                Ver tiendas
              </Link>
              <Link
                href="/catalog?tab=productos"
                className="landing-btn landing-btn--outline"
              >
                Explorar productos
              </Link>
            </div>
          </div>
          <div className="landing-hero__mock">
            <div className="landing-hero__mock-bar">
              <Icon name="search" />
              <span>Buscar en StrovaStore...</span>
            </div>
            <div className="landing-hero__mock-grid">
              <div className="landing-hero__mock-row">
                <div className="landing-hero__mock-cell" />
                <div className="landing-hero__mock-cell" />
              </div>
              <div className="landing-hero__mock-img" />
              <div className="landing-hero__mock-cell" style={{ width: "30%", minHeight: 20 }} />
              <div className="landing-hero__mock-cell" style={{ width: "50%", minHeight: 20 }} />
            </div>
          </div>
        </div>
      </section>

      <section className="landing-stats">
        <div className="landing-stats__inner">
          <div className="landing-stats__item">
            <span className="landing-stats__value">150+</span>
            <span className="landing-stats__label">Tiendas activas</span>
          </div>
          <div className="landing-stats__divider" aria-hidden />
          <div className="landing-stats__item">
            <span className="landing-stats__value">8</span>
            <span className="landing-stats__label">Categorías</span>
          </div>
          <div className="landing-stats__divider" aria-hidden />
          <div className="landing-stats__item">
            <span className="landing-stats__value landing-stats__value--green">WhatsApp</span>
            <span className="landing-stats__label">Pedidos directos</span>
          </div>
          <div className="landing-stats__divider" aria-hidden />
          <div className="landing-stats__item">
            <span className="landing-stats__value">100% Gratis</span>
            <span className="landing-stats__label">Para compradores</span>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <p className="landing-section__eyebrow">Cómo funciona</p>
        <h2 className="landing-section__title">
          Tu compra local en 3 simples pasos
        </h2>
        <div className="landing-steps">
          <div className="landing-step">
            <div className="landing-step__icon">
              <Icon name="search" />
            </div>
            <h3 className="landing-step__title">Explorá tu zona</h3>
            <p className="landing-step__desc">
              Navegá por el mapa o las categorías para encontrar tus tiendas
              favoritas cerca tuyo.
            </p>
          </div>
          <div className="landing-step">
            <div className="landing-step__icon">
              <Icon name="shopping_basket" />
            </div>
            <h3 className="landing-step__title">Elegí productos</h3>
            <p className="landing-step__desc">
              Revisá catálogos actualizados con precios reales. Armá tu carrito
              sin vueltas.
            </p>
          </div>
          <div className="landing-step">
            <div className="landing-step__icon">
              <Icon name="chat" />
            </div>
            <h3 className="landing-step__title">Pedí por WhatsApp</h3>
            <p className="landing-step__desc">
              Al finalizar, se genera un mensaje automático. Acordás el pago y
              envío directo con la tienda.
            </p>
          </div>
        </div>
      </section>

      <section className="landing-section landing-section--categories">
        <h2 className="landing-categories__title">Explorá por rubro</h2>
        <div className="landing-categories__wrap">
          {[
            { icon: "restaurant", label: "Alimentación", color: "#FF7043" },
            { icon: "devices", label: "Electrónica", color: "#5C6BC0" },
            { icon: "home", label: "Hogar", color: "#8D6E63" },
            { icon: "medical_services", label: "Salud", color: "#66BB6A" },
            { icon: "checkroom", label: "Ropa", color: "#EC407A" },
            { icon: "fitness_center", label: "Deporte", color: "#26A69A" },
            { icon: "build", label: "Ferretería", color: "#78909C" },
            { icon: "menu_book", label: "Librería", color: "#AB47BC" },
          ].map((cat) => (
            <Link
              key={cat.label}
              href="/catalog?tab=productos"
              className="landing-cat-chip"
            >
              <span className="landing-cat-chip__icon" style={{ color: cat.color }}>
                <Icon name={cat.icon} />
              </span>
              {cat.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="landing-section landing-section--gray">
        <div className="landing-section__inner">
          <div className="landing-section__head">
            <h2 className="landing-section__head-title">Tiendas populares</h2>
            <Link href="/catalog" className="landing-section__head-link">
              Ver todas las tiendas →
            </Link>
          </div>
          <div className="landing-store-grid">
            {[
              { name: "Café del Barrio", category: "Cafetería & Bakery" },
              { name: "Ferretería Central", category: "Herramientas & Hogar" },
              { name: "Green Garden", category: "Vivero & Plantas" },
              { name: "Tech Point", category: "Accesorios de Celular" },
            ].map((store) => (
              <Link
                key={store.name}
                href="/catalog"
                className="landing-store-card"
              >
                <div className="landing-store-card__img" />
                <div className="landing-store-card__body">
                  <div className="landing-store-card__head">
                    <span className="landing-store-card__name">{store.name}</span>
                    <span className="landing-store-card__badge">Abierto</span>
                  </div>
                  <span className="landing-store-card__cat">{store.category}</span>
                  <span className="landing-store-card__btn">Ver tienda</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section__head">
          <h2 className="landing-section__head-title">Productos destacados</h2>
          <Link href="/catalog?tab=productos" className="landing-section__head-link">
            Ver todos los productos →
          </Link>
        </div>
        <div className="landing-product-grid">
          {[
            { name: "Café en Grano 1kg", price: "$12.500", store: "Café del Barrio" },
            { name: "Taladro Inalámbrico", price: "$85.000", store: "Ferretería Central" },
            { name: "Suculenta Mini", price: "$3.200", store: "Green Garden" },
            { name: "Auriculares Bluetooth", price: "$22.400", store: "Tech Point" },
          ].map((product) => (
            <Link
              key={product.name}
              href="/catalog?tab=productos"
              className="landing-product-card"
            >
              <div className="landing-product-card__img" />
              <div className="landing-product-card__body">
                <span className="landing-product-card__name">{product.name}</span>
                <span className="landing-product-card__store">{product.store}</span>
                <span className="landing-product-card__price">{product.price}</span>
                <span className="landing-product-card__btn">Ver en tienda</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="landing-business">
        <div className="landing-business__content">
          <h2 className="landing-business__title">
            ¿Tenés un negocio? Sumalo a StrovaStore
          </h2>
          <ul className="landing-business__list">
            <li>
              <Icon name="check_circle" />
              Tu tienda online configurada en minutos
            </li>
            <li>
              <Icon name="check_circle" />
              Recibí todos tus pedidos directo al WhatsApp
            </li>
            <li>
              <Icon name="check_circle" />
              Gestioná stock y precios desde cualquier lugar
            </li>
          </ul>
          <a
            href={STROVA_BUSINESS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="landing-business__cta"
          >
            Registrar mi negocio
          </a>
          <p className="landing-business__note">
            La gestión se realiza desde la plataforma Strova →
          </p>
        </div>
        <div className="landing-business__img" aria-hidden />
      </section>

      <footer className="landing-footer">
        <div className="landing-footer__inner">
          <div className="landing-footer__top">
            <div>
              <Link href="/" className="landing-footer__brand">
                <span className="landing-nav__logo-box" style={{ width: 28, height: 28 }}>
                  <Icon name="storefront" />
                </span>
                StrovaStore
              </Link>
              <p className="landing-footer__tagline">
                Conectando comercios locales con su comunidad.
              </p>
            </div>
            <div className="landing-footer__links">
              <div className="landing-footer__col">
                <div className="landing-footer__col-title">Explorar</div>
                <Link href="/catalog">Tiendas</Link>
                <Link href="/catalog?tab=productos">Productos</Link>
                <Link href="/catalog">Categorías</Link>
              </div>
              <div className="landing-footer__col">
                <div className="landing-footer__col-title">Negocios</div>
                <a href={STROVA_BUSINESS_URL} target="_blank" rel="noopener noreferrer">
                  Vender en Strova
                </a>
                <a href={STROVA_BUSINESS_URL} target="_blank" rel="noopener noreferrer">
                  Precios
                </a>
                <a href={STROVA_BUSINESS_URL} target="_blank" rel="noopener noreferrer">
                  Ayuda
                </a>
              </div>
              <div className="landing-footer__col">
                <div className="landing-footer__col-title">Legal</div>
                <Link href="#">Términos</Link>
                <Link href="#">Privacidad</Link>
              </div>
            </div>
          </div>
          <div className="landing-footer__divider" />
          <div className="landing-footer__bottom">
            <span>© 2024 StrovaStore. Powered by Strova.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
