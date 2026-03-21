"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { PriceText } from "@/components/ui/PriceText";
import { EcommerceCarousel } from "@/components/landing/EcommerceCarousel";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { SectionHeader } from "@/components/landing/SectionHeader";
import {
  useGetAllPublicProductsQuery,
  useGetPublicLocationsQuery,
  useGetPublicTagsQuery,
} from "@/app/catalog/_service/catalogApi";
import { toImageProxyUrl } from "@/lib/image";
import { getBusinessUrl } from "@/lib/runtime-config";

const STROVA_BUSINESS_URL = getBusinessUrl();
const FALLBACK_CATEGORIES = [
  { icon: "restaurant", label: "Alimentación", slug: null, accent: "#FF7043" },
  { icon: "devices", label: "Electrónica", slug: null, accent: "#5C6BC0" },
  { icon: "home", label: "Hogar", slug: null, accent: "#8D6E63" },
  { icon: "medical_services", label: "Salud", slug: null, accent: "#66BB6A" },
  { icon: "checkroom", label: "Ropa", slug: null, accent: "#EC407A" },
  { icon: "fitness_center", label: "Deporte", slug: null, accent: "#26A69A" },
  { icon: "build", label: "Ferretería", slug: null, accent: "#78909C" },
  { icon: "menu_book", label: "Librería", slug: null, accent: "#AB47BC" },
];

const FALLBACK_STORES = [
  { name: "Café del Barrio", category: "Cafetería & Bakery", eta: "20 min" },
  { name: "Ferretería Central", category: "Herramientas & Hogar", eta: "35 min" },
  { name: "Green Garden", category: "Vivero & Plantas", eta: "25 min" },
  { name: "Tech Point", category: "Accesorios de Celular", eta: "40 min" },
];

const FALLBACK_PRODUCTS = [
  { name: "Café en Grano 1kg", price: 12500, store: "Café del Barrio" },
  { name: "Taladro Inalámbrico", price: 85000, store: "Ferretería Central" },
  { name: "Suculenta Mini", price: 3200, store: "Green Garden" },
  { name: "Auriculares Bluetooth", price: 22400, store: "Tech Point" },
];

export default function LandingPage() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { data: locations = [] } = useGetPublicLocationsQuery();
  const { data: tags = [] } = useGetPublicTagsQuery();
  const { data: allProducts } = useGetAllPublicProductsQuery({ page: 1, pageSize: 200 });

  const featuredCategories = tags.length
    ? tags.slice(0, 8).map((tag) => ({
        icon: "sell",
        label: tag.name,
        slug: tag.slug,
        accent: tag.color || "#185FA5",
      }))
    : FALLBACK_CATEGORIES;

  const topStores = locations.length
    ? locations.map((store) => ({
        id: store.id,
        name: store.name,
        category: store.organizationName || "Tienda local",
        eta: "Ver horarios",
        imageUrl: toImageProxyUrl(store.photoUrl),
        isOpen: store.isOpenNow === true,
      }))
    : Array.from({ length: 8 }).map((_, index) => {
        const store = FALLBACK_STORES[index % FALLBACK_STORES.length];
        return {
        id: index + 1,
        name: store.name,
        category: store.category,
        eta: store.eta,
        imageUrl: null,
        isOpen: true,
        };
      });

  const topProducts = allProducts?.data?.length
    ? allProducts.data.map((product) => ({
        id: product.id,
        name: product.name,
        price: product.precio,
        store: product.locationName || "Tienda local",
        locationId: product.locationId,
        imageUrl: toImageProxyUrl(product.imagenUrl),
      }))
    : Array.from({ length: 8 }).map((_, index) => {
        const product = FALLBACK_PRODUCTS[index % FALLBACK_PRODUCTS.length];
        return {
        id: index + 1,
        name: product.name,
        price: product.price,
        store: product.store,
        locationId: null,
        imageUrl: null,
        };
      });

  const visibleStoresCount = locations.length || 150;
  const visibleTagsCount = tags.length || 8;
  const visibleProductsCount = allProducts?.pagination?.total ?? 0;

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    const params = new URLSearchParams({ tab: "productos" });
    if (trimmed) params.set("q", trimmed);
    router.push(`/catalog?${params.toString()}`);
  };

  return (
    <div className="landing">
      <section className="landing-hero landing-anim">
        <div className="landing-hero__glow" aria-hidden />
        <div className="hero__birds" aria-hidden>
          <div className="bird-container bird-container--one">
            <div className="bird bird--one" />
          </div>
          <div className="bird-container bird-container--two">
            <div className="bird bird--two" />
          </div>
          <div className="bird-container bird-container--three">
            <div className="bird bird--three" />
          </div>
          <div className="bird-container bird-container--four">
            <div className="bird bird--four" />
          </div>
          <div className="bird-container bird-container--five">
            <div className="bird bird--five" />
          </div>
          <div className="bird-container bird-container--six">
            <div className="bird bird--six" />
          </div>
          <div className="bird-container bird-container--seven">
            <div className="bird bird--seven" />
          </div>
          <div className="bird-container bird-container--eight">
            <div className="bird bird--eight" />
          </div>
          <div className="bird-container bird-container--nine">
            <div className="bird bird--nine" />
          </div>
        </div>
        <div className="landing-hero__inner landing-shell">
          <div className="landing-hero__content">
            <p className="landing-hero__eyebrow">Comercio local digital</p>
            <h1 className="landing-hero__title">Comprá en tu ciudad con una experiencia moderna y rápida</h1>
            <p className="landing-hero__subtitle">
              StrovaStore reúne tiendas reales de tu zona, te deja comparar opciones y terminar tu pedido por WhatsApp sin complicaciones.
            </p>
            <form className="landing-hero-search" onSubmit={handleSearch}>
              <Icon name="search" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar productos, tiendas o categorías"
                aria-label="Buscar en StrovaStore"
              />
              <button type="submit">Buscar</button>
            </form>
            <div className="landing-hero__quick-links">
              {featuredCategories
                .slice(0, 4)
                .filter((cat) => cat.label.toLowerCase() !== "más vendido")
                .map((cat) => (
                <Link
                  key={cat.label}
                  href={cat.slug ? `/catalog?tab=productos&tag=${encodeURIComponent(cat.slug)}` : "/catalog?tab=productos"}
                >
                  {cat.label}
                </Link>
                ))}
              <Link href="/catalog?tab=productos">Más vendido</Link>
            </div>
          </div>
          <div className="landing-hero-panel">
            <div className="landing-hero-panel__head">
              <span>Actividad en tiempo real</span>
              <span className="landing-hero-panel__dot">Online</span>
            </div>
            <div className="landing-hero-panel__kpis">
              <article>
                <strong>{visibleStoresCount.toLocaleString("es-AR")}</strong>
                <span>Tiendas activas</span>
              </article>
              <article>
                <strong>{visibleTagsCount.toLocaleString("es-AR")}</strong>
                <span>Rubros cubiertos</span>
              </article>
              <article>
                <strong>24/7</strong>
                <span>Catálogos visibles</span>
              </article>
            </div>
            <div className="landing-hero-panel__list">
              {topProducts.slice(0, 3).map((product) => (
                <div key={product.id} className="landing-hero-panel__item">
                  <div>
                    <p>{product.name}</p>
                    <small>{product.store}</small>
                  </div>
                  <PriceText value={product.price} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="landing-stats landing-shell landing-anim">
        <div className="landing-stats__inner">
          <div className="landing-stats__item">
            <span className="landing-stats__value">{visibleStoresCount.toLocaleString("es-AR")}</span>
            <span className="landing-stats__label">
              <span className="landing-stats__icon" aria-hidden>
                <Icon name="storefront" />
              </span>
              Tiendas activas
            </span>
          </div>
          <div className="landing-stats__divider" aria-hidden />
          <div className="landing-stats__item">
            <span className="landing-stats__value">{visibleTagsCount.toLocaleString("es-AR")}</span>
            <span className="landing-stats__label">
              <span className="landing-stats__icon" aria-hidden>
                <Icon name="category" />
              </span>
              Categorías
            </span>
          </div>
          <div className="landing-stats__divider" aria-hidden />
          <div className="landing-stats__item">
            <span className="landing-stats__value landing-stats__value--green">WhatsApp</span>
            <span className="landing-stats__label">
              <span className="landing-stats__icon landing-stats__icon--green" aria-hidden>
                <Icon name="chat" />
              </span>
              Pedidos directos
            </span>
          </div>
          <div className="landing-stats__divider" aria-hidden />
          <div className="landing-stats__item">
            <span className="landing-stats__value">{visibleProductsCount.toLocaleString("es-AR")} </span>
            <span className="landing-stats__label">
              <span className="landing-stats__icon" aria-hidden>
                <Icon name="inventory_2" />
              </span>
              Productos públicos
            </span>
          </div>
        </div>
      </section>

      <HowItWorksSection />

      <section className="landing-section landing-shell landing-anim">
        <SectionHeader
          eyebrow="Tiendas recomendadas"
          title="Galería de tiendas populares"
          subtitle="Acceso directo a negocios destacados para acelerar la decisión."
          actionHref="/catalog"
          actionLabel="Ver todas las tiendas"
        />
        <EcommerceCarousel ariaLabel="Galería de tiendas populares">
          {topStores.map((store) => (
            <Link key={store.id} href={`/catalog/${store.id}`} className="landing-store-card">
              <span
                className={`landing-carousel-badge ${store.isOpen ? "landing-carousel-badge--open" : "landing-carousel-badge--closed"}`}
              >
                {store.isOpen ? "Abierto" : "Cerrado"}
              </span>
              {store.imageUrl ? (
                <Image
                  src={store.imageUrl}
                  alt={store.name}
                  width={640}
                  height={360}
                  className="landing-store-card__cover-img"
                />
              ) : (
                <div className="landing-store-card__cover" aria-hidden />
              )}
              <div className="landing-store-card__body">
                <div className="landing-store-card__head">
                  <span className="landing-store-card__name">{store.name}</span>
                </div>
                <span className="landing-store-card__cat">{store.category}</span>
                <div className="landing-store-card__foot">
                  <span>
                    <Icon name="schedule" /> Entrega aprox. {store.eta}
                  </span>
                  <span>Ver tienda</span>
                </div>
              </div>
            </Link>
          ))}
        </EcommerceCarousel>
      </section>

      <section className="landing-section landing-shell landing-anim">
        <SectionHeader
          eyebrow="Productos destacados"
          title="Galería de productos populares"
          subtitle="Compará precio y tienda en una vista simple antes de ir al catálogo completo."
          actionHref="/catalog?tab=productos"
          actionLabel="Ver todos los productos"
        />
        <EcommerceCarousel ariaLabel="Galería de productos populares">
          {topProducts.map((product) => (
            <Link
              key={product.id}
              href={
                typeof product.locationId === "number" && Number.isInteger(product.locationId)
                  ? `/catalog/${product.locationId}/product/${product.id}`
                  : "/catalog?tab=productos"
              }
              className="landing-product-card"
            >
              <span className="landing-carousel-badge landing-carousel-badge--price">
                <PriceText value={product.price} />
              </span>
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  width={640}
                  height={360}
                  className="landing-product-card__cover-img"
                />
              ) : (
                <div className="landing-product-card__cover" aria-hidden />
              )}
              <div className="landing-product-card__body">
                <span className="landing-product-card__name">{product.name}</span>
                <span className="landing-product-card__store">{product.store}</span>
                <span className="landing-product-card__btn">Ver en tienda</span>
              </div>
            </Link>
          ))}
        </EcommerceCarousel>
        {/* TODO: cuando el backend no entregue locationId por producto, mantener fallback al listado general de productos. */}
      </section>

      <section className="landing-business landing-shell landing-anim">
        <div className="landing-business__content">
          <p className="landing-business__eyebrow">Para negocios</p>
          <h2 className="landing-business__title">
            ¿Tenés un negocio? Sumalo a StrovaStore
          </h2>
          <ul className="landing-business__list">
            <li>
              <Icon name="check_circle" />
              Tu tienda online configurada en minutos.
            </li>
            <li>
              <Icon name="check_circle" />
              Recibí pedidos directo por WhatsApp.
            </li>
            <li>
              <Icon name="check_circle" />
              Gestioná stock y precios desde cualquier lugar.
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
            La gestión se realiza desde la plataforma Strova.
          </p>
        </div>
        <div className="landing-business__panel">
          <div className="landing-business__panel-card">
            <p>Panel de control</p>
            <strong>Pedidos hoy: 18</strong>
            <span>Crecimiento semanal +24%</span>
          </div>
          <div className="landing-business__panel-card">
            <p>Conversión por WhatsApp</p>
            <strong>62%</strong>
            <span>Mensajes con intención de compra</span>
          </div>
        </div>
      </section>

    </div>
  );
}
