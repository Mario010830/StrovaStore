"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { BusinessCategoryPill } from "@/components/ui/BusinessCategoryPill";
import { PriceText } from "@/components/ui/PriceText";
import { EcommerceCarousel } from "@/components/landing/EcommerceCarousel";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { SectionHeader } from "@/components/landing/SectionHeader";
import { StoreHeroSequence } from "@/components/landing/StoreHeroSequence";
import {
  QUERY_POLLING_OPTIONS,
  useGetAllPublicProductsQuery,
  useGetBusinessCategoriesQuery,
  useGetPublicLocationsQuery,
} from "@/app/catalog/_service/catalogApi";
import { toImageProxyUrl } from "@/lib/image";
import { isExcludedLandingStore } from "@/app/lib/landing-filters";
import {
  buildCatalogZoneHref,
  getZoneCardSubtitle,
  getZoneCardTitle,
  groupPublicLocationsByZone,
} from "@/app/lib/landing-zones";
import { getBusinessUrl } from "@/lib/runtime-config";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { getBusinessCategoryLucideIcon } from "@/utils/businessCategoryIcons";
import { buildLocationCatalogPath, buildLocationProductPath } from "@/lib/location-path";

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

/** Cantidad mostrada en «Productos populares» (landing); no listar todo el catálogo. */
const LANDING_TOP_PRODUCTS_LIMIT = 4;

type LandingCategoryRowItem = { key: string; name: string; slug: string };

export default function LandingPage() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMobileLanding = useMediaQuery("(max-width: 768px)");

  const [mobSearchOpen, setMobSearchOpen] = useState(false);
  const landingSearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.classList.add("page-landing");
    return () => { document.body.classList.remove("page-landing"); };
  }, []);
  const { data: locations = [] } = useGetPublicLocationsQuery(undefined, QUERY_POLLING_OPTIONS.general);
  const { data: businessCategories = [] } = useGetBusinessCategoriesQuery(
    undefined,
    QUERY_POLLING_OPTIONS.general,
  );
  const { data: allProducts } = useGetAllPublicProductsQuery(
    { page: 1, pageSize: LANDING_TOP_PRODUCTS_LIMIT },
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
        businessCategoryId: store.businessCategoryId ?? null,
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
          businessCategoryId: null as number | null,
        };
      });

  const topStores = locations.length
    ? topStoresRaw.filter((s) => !isExcludedLandingStore(s.name, s.category))
    : topStoresRaw;

  const categorySlug = searchParams.get("category")?.trim() ?? "";

  const landingCategoryItems: LandingCategoryRowItem[] = useMemo(() => {
    const sorted = [...businessCategories].sort((a, b) =>
      a.name.localeCompare(b.name, "es", { sensitivity: "base" }),
    );
    return [
      { key: "todos", name: "Todos", slug: "" },
      ...sorted.map((c) => ({ key: String(c.id), name: c.name, slug: c.slug })),
    ];
  }, [businessCategories]);

  const activeCategoryKey = useMemo(() => {
    if (!categorySlug) return "todos";
    const match = businessCategories.find((c) => c.slug === categorySlug);
    return match ? String(match.id) : "todos";
  }, [categorySlug, businessCategories]);

  const selectLandingCategory = useCallback(
    (item: LandingCategoryRowItem) => {
      const sp = new URLSearchParams(searchParams.toString());
      if (item.key === "todos" || !item.slug) sp.delete("category");
      else sp.set("category", item.slug);
      const q = sp.toString();
      const base = pathname || "/";
      router.replace(q ? `${base}?${q}` : base, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const storesForCards = useMemo(() => {
    const byId = new Map(businessCategories.map((c) => [c.id, c.name]));
    return topStores.map((s) => ({
      ...s,
      businessCategoryName:
        s.businessCategoryId != null ? (byId.get(s.businessCategoryId) ?? null) : null,
    }));
  }, [topStores, businessCategories]);

  const displayStores = useMemo(() => {
    if (!locations.length) return storesForCards;
    if (activeCategoryKey === "todos") return storesForCards;
    const catId = Number(activeCategoryKey);
    if (!Number.isInteger(catId) || catId <= 0) return storesForCards;
    return storesForCards.filter((s) => s.businessCategoryId === catId);
  }, [locations.length, storesForCards, activeCategoryKey]);

  const locationZones = useMemo(() => {
    const filtered = locations.filter(
      (l) => !isExcludedLandingStore(l.name, l.organizationName || ""),
    );
    return groupPublicLocationsByZone(filtered).map((zone) => ({
      ...zone,
      coverUrl: toImageProxyUrl(zone.locations.find((loc) => loc.photoUrl)?.photoUrl ?? null),
      href: buildCatalogZoneHref(zone.province, zone.municipality),
    }));
  }, [locations]);

  const activeStoreCount = locations.length;
  const socialProofLine =
    activeStoreCount > 0
      ? `${activeStoreCount.toLocaleString("es-US")} tiendas activas cerca de ti`
      : "Cientos de tiendas locales en tu ciudad";

  const topProducts = allProducts?.data?.length
    ? allProducts.data.slice(0, LANDING_TOP_PRODUCTS_LIMIT).map((product) => ({
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
    const params = new URLSearchParams();
    if (trimmed) params.set("q", trimmed);
    const qs = params.toString();
    router.push(qs ? `/catalog/productos?${qs}` : "/catalog/productos");
  };

  const renderProductHref = (product: (typeof topProducts)[number]) =>
    typeof product.locationId === "number" && Number.isInteger(product.locationId)
      ? buildLocationProductPath(
          { id: product.locationId, name: product.store },
          product.id,
        )
      : "/catalog?tab=productos";

  const mobileCatScrollRef = useRef<HTMLDivElement>(null);
  const [mobileCatScroll, setMobileCatScroll] = useState({ canLeft: false, canRight: false });

  const updateMobileCatScrollHints = useCallback(() => {
    const el = mobileCatScrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setMobileCatScroll({
      canLeft: scrollLeft > 2,
      canRight: scrollLeft + clientWidth < scrollWidth - 2,
    });
  }, []);

  useEffect(() => {
    const el = mobileCatScrollRef.current;
    if (!el) return;
    updateMobileCatScrollHints();
    el.addEventListener("scroll", updateMobileCatScrollHints, { passive: true });
    const ro = new ResizeObserver(updateMobileCatScrollHints);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateMobileCatScrollHints);
      ro.disconnect();
    };
  }, [updateMobileCatScrollHints, landingCategoryItems.length, isMobileLanding]);

  const scrollMobileCategories = useCallback((direction: -1 | 1) => {
    const el = mobileCatScrollRef.current;
    if (!el) return;
    const delta = Math.min(200, Math.round(el.clientWidth * 0.55)) * direction;
    el.scrollBy({ left: delta, behavior: "smooth" });
  }, []);

  return (
    <div className="landing">
      <div className="landing-mobile-top landing-mob-only">
        <div className="landing-mobile-top__sticky">
          <div className="landing-mobile-search">
            {mobSearchOpen ? (
              <form className="landing-mobile-search__row" onSubmit={handleSearch}>
                <div className="landing-mobile-search__box">
                  <Icon name="search" />
                  <input
                    ref={landingSearchRef}
                    type="search"
                    className="landing-mobile-search__input"
                    placeholder="Buscar productos o tiendas..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                    onBlur={() => { if (!query) setMobSearchOpen(false); }}
                  />
                  {query ? (
                    <button
                      type="button"
                      className="landing-mobile-search__clear"
                      onClick={() => { setQuery(""); landingSearchRef.current?.focus(); }}
                      aria-label="Limpiar"
                    >
                      <Icon name="close" />
                    </button>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="landing-mobile-search__cancel"
                  onClick={() => { setMobSearchOpen(false); setQuery(""); }}
                >
                  Cancelar
                </button>
              </form>
            ) : (
              <button type="button" className="landing-mobile-search__pill" onClick={() => setMobSearchOpen(true)}>
                <span className="landing-mobile-search__pill-icon"><Icon name="storefront" /></span>
                <span className="landing-mobile-search__pill-text">
                  <span className="landing-mobile-search__pill-title">Catálogos</span>
                  <span className="landing-mobile-search__pill-sub">Strova</span>
                </span>
                <span className="landing-mobile-search__pill-search"><Icon name="search" /></span>
              </button>
            )}
          </div>
          <div className="landing-mobile-categories-wrap">
            <button
              type="button"
              className={`landing-mobile-categories-arrow landing-mobile-categories-arrow--left${mobileCatScroll.canLeft ? "" : " landing-mobile-categories-arrow--muted"}`}
              aria-label="Ver categorías anteriores"
              tabIndex={mobileCatScroll.canLeft ? undefined : -1}
              onClick={() => scrollMobileCategories(-1)}
            >
              <ChevronLeft size={18} strokeWidth={2} aria-hidden />
            </button>
            <div
              ref={mobileCatScrollRef}
              className="landing-mobile-categories"
              role="tablist"
              aria-label="Categorías de negocio"
            >
              {landingCategoryItems.map((cat) => {
                const active = activeCategoryKey === cat.key;
                const LucideIcon =
                  cat.key === "todos" ? LayoutGrid : getBusinessCategoryLucideIcon(cat.name);
                return (
                  <button
                    key={cat.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    className={`landing-mobile-cat${active ? " landing-mobile-cat--active" : ""}`}
                    onClick={() => selectLandingCategory(cat)}
                  >
                    <span className="landing-mobile-cat__icon-wrap">
                      <LucideIcon size={24} strokeWidth={2} aria-hidden />
                    </span>
                    <span className="landing-mobile-cat__label">{cat.name}</span>
                    {active ? <span className="landing-mobile-cat__dot" aria-hidden /> : null}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className={`landing-mobile-categories-arrow landing-mobile-categories-arrow--right${mobileCatScroll.canRight ? "" : " landing-mobile-categories-arrow--muted"}`}
              aria-label="Ver más categorías"
              tabIndex={mobileCatScroll.canRight ? undefined : -1}
              onClick={() => scrollMobileCategories(1)}
            >
              <ChevronRight size={18} strokeWidth={2} aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <section className="landing-hero landing-hero--split landing-anim landing-desktop-hero">
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
              <StoreHeroSequence />
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

      <div className="landing-desktop-category-strip landing-desktop-only landing-anim">
        <div className="landing-shell landing-desktop-category-strip__inner">
          <div className="landing-desktop-categories" role="tablist" aria-label="Categorías de negocio">
            {landingCategoryItems.map((cat) => {
              const active = activeCategoryKey === cat.key;
              const LucideIcon =
                cat.key === "todos" ? LayoutGrid : getBusinessCategoryLucideIcon(cat.name);
              return (
                <button
                  key={cat.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`landing-desktop-cat${active ? " landing-desktop-cat--active" : ""}`}
                  onClick={() => selectLandingCategory(cat)}
                >
                  <span className="landing-desktop-cat__icon" aria-hidden>
                    <LucideIcon size={16} strokeWidth={2} />
                  </span>
                  <span className="landing-desktop-cat__label">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <HowItWorksSection />

      {locationZones.length > 0 ? (
        <section className="landing-section landing-section--landing-block landing-section--zones landing-shell landing-anim">
          <div className="landing-desktop-only">
            <SectionHeader
              eyebrow="Por ubicación"
              title="Explora por zona"
              subtitle="Elige municipio o provincia y descubre las tiendas de esa zona."
              actionHref="/catalog?tab=tiendas"
              actionLabel="Ver todas las tiendas"
            />
          </div>
          <div className="landing-mob-only">
            <div className="landing-mob-section-header landing-mob-section-header--two-line">
              <div>
                <span className="landing-mob-section-header__suptitle">Explorar por</span>
                <h2 className="landing-mob-section-header__title">Zona</h2>
              </div>
              <Link href="/catalog?tab=tiendas" className="landing-mob-section-header__action">
                Ver todas →
              </Link>
            </div>
          </div>
          <div className="landing-zones-scroll">
            {locationZones.map((zone) => {
              const title = getZoneCardTitle(zone);
              const subtitle = getZoneCardSubtitle(zone);
              return (
                <Link key={zone.zoneKey} href={zone.href} className="landing-zone-card">
                  <div className="landing-zone-card__media">
                    {zone.coverUrl ? (
                      <Image
                        src={zone.coverUrl}
                        alt=""
                        fill
                        className="landing-zone-card__img"
                        sizes="(max-width: 768px) 78vw, 280px"
                      />
                    ) : (
                      <div className="landing-zone-card__placeholder" aria-hidden />
                    )}
                    <div className="landing-zone-card__overlay" aria-hidden />
                    <div className="landing-zone-card__text">
                      <span className="landing-zone-card__title">{title}</span>
                      {subtitle ? <span className="landing-zone-card__subtitle">{subtitle}</span> : null}
                      <span className="landing-zone-card__cta">Explorar</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="landing-section landing-section--landing-block landing-section--stores landing-shell landing-anim">
        <div className="landing-desktop-only">
          <SectionHeader
            eyebrow="Tiendas recomendadas"
            title="Tiendas populares"
            subtitle="Acceso directo a negocios destacados para acelerar la decisión."
            actionHref="/catalog"
            actionLabel="Ver todas las tiendas"
          />
          {displayStores.length === 0 && storesForCards.length > 0 ? (
            <p className="landing-stores-filter-empty" role="status">
              No hay tiendas en esta categoría.
            </p>
          ) : (
            <EcommerceCarousel variant="stores" ariaLabel="Tiendas populares">
              {displayStores.map((store) => (
                <Link key={store.id} href={buildLocationCatalogPath(store)} className="landing-store-card">
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
                    <BusinessCategoryPill name={store.businessCategoryName} />
                    <div className="landing-store-card__foot">
                      <span className="landing-store-card__eta">Entrega aprox. {store.eta}</span>
                      <span className="landing-store-card__cta">Ver tienda</span>
                    </div>
                  </div>
                </Link>
              ))}
            </EcommerceCarousel>
          )}
        </div>

        <div className="landing-mob-only">
          <div className="landing-mob-section-header landing-mob-section-header--two-line">
            <div>
              <span className="landing-mob-section-header__suptitle">Negocios en</span>
              <h2 className="landing-mob-section-header__title">Tendencia</h2>
            </div>
            <Link href="/catalog" className="landing-mob-section-header__action">
              Ver todas →
            </Link>
          </div>
          <div className="landing-mob-store-scroll">
            {displayStores.length === 0 && storesForCards.length > 0 ? (
              <p className="landing-stores-filter-empty landing-stores-filter-empty--mob" role="status">
                No hay tiendas en esta categoría.
              </p>
            ) : (
              displayStores.map((store) => (
                <Link key={store.id} href={buildLocationCatalogPath(store)} className="landing-mob-store-item">
                  <div className="landing-mob-store-item__avatar">
                    {store.imageUrl ? (
                      <Image
                        src={store.imageUrl}
                        alt=""
                        width={90}
                        height={90}
                        className="landing-mob-store-item__img"
                      />
                    ) : (
                      <div className="landing-mob-store-item__placeholder" aria-hidden />
                    )}
                  </div>
                  <div className="landing-mob-store-item__meta">
                    <span className="landing-mob-store-item__name">{store.name}</span>
                    <Icon name="verified" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="landing-section landing-section--landing-block landing-section--products landing-shell landing-anim">
        {isMobileLanding ? (
          <>
            <div className="landing-mob-section-header landing-mob-section-header--two-line">
              <div>
                <span className="landing-mob-section-header__suptitle">Productos</span>
                <h2 className="landing-mob-section-header__title">Populares</h2>
              </div>
              <Link href="/catalog?tab=productos" className="landing-mob-section-header__action">
                Ver todos →
              </Link>
            </div>
            <div className="landing-mob-product-grid">
              {topProducts.map((product) => {
                const soldOut = product.tipo === "inventariable" && product.stockAtLocation <= 0;
                return (
                  <Link
                    key={product.id}
                    href={renderProductHref(product)}
                    className="landing-product-card landing-product-card--market-mob"
                    onClick={(e) => {
                      if (soldOut) e.preventDefault();
                    }}
                    aria-disabled={soldOut}
                  >
                    <div className="landing-product-card__media landing-product-card__media--market-mob">
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
                          className="landing-product-card__cover-img landing-product-card__cover-img--market-mob"
                        />
                      ) : (
                        <div className="landing-product-card__cover landing-product-card__cover--market-mob" aria-hidden />
                      )}
                      <div className="landing-product-card__price-shade" aria-hidden />
                      <span className="landing-product-card__price-overlay">
                        <PriceText value={product.price} />
                      </span>
                    </div>
                    <div className="landing-product-card__body landing-product-card__body--market-mob">
                      <span className="landing-product-card__name landing-product-card__name--market-mob">
                        {product.name}
                      </span>
                      <span className="landing-product-card__store landing-product-card__store--market-mob">
                        {product.store}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <SectionHeader
              eyebrow="Productos destacados"
              title="Productos populares"
              subtitle="Compara precio y tienda en una vista simple antes de ir al catálogo completo."
              actionHref="/catalog?tab=productos"
              actionLabel="Ver todos los productos"
            />
            <EcommerceCarousel variant="products" ariaLabel="Productos populares">
              {topProducts.map((product) => {
                const soldOut = product.tipo === "inventariable" && product.stockAtLocation <= 0;
                return (
                  <Link
                    key={product.id}
                    href={renderProductHref(product)}
                    className="landing-product-card"
                    onClick={(e) => {
                      if (soldOut) e.preventDefault();
                    }}
                    aria-disabled={soldOut}
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
          </>
        )}
        {/* TODO: cuando el backend no entregue locationId por producto, mantener fallback al listado general de productos. */}
      </section>

      <section className="landing-business landing-shell landing-anim">
        <div className="landing-business__mob-banner landing-mob-only">
          <h2 className="landing-business__mob-title">¿Tienes un negocio?</h2>
          <p className="landing-business__mob-line">
            Agrega tu comercio al catálogo local y recibe pedidos por WhatsApp.
          </p>
          <a
            href={STROVA_BUSINESS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="landing-business__mob-cta"
          >
            Registrarse
          </a>
        </div>

        <div className="landing-business__inner landing-desktop-only">
          <div className="landing-business__grid">
            <div className="landing-business__content">
              <p className="landing-business__eyebrow">Para negocios</p>
              <h2 className="landing-business__title">¿Tienes un negocio?</h2>
              <p className="landing-business__subtitle">
                Agrega tu comercio al catálogo local y recibe pedidos por WhatsApp con una vitrina simple.
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
                  Recibe pedidos directos por WhatsApp.
                </li>
                <li>
                  <span className="landing-business__check" aria-hidden>
                    ✓
                  </span>
                  Gestiona stock y precios desde cualquier lugar.
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
