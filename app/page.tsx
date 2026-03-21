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
  QUERY_POLLING_OPTIONS,
  useGetAllPublicProductsQuery,
  useGetPublicLocationsQuery,
} from "@/app/catalog/_service/catalogApi";
import { toImageProxyUrl } from "@/lib/image";
import { isExcludedLandingStore } from "@/app/lib/landing-filters";
import { getBusinessUrl } from "@/lib/runtime-config";

const STROVA_BUSINESS_URL = getBusinessUrl();

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

const HERO_QUICK_TAGS = [
  { label: "Seguro", href: "/catalog?tab=tiendas" },
  { label: "Fácil", href: "/catalog?tab=productos" },
  { label: "Cerca", href: "/catalog" },
] as const;

/** Subí el número (?v=) al cambiar el archivo en `public/images/`. `unoptimized` sirve el asset tal cual sin pasar por el optimizador de Next. */
const HERO_PORTRAIT_SRC = "/images/woman1.webp?v=1";

export default function LandingPage() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { data: locations = [] } = useGetPublicLocationsQuery(undefined, QUERY_POLLING_OPTIONS.general);
  const { data: allProducts } = useGetAllPublicProductsQuery(
    { page: 1, pageSize: 200 },
    QUERY_POLLING_OPTIONS.general,
  );

  const topStoresRaw = locations.length
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

  const topStores = locations.length
    ? topStoresRaw.filter((s) => !isExcludedLandingStore(s.name, s.category))
    : topStoresRaw;

  const activeStoreCount = locations.length;
  const socialProofLine =
    activeStoreCount > 0
      ? `${activeStoreCount.toLocaleString("es-AR")} tiendas activas cerca de vos`
      : "Cientos de tiendas locales en tu ciudad";

  const topProducts = allProducts?.data?.length
    ? allProducts.data.map((product) => ({
        id: product.id,
        name: product.name,
        price: product.precio,
        store: product.locationName || "Tienda local",
        locationId: product.locationId,
        imageUrl: toImageProxyUrl(product.imagenUrl),
        stockAtLocation: product.stockAtLocation,
        tipo: product.tipo,
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
          stockAtLocation: 99,
          tipo: "inventariable" as const,
        };
      });

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    const params = new URLSearchParams({ tab: "productos" });
    if (trimmed) params.set("q", trimmed);
    router.push(`/catalog?${params.toString()}`);
  };

  return (
    <div className="landing">
      <section className="landing-hero landing-hero--split landing-anim">
        <div className="landing-hero__blob landing-hero__blob--tr" aria-hidden />
        <div className="landing-hero__blob landing-hero__blob--tl" aria-hidden />
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
        </div>
        <div className="landing-hero__split-wrap landing-shell">
          <div className="landing-hero__split-inner landing-hero__split-inner--layered">
            <div className="landing-hero__image-wrap">
              <Image
                src={HERO_PORTRAIT_SRC}
                alt=""
                fill
                className="landing-hero__image"
                unoptimized
                priority
              />
            </div>
            <div className="landing-hero__overlay">
              <div className="landing-hero__content">
                <p className="landing-hero__eyebrow">Comercio local digital</p>
                <h1 className="landing-hero__title">
                  El <span className="landing-hero__title-accent">marketplace</span> de tu ciudad
                </h1>
                <p className="landing-hero__subtitle">
                  StrovaStore reúne tiendas reales de tu zona, te deja comparar opciones y terminar tu pedido por WhatsApp sin complicaciones.
                </p>
                <form className="landing-hero-search" onSubmit={handleSearch}>
                  <span className="landing-hero-search__icon" aria-hidden>
                    <Icon name="search" />
                  </span>
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
                  {HERO_QUICK_TAGS.map((tag) => (
                    <Link key={tag.label} href={tag.href}>
                      {tag.label}
                    </Link>
                  ))}
                </div>
                <p className="landing-hero__social-proof">{socialProofLine}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <HowItWorksSection />

      <section className="landing-section landing-section--landing-block landing-shell landing-anim">
        <SectionHeader
          eyebrow="Tiendas recomendadas"
          title="Tiendas populares"
          subtitle="Acceso directo a negocios destacados para acelerar la decisión."
          actionHref="/catalog"
          actionLabel="Ver todas las tiendas"
        />
        <EcommerceCarousel variant="stores" ariaLabel="Tiendas populares">
          {topStores.map((store) => (
            <Link key={store.id} href={`/catalog/${store.id}`} className="landing-store-card">
              <div className="landing-store-card__media">
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
              </div>
              <div className="landing-store-card__body">
                <span className="landing-store-card__name">{store.name}</span>
                <span className="landing-store-card__cat">{store.category}</span>
                <div className="landing-store-card__foot">
                  <span className="landing-store-card__eta">Entrega aprox. {store.eta}</span>
                  <span className="landing-store-card__cta">Ver tienda</span>
                </div>
              </div>
            </Link>
          ))}
        </EcommerceCarousel>
      </section>

      <section className="landing-section landing-section--landing-block landing-shell landing-anim">
        <SectionHeader
          eyebrow="Productos destacados"
          title="Productos populares"
          subtitle="Compará precio y tienda en una vista simple antes de ir al catálogo completo."
          actionHref="/catalog?tab=productos"
          actionLabel="Ver todos los productos"
        />
        <EcommerceCarousel variant="products" ariaLabel="Productos populares">
          {topProducts.map((product) => {
            const soldOut = product.tipo === "inventariable" && product.stockAtLocation <= 0;
            return (
              <Link
                key={product.id}
                href={
                  typeof product.locationId === "number" && Number.isInteger(product.locationId)
                    ? `/catalog/${product.locationId}/product/${product.id}`
                    : "/catalog?tab=productos"
                }
                className="landing-product-card"
              >
                <div className="landing-product-card__media">
                  {soldOut ? (
                    <span className="landing-product-card__soldout" aria-hidden>
                      AGOTADO
                    </span>
                  ) : null}
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
                </div>
                <div className="landing-product-card__body">
                  <span className="landing-product-card__price">
                    <PriceText value={product.price} />
                  </span>
                  <span className="landing-product-card__name">{product.name}</span>
                  <span className="landing-product-card__store">{product.store}</span>
                  <span className="landing-product-card__link">Ver en tienda →</span>
                </div>
              </Link>
            );
          })}
        </EcommerceCarousel>
        {/* TODO: cuando el backend no entregue locationId por producto, mantener fallback al listado general de productos. */}
      </section>

      <section className="landing-business landing-shell landing-anim">
        <div className="landing-business__inner">
          <div className="landing-business__grid">
            <div className="landing-business__content">
              <p className="landing-business__eyebrow">Para negocios</p>
              <h2 className="landing-business__title">¿Tenés un negocio?</h2>
              <p className="landing-business__subtitle">
                Sumá tu comercio al catálogo local y recibí pedidos por WhatsApp con una vitrina simple.
              </p>
              <ul className="landing-business__list">
                <li>
                  <span className="landing-business__check" aria-hidden>
                    ✓
                  </span>
                  Tu tienda online configurada en minutos.
                </li>
                <li>
                  <span className="landing-business__check" aria-hidden>
                    ✓
                  </span>
                  Recibí pedidos directo por WhatsApp.
                </li>
                <li>
                  <span className="landing-business__check" aria-hidden>
                    ✓
                  </span>
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
            </div>
            <div className="landing-business__highlights">
              <div className="landing-business__highlight">
                <span className="landing-business__highlight-icon" aria-hidden>
                  📦
                </span>
                <div className="landing-business__highlight-text">
                  <span className="landing-business__highlight-title">Gestión de inventario en tiempo real</span>
                  <span className="landing-business__highlight-desc">Stock y precios en un solo lugar</span>
                </div>
              </div>
              <div className="landing-business__highlight">
                <span className="landing-business__highlight-icon" aria-hidden>
                  💬
                </span>
                <div className="landing-business__highlight-text">
                  <span className="landing-business__highlight-title">Pedidos directo por WhatsApp</span>
                  <span className="landing-business__highlight-desc">Mensajes claros al instante</span>
                </div>
              </div>
              <div className="landing-business__highlight">
                <span className="landing-business__highlight-icon" aria-hidden>
                  📊
                </span>
                <div className="landing-business__highlight-text">
                  <span className="landing-business__highlight-title">Panel de control completo</span>
                  <span className="landing-business__highlight-desc">Métricas y pedidos cuando las necesites</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
