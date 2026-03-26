"use client";

import { useState, useMemo, useEffect, useSyncExternalStore, useRef } from "react";
import { useParams } from "next/navigation";
import { skipToken } from "@reduxjs/toolkit/query";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import { useAppSelector, useAppDispatch } from "@/store/store";
import { addItem, updateQuantity, setLocation } from "@/store/cartSlice";
import {
  QUERY_POLLING_OPTIONS,
  useGetBusinessCategoriesQuery,
  useGetPublicCatalogQuery,
  useGetPublicLocationsQuery,
} from "../_service/catalogApi";
import { useFuseSearch } from "@/hooks/useFuseSearch";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { PushDialog } from "../components/PushDialog";
import type { PublicCatalogItem } from "@/lib/dashboard-types";
import { toImageProxyUrl } from "@/lib/image";
import { FilterChip } from "@/components/ui/FilterChip";
import { PriceText } from "@/components/ui/PriceText";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { IconActionButton } from "@/components/ui/IconActionButton";
import { getRtkErrorInfo } from "@/lib/rtk-error";
import { BusinessCategoryPill } from "@/components/ui/BusinessCategoryPill";
import { CardFavoriteButton } from "@/components/ui/CardFavoriteButton";
import { useFavoriteProduct } from "@/hooks/useFavorites";
import { useOpenCart } from "@/components/ui/CartUiContext";
import { getFavoriteProductSortKey, subscribeFavorites } from "@/lib/favorites";
import { getProductCardSubtitle, categoryDotColor } from "@/lib/catalog-display";
import { buildLocationCatalogPath, parseLocationRouteParam } from "@/lib/location-path";
import { getOriginalPriceForDisplay, getPromotionBadgeLabel } from "@/lib/catalog-promotion";

const PRODUCT_FUSE_KEYS = [
  { name: "name" as const, weight: 0.5 },
  { name: "categoryName" as const, weight: 0.25 },
  { name: "description" as const, weight: 0.15 },
  { name: "tags.name" as const, weight: 0.1 },
];

function Skeletons({ gridClass = "prod-grid" }: { gridClass?: string }) {
  return (
    <div className={gridClass}>
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="skel-card">
          <div className="skel-card__img" />
          <div className="skel-card__body">
            <div className="skel-line skel-line--lg" />
            <div className="skel-line skel-line--md" />
            <div className="skel-line skel-line--price" />
          </div>
        </div>
      ))}
    </div>
  );
}

function StoreProductCard({
  item,
  locationId,
  catalogBasePath,
}: {
  item: PublicCatalogItem;
  locationId: number;
  catalogBasePath: string;
}) {
  const { isFavorite, toggle } = useFavoriteProduct(locationId, item.id);
  const dispatch = useAppDispatch();
  const inCart = useAppSelector((s) =>
    s.cart.items.find((i) => i.productId === item.id)
  );
  const isElaborado = item.tipo === "elaborado";
  const sold = isElaborado ? false : item.stockAtLocation === 0;

  const lowStock =
    !isElaborado && item.stockAtLocation > 0 && item.stockAtLocation <= 5;

  const subtitle = getProductCardSubtitle(item);
  const promoBadge = getPromotionBadgeLabel(item);
  const originalPrice = getOriginalPriceForDisplay(item);

  const add = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (sold) return;
    dispatch(
      addItem({
        productId: item.id,
        name: item.name,
        unitPrice: item.precio,
        originalUnitPrice: item.originalPrecio ?? null,
        hasActivePromotion: item.hasActivePromotion ?? false,
        promotionType: item.promotionType ?? null,
        promotionValue: item.promotionValue ?? null,
        promotionId: item.promotionId ?? null,
        quantity: 1,
        imagenUrl: item.imagenUrl,
        stockAtLocation: item.stockAtLocation,
        tipo: item.tipo,
      })
    );
  };

  const qty = (delta: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(updateQuantity({ productId: item.id, quantity: (inCart?.quantity ?? 0) + delta }));
  };

  return (
    <div className={`sp-card${sold ? " sp-card--sold" : ""}`}>
      <Link href={`${catalogBasePath}/product/${item.id}`} className="sp-card__link">
      <div className="sp-card__img-wrap">
        {item.categoryName ? (
          <span className="sp-card__cat-pill">
            <span
              className="sp-card__cat-dot"
              style={{ background: categoryDotColor(item.categoryName) }}
              aria-hidden
            />
            {item.categoryName}
          </span>
        ) : null}
        {lowStock ? (
          <span className="sp-card__stock-pill" aria-label={`Quedan ${item.stockAtLocation} unidades`}>
            ¡Quedan {item.stockAtLocation}!
          </span>
        ) : null}
        {promoBadge ? <span className="sp-card__promo-pill">{promoBadge}</span> : null}
        {item.imagenUrl ? (() => {
          const proxiedUrl = toImageProxyUrl(item.imagenUrl);
          return proxiedUrl ? (
            <Image src={proxiedUrl} alt={item.name} className="sp-card__img" width={480} height={320} />
          ) : (
            <span style={{ fontSize: 48, color: "var(--dir-hint)" }}><Icon name="inventory_2" /></span>
          );
        })() : (
          <span style={{ fontSize: 48, color: "var(--dir-hint)" }}><Icon name="inventory_2" /></span>
        )}
        <div className="sp-card__img-gradient" aria-hidden />
        <span className="sp-card__overlay-name">{item.name}</span>
        {!sold && !inCart ? (
          <button type="button" className="sp-card__fab" onClick={add} aria-label="Agregar al carrito">
            <Icon name="add_shopping_cart" />
          </button>
        ) : null}
      </div>
      <div className="sp-card__body">
        <h3 className="sp-card__name" title={item.name}>
          {item.name}
        </h3>
        <div className="sp-card__price-wrap">
          <PriceText value={item.precio} className="sp-card__price" />
          {originalPrice != null ? (
            <PriceText value={originalPrice} className="sp-card__price-old" />
          ) : null}
        </div>
        {!sold ? (
          <p className="sp-card__stock-ok" role="status">
            En stock
          </p>
        ) : null}
        {subtitle ? (
          <p className="sp-card__desc">{subtitle}</p>
        ) : null}
        {sold ? (
          <div className="sp-card__sold-actions">
            <StatusBadge
              label="Sin stock"
              className="sp-card__add"
              active={false}
              inactiveClassName="sp-card__add--disabled"
            />
          </div>
        ) : inCart ? (
          <div className="sp-card__qty" onClick={(e) => e.preventDefault()}>
            <button type="button" className="sp-card__qty-btn" onClick={qty(-1)} aria-label="Menos">−</button>
            <span className="sp-card__qty-val">{inCart.quantity}</span>
            <button
              type="button"
              className="sp-card__qty-btn"
              onClick={qty(1)}
              disabled={!isElaborado && inCart.quantity >= item.stockAtLocation}
              aria-label="Más"
            >
              +
            </button>
          </div>
        ) : (
          <IconActionButton
            label="Agregar"
            className="sp-card__add sp-card__add--cta"
            onClick={add}
            icon={<Icon name="shopping_cart" />}
          />
        )}
      </div>
      </Link>
      <CardFavoriteButton
        isFavorite={isFavorite}
        onToggle={toggle}
        labelOn="Quitar producto de favoritos"
        labelOff="Guardar producto en favoritos"
        className="sp-card__fav"
      />
    </div>
  );
}

export default function CatalogProductsPage() {
  const params = useParams();
  const locationSlugParam = String(params.locationSlug ?? "");
  const locationId = useMemo(
    () => parseLocationRouteParam(locationSlugParam),
    [locationSlugParam],
  );
  const dispatch = useAppDispatch();
  const openCart = useOpenCart();
  const cartCount = useAppSelector((s) =>
    locationId != null && s.cart.locationId === locationId
      ? s.cart.items.reduce((a, i) => a + i.quantity, 0)
      : 0,
  );
  const [cat, setCat] = useState<string | null>(null);
  const [storeSearch, setStoreSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPushDialog, setShowPushDialog] = useState(false);
  const { requestPermissionAndSubscribe } = usePushNotifications();
  const promoSnapshotRef = useRef<string>("");

  const { data: products, isLoading, isError, error, refetch } = useGetPublicCatalogQuery(
    locationId != null ? locationId : skipToken,
    QUERY_POLLING_OPTIONS.storeCatalog,
  );
  const { data: locations } = useGetPublicLocationsQuery(undefined, QUERY_POLLING_OPTIONS.general);
  const { data: businessCategories = [] } = useGetBusinessCategoriesQuery(
    undefined,
    QUERY_POLLING_OPTIONS.general,
  );
  const loc = locationId != null ? locations?.find((l) => l.id === locationId) : undefined;

  const catalogBasePath = useMemo(() => {
    if (locationId == null) return "/catalog";
    if (loc) return buildLocationCatalogPath(loc);
    return `/catalog/${locationSlugParam}`;
  }, [locationId, loc, locationSlugParam]);

  const storeBusinessCategoryName = useMemo(() => {
    if (!loc) return null;
    if (loc.businessCategoryName?.trim()) return loc.businessCategoryName.trim();
    if (loc.businessCategoryId == null) return null;
    return businessCategories.find((c) => c.id === loc.businessCategoryId)?.name ?? null;
  }, [loc, businessCategories]);

  useEffect(() => {
    if (locationId == null) return;
    const key = `push-asked-${locationId}`;
    if (localStorage.getItem(key)) return;
    const timer = setTimeout(() => {
      setShowPushDialog(true);
      localStorage.setItem(key, "true");
    }, 5000);
    return () => clearTimeout(timer);
  }, [locationId]);

  useEffect(() => {
    if (!loc) return;
    dispatch(
      setLocation({
        id: loc.id,
        name: loc.name,
        whatsAppContact: loc.whatsAppContact ?? null,
        isOpenNow: loc.isOpenNow ?? null,
        todayOpen: loc.todayOpen ?? null,
        todayClose: loc.todayClose ?? null,
      }),
    );
  }, [loc, dispatch]);

  useEffect(() => {
    if (locationId == null || !products || products.length === 0) return;
    if (typeof window === "undefined") return;

    const activePromoKeys = products
      .filter((p) => p.hasActivePromotion)
      .map((p) =>
        p.promotionId != null
          ? `promo:${p.promotionId}`
          : `product:${p.id}:${p.precio}:${p.promotionType ?? "none"}`,
      )
      .sort();
    const nextSnapshot = activePromoKeys.join("|");
    const previousSnapshot = promoSnapshotRef.current;
    promoSnapshotRef.current = nextSnapshot;

    // First load only primes snapshot; avoid notifying old offers.
    if (!previousSnapshot) return;
    if (nextSnapshot === previousSnapshot) return;
    if (Notification.permission !== "granted") return;
    if (!activePromoKeys.length) return;

    const previousSet = new Set(previousSnapshot ? previousSnapshot.split("|") : []);
    const newPromoItems = products.filter((p) => {
      if (!p.hasActivePromotion) return false;
      const key =
        p.promotionId != null
          ? `promo:${p.promotionId}`
          : `product:${p.id}:${p.precio}:${p.promotionType ?? "none"}`;
      return !previousSet.has(key);
    });
    if (!newPromoItems.length) return;

    const first = newPromoItems[0];
    const count = newPromoItems.length;
    const title =
      count === 1
        ? `Nueva oferta en ${loc?.name ?? "tu tienda favorita"}`
        : `${count} ofertas nuevas en ${loc?.name ?? "tu tienda favorita"}`;
    const body =
      count === 1
        ? `${first.name} ahora está en oferta.`
        : `${first.name} y otros productos acaban de entrar en oferta.`;

    const show = async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.showNotification(title, {
            body,
            icon: "/images/icon-192x192.png",
            badge: "/images/icon-72x72.png",
            data: { url: catalogBasePath, locationId },
          });
          return;
        }
      } catch {
        // fallback below
      }
      try {
        new Notification(title, { body });
      } catch {
        // no-op
      }
    };
    void show();
  }, [products, locationId, loc?.name, catalogBasePath]);

  const filteredBySearch = useFuseSearch(
    products ?? [],
    PRODUCT_FUSE_KEYS,
    storeSearch,
  );

  const categories = useMemo(() => {
    const m = new Map<string, { name: string }>();
    for (const p of filteredBySearch) {
      if (!p.categoryName) continue;
      m.set(p.categoryName, { name: p.categoryName });
    }
    return Array.from(m.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredBySearch]);

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of filteredBySearch) {
      if (!p.categoryName) continue;
      map.set(p.categoryName, (map.get(p.categoryName) ?? 0) + 1);
    }
    return map;
  }, [filteredBySearch]);

  const filtered = useMemo(() => {
    if (!cat) return filteredBySearch;
    return filteredBySearch.filter((p) => p.categoryName === cat);
  }, [filteredBySearch, cat]);

  const favSortKey = useSyncExternalStore(
    subscribeFavorites,
    () => (locationId != null ? getFavoriteProductSortKey(locationId) : ""),
    () => "",
  );

  /** Favoritos en una fila aparte encima; el resto del catálogo sin duplicar. */
  const { favoriteItems, restItems } = useMemo(() => {
    const ids = favSortKey
      ? favSortKey.split(",").map((x) => Number(x)).filter((n) => Number.isInteger(n) && n > 0)
      : [];
    const favSet = new Set(ids);
    const favoriteItems: PublicCatalogItem[] = [];
    const restItems: PublicCatalogItem[] = [];
    for (const p of filtered) {
      if (favSet.has(p.id)) favoriteItems.push(p);
      else restItems.push(p);
    }
    return { favoriteItems, restItems };
  }, [filtered, favSortKey]);

  const hasProducts = !isLoading && !isError && products && products.length > 0;
  const errorInfo = getRtkErrorInfo(error);

  if (locationId == null) {
    return (
      <div className="sp-layout">
        <main className="sp-main" style={{ maxWidth: 560, margin: "0 auto", padding: 32 }}>
          <div className="store-empty">
            <div className="store-empty__icon">
              <Icon name="link_off" />
            </div>
            <p className="store-empty__text">Esta dirección de tienda no es válida.</p>
            <Link href="/catalog" className="store-empty__btn">
              Volver al directorio
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const addressLine = [loc?.street, loc?.municipality].filter(Boolean).join(", ") || "—";
  const hoursLine = loc?.todayOpen != null && loc?.todayClose != null
    ? `Lun a Sáb: ${loc.todayOpen} - ${loc.todayClose}`
    : "—";

  const storeName = loc?.name ?? "Tienda";
  const storePhoto = loc?.photoUrl ? toImageProxyUrl(loc.photoUrl) : null;
  const locationLine = [loc?.municipality, loc?.province].filter(Boolean).join(", ") || null;

  return (
    <>
    {/* Mobile-only mini header */}
    <div className="sp-store-mob-header">
      {storePhoto ? (
        <Image src={storePhoto} alt={storeName} width={32} height={32} className="sp-store-mob-header__avatar" />
      ) : (
        <span className="sp-store-mob-header__avatar-placeholder"><Icon name="storefront" /></span>
      )}
      <span className="sp-store-mob-header__name">{storeName}</span>
      <div className="sp-store-mob-header__actions">
        <button type="button" className="sp-store-mob-header__btn" onClick={() => openCart()} aria-label="Carrito">
          <Icon name="shopping_cart" />
        </button>
      </div>
    </div>

    {/* Mobile-only banner + info compact */}
    <div className="sp-store-banner">
      {storePhoto ? (
        <Image src={storePhoto} alt={storeName} width={800} height={450} />
      ) : (
        <div className="sp-store-banner__placeholder"><Icon name="storefront" /></div>
      )}
    </div>
    <div className="sp-store-info-compact">
      <div className="sp-store-info-compact__name-row">
        <h1 className="sp-store-info-compact__name">{storeName}</h1>
        {loc && (
          <StatusBadge
            label={loc.isOpenNow ? "Abierto" : "Cerrado"}
            className="sp-profile__badge"
            active={!!loc.isOpenNow}
            inactiveClassName="sp-profile__badge--closed"
          />
        )}
      </div>
      {locationLine ? (
        <p className="sp-store-info-compact__location">
          <Icon name="location_on" />
          {locationLine}
        </p>
      ) : null}
      <div className="sp-store-info-compact__btns">
        <span className={`sp-store-info-compact__btn ${loc?.isOpenNow ? "sp-store-info-compact__btn--status" : "sp-store-info-compact__btn--status-closed"}`}>
          <Icon name={loc?.isOpenNow ? "check_circle" : "schedule"} />
          {loc?.isOpenNow ? "Disponible" : "Cerrado"}
        </span>
        <button type="button" className="sp-store-info-compact__btn sp-store-info-compact__btn--cart" onClick={() => openCart()}>
          <Icon name="shopping_cart" />
          {cartCount > 0 ? `Pedido (${cartCount})` : "Haz tu pedido"}
        </button>
      </div>
    </div>

    <div className="sp-layout sp-layout--store-catalog">
      <aside className="sp-sidebar sp-sidebar--store-profile">
        <div>
          {loc?.photoUrl ? (() => {
            const proxiedUrl = toImageProxyUrl(loc.photoUrl);
            return proxiedUrl ? (
              <Image src={proxiedUrl} alt={loc.name} className="sp-profile__img" width={320} height={320} />
            ) : (
              <div className="sp-profile__img" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "var(--dir-divider)" }}>
                <Icon name="storefront" />
              </div>
            );
          })() : (
            <div className="sp-profile__img" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "var(--dir-divider)" }}>
              <Icon name="storefront" />
            </div>
          )}
          <div className="sp-profile__name-row">
            <h1 className="sp-profile__name">{loc?.name ?? "Tienda"}</h1>
            {loc && (
              <StatusBadge
                label={loc.isOpenNow ? "Abierto" : "Cerrado"}
                className="sp-profile__badge"
                active={!!loc.isOpenNow}
                inactiveClassName="sp-profile__badge--closed"
              />
            )}
          </div>
          <p className="sp-profile__category">
            {loc?.organizationName || loc?.description || "—"}
          </p>
          <div className="sp-profile__biz-cat">
            <BusinessCategoryPill name={storeBusinessCategoryName} />
          </div>
        </div>

        <button
          type="button"
          className={`sp-wa-btn${cartCount === 0 ? " sp-wa-btn--disabled-hint" : ""}`}
          onClick={() => openCart()}
          aria-label={
            cartCount > 0
              ? "Abrir carrito y enviar pedido por WhatsApp"
              : "Abrir carrito para armar tu pedido"
          }
        >
          <Icon name="shopping_cart" />
          {cartCount > 0 ? `Revisar pedido (${cartCount})` : "Abrir carrito"}
        </button>
        <p className="sp-wa-sidebar-hint">
          {cartCount > 0
            ? "Desde el carrito confirma datos y envía el mensaje con ítems y total a WhatsApp."
            : "Agrega productos al pedido; luego revisa y envía por WhatsApp con el resumen."}
        </p>

        <div className="sp-about">
          <h2 className="sp-about__title">Sobre nosotros</h2>
          <p className="sp-about__text">
            {loc?.description || "Sin descripción."}
          </p>
        </div>

        <div className="sp-divider" />

        <div className="sp-meta">
          <div className="sp-meta__row">
            <Icon name="location_on" />
            <span className="sp-meta__text">{addressLine}</span>
          </div>
          <div className="sp-meta__row">
            <Icon name="schedule" />
            <span className="sp-meta__text">{hoursLine}</span>
          </div>
        </div>

        {products && products.length > 0 ? (
          <div className="sp-sidebar__extras">
            <p className="sp-sidebar__extras-title">Catálogo</p>
            <p className="sp-sidebar__extras-line">
              <strong>{products.length}</strong> producto{products.length === 1 ? "" : "s"} en esta tienda
            </p>
            {loc?.isOpenNow === false ? (
              <p className="sp-sidebar__closed-note" role="status">
                La tienda puede estar cerrada ahora. Puedes armar el pedido y enviarlo cuando abran.
              </p>
            ) : null}
          </div>
        ) : null}
      </aside>

      <main className="sp-main">
        <div className="sp-catalog-header">
          <div className="sp-catalog-title-wrap">
            <h1 className="sp-catalog-title">Catálogo de Productos</h1>
            <p className="sp-catalog-subtitle">
              Explora y arma tu pedido para enviar por WhatsApp
            </p>
          </div>
          <div className="sp-catalog-search-wrap">
            <div className="sp-catalog-search-box">
              <Icon name="search" />
              <input
                type="search"
                className="sp-catalog-search"
                placeholder="Buscar en esta tienda..."
                value={storeSearch}
                onChange={(e) => setStoreSearch(e.target.value)}
                aria-label="Buscar en esta tienda"
              />
            </div>
          </div>
        </div>

        <div className="sp-chips">
          <FilterChip
            label={`Todos (${filteredBySearch.length})`}
            active={!cat}
            onClick={() => setCat(null)}
            className="sp-chip"
            activeClassName="sp-chip--active"
          />
          {categories.map((c) => (
            <FilterChip
              key={c.name}
              label={`${c.name} (${categoryCounts.get(c.name) ?? 0})`}
              active={cat === c.name}
              onClick={() => setCat(c.name)}
              className="sp-chip"
              activeClassName="sp-chip--active"
            />
          ))}
        </div>

        {isLoading && <Skeletons gridClass="sp-grid" />}

        {isError && (
          <div className="store-empty">
            <div className="store-empty__icon"><Icon name="wifi_off" /></div>
            <p className="store-empty__text">{`${errorInfo.title}: ${errorInfo.message}`}</p>
            {errorInfo.retryable ? (
              <button type="button" className="store-empty__btn" onClick={refetch}>
                <Icon name="refresh" /> Reintentar
              </button>
            ) : null}
          </div>
        )}

        {!isLoading && !isError && products && products.length === 0 && (
          <div className="store-empty">
            <div className="store-empty__icon"><Icon name="inventory_2" /></div>
            <p className="store-empty__text">Este local no tiene productos</p>
          </div>
        )}

        {hasProducts && filtered.length === 0 && (
          <div className="store-empty">
            <div className="store-empty__icon"><Icon name="search_off" /></div>
            <p className="store-empty__text">No se encontraron productos con esos filtros</p>
          </div>
        )}

        {hasProducts && filtered.length > 0 && (
          <div className="sp-catalog-grids">
            {favoriteItems.length > 0 ? (
              <section className="sp-catalog-section sp-catalog-section--fav" aria-labelledby="sp-fav-heading">
                <h2 id="sp-fav-heading" className="sp-catalog-section__title">
                  Favoritos
                </h2>
                <div className="sp-grid">
                  {favoriteItems.map((item) => (
                    <StoreProductCard
                      key={item.id}
                      item={item}
                      locationId={locationId}
                      catalogBasePath={catalogBasePath}
                    />
                  ))}
                </div>
              </section>
            ) : null}
            {restItems.length > 0 ? (
              <section
                className="sp-catalog-section"
                aria-labelledby={favoriteItems.length > 0 ? "sp-rest-heading" : undefined}
              >
                {favoriteItems.length > 0 ? (
                  <h2 id="sp-rest-heading" className="sp-catalog-section__title">
                    Productos
                  </h2>
                ) : null}
                <div className="sp-grid">
                  {restItems.map((item) => (
                    <StoreProductCard
                      key={item.id}
                      item={item}
                      locationId={locationId}
                      catalogBasePath={catalogBasePath}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}

        <div className="sp-info-box">
          <Icon name="info" />
          <div>
            <p className="sp-info-box__title">Cómo funciona el pedido</p>
            <p className="sp-info-box__text">
              Al hacer click en &quot;Agregar&quot;, los productos se suman a un borrador. Al finalizar, se abrirá WhatsApp con tu mensaje listo para enviar a la tienda.
            </p>
          </div>
        </div>

        {/* Mobile-only: collapsible sidebar info */}
        <button
          type="button"
          className="sp-store-sidebar-toggle"
          aria-expanded={sidebarOpen}
          onClick={() => setSidebarOpen((v) => !v)}
        >
          Más información
          <Icon name="expand_more" />
        </button>
        {sidebarOpen ? (
          <div className="sp-store-sidebar-body">
            <div className="sp-about">
              <h2 className="sp-about__title">Sobre nosotros</h2>
              <p className="sp-about__text">{loc?.description || "Sin descripción."}</p>
            </div>
            <div className="sp-divider" />
            <div className="sp-meta">
              <div className="sp-meta__row">
                <Icon name="location_on" />
                <span className="sp-meta__text">{addressLine}</span>
              </div>
              <div className="sp-meta__row">
                <Icon name="schedule" />
                <span className="sp-meta__text">{hoursLine}</span>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
    <PushDialog
      open={showPushDialog}
      onClose={() => setShowPushDialog(false)}
      onActivate={() => requestPermissionAndSubscribe(locationId)}
      storeName={loc?.name ?? "esta tienda"}
      storePhotoUrl={loc?.photoUrl}
    />
    </>
  );
}
