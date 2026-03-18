"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { useAppSelector, useAppDispatch } from "@/store/store";
import { addItem, updateQuantity, setLocation } from "@/store/cartSlice";
import {
  useGetPublicCatalogQuery,
  useGetPublicLocationsQuery,
} from "../_service/catalogApi";
import { useFuseSearch } from "@/hooks/useFuseSearch";
import type { PublicCatalogItem } from "@/lib/dashboard-types";

const PRODUCT_FUSE_KEYS = [
  { name: "name" as const, weight: 0.5 },
  { name: "categoryName" as const, weight: 0.25 },
  { name: "description" as const, weight: 0.15 },
  { name: "tags.name" as const, weight: 0.1 },
];

function fmt(v: number) {
  const [int, dec] = v.toFixed(2).split(".");
  return { int, dec, full: `$${v.toFixed(2)}` };
}

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  return `${parseInt(h.substring(0, 2), 16)}, ${parseInt(h.substring(2, 4), 16)}, ${parseInt(h.substring(4, 6), 16)}`;
}

type SortKey = "default" | "price-asc" | "price-desc" | "name-asc" | "name-desc";
type ViewMode = "grid" | "list";

const LOW_STOCK_THRESHOLD = 5;

/* ── Dual-thumb price slider ── */
function PriceRangeSlider({
  min,
  max,
  value,
  onChange,
}: {
  min: number;
  max: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
}) {
  const range = max - min || 1;
  const leftPct = ((value[0] - min) / range) * 100;
  const rightPct = ((value[1] - min) / range) * 100;

  return (
    <>
      <div className="filter-price-display">
        <span>${value[0].toFixed(2)}</span>
        <span>${value[1].toFixed(2)}</span>
      </div>
      <div className="filter-range-wrap">
        <div className="filter-range-track" />
        <div
          className="filter-range-fill"
          style={{ left: `${leftPct}%`, width: `${rightPct - leftPct}%` }}
        />
        <input
          type="range"
          className="filter-range-input"
          min={min}
          max={max}
          step={0.01}
          value={value[0]}
          onChange={(e) => {
            const v = Math.min(Number(e.target.value), value[1] - 0.01);
            onChange([v, value[1]]);
          }}
        />
        <input
          type="range"
          className="filter-range-input"
          min={min}
          max={max}
          step={0.01}
          value={value[1]}
          onChange={(e) => {
            const v = Math.max(Number(e.target.value), value[0] + 0.01);
            onChange([value[0], v]);
          }}
        />
      </div>
    </>
  );
}

/* ── Sidebar filters (reused in desktop & mobile drawer) ── */
function FilterBody({
  categories,
  cat,
  setCat,
  tags,
  selectedTagSlugs,
  setSelectedTagSlugs,
  sort,
  setSort,
  hideOutOfStock,
  setHideOutOfStock,
  priceRange,
  setPriceRange,
  priceExtent,
}: {
  categories: { name: string; color: string; count: number }[];
  cat: string | null;
  setCat: (v: string | null) => void;
  tags: { id: number; name: string; slug: string; color: string; count: number }[];
  selectedTagSlugs: string[];
  setSelectedTagSlugs: (v: string[] | ((prev: string[]) => string[])) => void;
  sort: SortKey;
  setSort: (v: SortKey) => void;
  hideOutOfStock: boolean;
  setHideOutOfStock: (v: boolean) => void;
  priceRange: [number, number];
  setPriceRange: (v: [number, number]) => void;
  priceExtent: [number, number];
}) {
  const [visibleTagCount, setVisibleTagCount] = useState(6);

  const toggleTag = (slug: string) => {
    setSelectedTagSlugs((prev) =>
      prev.includes(slug) ? prev.filter((x) => x !== slug) : [...prev, slug],
    );
  };

  return (
    <>
      {/* Categorías */}
      {categories.length > 0 && (
        <div className="filter-section">
          <div className="filter-title">Categorías</div>
          <div className="filter-cat-list">
            <button
              type="button"
              className={`filter-cat${!cat ? " filter-cat--active" : ""}`}
              onClick={() => setCat(null)}
            >
              Todas
            </button>
            {categories.map((c) => (
              <button
                key={c.name}
                type="button"
                className={`filter-cat${cat === c.name ? " filter-cat--active" : ""}`}
                onClick={() => setCat(cat === c.name ? null : c.name)}
              >
                <span className="filter-cat__dot" style={{ background: c.color }} />
                {c.name}
                <span className="filter-cat__count">{c.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Etiquetas */}
      {tags.length > 0 && (
        <div className="filter-section">
          <div className="filter-title">Etiquetas</div>
          <div className="filter-cat-list">
            <button
              type="button"
              className={`filter-cat${selectedTagSlugs.length === 0 ? " filter-cat--active" : ""}`}
              onClick={() => setSelectedTagSlugs([])}
            >
              Todas
            </button>
            {tags.slice(0, visibleTagCount).map((t) => (
              <button
                key={t.slug}
                type="button"
                className={`filter-cat${selectedTagSlugs.includes(t.slug) ? " filter-cat--active" : ""}`}
                onClick={() => toggleTag(t.slug)}
              >
                <span className="filter-cat__dot" style={{ background: t.color }} />
                {t.name}
                <span className="filter-cat__count">{t.count}</span>
              </button>
            ))}
            {visibleTagCount < tags.length && (
              <button
                type="button"
                className="filter-cat filter-cat--more"
                onClick={() =>
                  setVisibleTagCount((prev) =>
                    Math.min(prev + 6, tags.length),
                  )
                }
              >
                Ver más
              </button>
            )}
          </div>
        </div>
      )}

      {/* Price range */}
      <div className="filter-section">
        <div className="filter-title">Precio</div>
        <PriceRangeSlider
          min={priceExtent[0]}
          max={priceExtent[1]}
          value={priceRange}
          onChange={setPriceRange}
        />
      </div>

      {/* Availability */}
      <div className="filter-section">
        <div className="filter-title">Disponibilidad</div>
        <label className="filter-check">
          <input
            type="checkbox"
            checked={hideOutOfStock}
            onChange={(e) => setHideOutOfStock(e.target.checked)}
          />
          Solo en stock
        </label>
      </div>

      {/* Sort */}
      <div className="filter-section">
        <div className="filter-title">Ordenar por</div>
        <select
          className="filter-select"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
        >
          <option value="default">Relevancia</option>
          <option value="price-asc">Precio: menor a mayor</option>
          <option value="price-desc">Precio: mayor a menor</option>
          <option value="name-asc">Nombre: A-Z</option>
          <option value="name-desc">Nombre: Z-A</option>
        </select>
      </div>
    </>
  );
}

/* ── Skeletons ── */
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

/* ── Quick-view Modal ── */
function QuickView({
  item,
  onClose,
  onAdd,
}: {
  item: PublicCatalogItem;
  onClose: () => void;
  onAdd: () => void;
}) {
  const isElaborado = item.tipo === "elaborado";
  const sold = isElaborado ? false : item.stockAtLocation === 0;
  const low = isElaborado ? false : !sold && item.stockAtLocation <= LOW_STOCK_THRESHOLD;
  const cc = item.categoryColor ?? "#3b82f6";

  return (
    <div className="quickview-overlay" onClick={onClose}>
      <div className="quickview" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="quickview__close" onClick={onClose}>
          <Icon name="close" />
        </button>

        <div className="quickview__img-side">
          {item.imagenUrl ? (
            <img src={item.imagenUrl} alt={item.name} className="quickview__img" />
          ) : (
            <div className="quickview__no-img"><Icon name="inventory_2" /></div>
          )}
        </div>

        <div className="quickview__body">
          {item.categoryName && (
            <span
              className="quickview__cat"
              style={{
                background: `rgba(${hexToRgb(cc)}, 0.1)`,
                color: cc,
                border: `1px solid rgba(${hexToRgb(cc)}, 0.2)`,
              }}
            >
              {item.categoryName}
            </span>
          )}
          <h2 className="quickview__name">{item.name}</h2>
          {item.description && <p className="quickview__desc">{item.description}</p>}
          <div className="quickview__price">{fmt(item.precio).full}</div>

          {sold ? (
            <div className="quickview__stock quickview__stock--out">
              <Icon name="block" /> No disponible
            </div>
          ) : isElaborado ? (
            <div className="quickview__stock quickview__stock--ok">
              <Icon name="check_circle" /> Disponible
            </div>
          ) : low ? (
            <div className="quickview__stock quickview__stock--low">
              <Icon name="warning" /> ¡Solo quedan {item.stockAtLocation} unidades!
            </div>
          ) : (
            <div className="quickview__stock quickview__stock--ok">
              <Icon name="check_circle" /> En stock ({item.stockAtLocation} disponibles)
            </div>
          )}

          {item.code && (
            <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
              SKU: {item.code}
            </div>
          )}

          <div className="quickview__actions">
            <button
              type="button"
              className="quickview__add-btn"
              onClick={() => { onAdd(); onClose(); }}
              disabled={sold}
            >
              <Icon name="add_shopping_cart" />
              {sold ? "Agotado" : "Agregar al carrito"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Store catalog product card (Design Export) ── */
function StoreProductCard({ item, locationId }: { item: PublicCatalogItem; locationId: number }) {
  const dispatch = useAppDispatch();
  const inCart = useAppSelector((s) =>
    s.cart.items.find((i) => i.productId === item.id)
  );
  const isElaborado = item.tipo === "elaborado";
  const sold = isElaborado ? false : item.stockAtLocation === 0;

  const add = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (sold) return;
    dispatch(
      addItem({
        productId: item.id,
        name: item.name,
        unitPrice: item.precio,
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
    <Link href={`/catalog/${locationId}/product/${item.id}`} className={`sp-card${sold ? " sp-card--sold" : ""}`}>
      <div className="sp-card__img-wrap">
        {item.imagenUrl ? (
          <img src={item.imagenUrl} alt={item.name} className="sp-card__img" loading="lazy" />
        ) : (
          <span style={{ fontSize: 48, color: "var(--dir-hint)" }}><Icon name="inventory_2" /></span>
        )}
      </div>
      <div className="sp-card__body">
        <h3 className="sp-card__name">{item.name}</h3>
        <span className="sp-card__price">${item.precio.toFixed(2)}</span>
        {item.description && (
          <p className="sp-card__desc">{item.description}</p>
        )}
        {sold ? (
          <span className="sp-card__add sp-card__add--disabled">No disponible</span>
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
          <button type="button" className="sp-card__add" onClick={add}>
            <Icon name="add" /> Agregar al pedido
          </button>
        )}
      </div>
    </Link>
  );
}

/* ── Page ── */
export default function CatalogProductsPage() {
  const params = useParams();
  const locationId = Number(params.locationId);
  const dispatch = useAppDispatch();
  const [cat, setCat] = useState<string | null>(null);
  const [storeSearch, setStoreSearch] = useState("");

  const { data: products, isLoading, isError, refetch } = useGetPublicCatalogQuery(locationId);
  const { data: locations } = useGetPublicLocationsQuery();
  const loc = locations?.find((l) => l.id === locationId);

  useEffect(() => {
    if (loc) {
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
    }
  }, [loc?.id, loc?.isOpenNow, loc?.todayOpen, loc?.todayClose, dispatch]);

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

  const filtered = useMemo(() => {
    if (!cat) return filteredBySearch;
    return filteredBySearch.filter((p) => p.categoryName === cat);
  }, [filteredBySearch, cat]);

  const hasProducts = !isLoading && !isError && products && products.length > 0;

  const waNumber = loc?.whatsAppContact?.replace(/\D/g, "") ?? "";
  const waHref = waNumber ? `https://wa.me/${waNumber}` : "#";
  const addressLine = [loc?.street, loc?.municipality].filter(Boolean).join(", ") || "—";
  const hoursLine = loc?.todayOpen != null && loc?.todayClose != null
    ? `Lun a Sáb: ${loc.todayOpen} - ${loc.todayClose}`
    : "—";

  return (
    <div className="sp-layout">
      <aside className="sp-sidebar">
        <div>
          {loc?.photoUrl ? (
            <img src={loc.photoUrl} alt={loc.name} className="sp-profile__img" />
          ) : (
            <div className="sp-profile__img" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "var(--dir-divider)" }}>
              <Icon name="storefront" />
            </div>
          )}
          <div className="sp-profile__name-row">
            <h1 className="sp-profile__name">{loc?.name ?? "Tienda"}</h1>
            {loc && (
              <span className={`sp-profile__badge${loc.isOpenNow ? "" : " sp-profile__badge--closed"}`}>
                {loc.isOpenNow ? "Abierto" : "Cerrado"}
              </span>
            )}
          </div>
          <p className="sp-profile__category">
            {loc?.organizationName || loc?.description || "—"}
          </p>
        </div>

        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="sp-wa-btn"
          aria-label="Pedir por WhatsApp"
        >
          <Icon name="chat" />
          Pedir por WhatsApp
        </a>

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
          <div className="sp-meta__row">
            <Icon name="star" />
            <span className="sp-meta__text">—</span>
          </div>
        </div>
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
          <button
            type="button"
            className={`sp-chip${!cat ? " sp-chip--active" : ""}`}
            onClick={() => setCat(null)}
          >
            Todos
          </button>
          {categories.map((c) => (
            <button
              key={c.name}
              type="button"
              className={`sp-chip${cat === c.name ? " sp-chip--active" : ""}`}
              onClick={() => setCat(c.name)}
            >
              {c.name}
            </button>
          ))}
        </div>

        {isLoading && <Skeletons gridClass="sp-grid" />}

        {isError && (
          <div className="store-empty">
            <div className="store-empty__icon"><Icon name="wifi_off" /></div>
            <p className="store-empty__text">No pudimos cargar el catálogo.</p>
            <button type="button" className="store-empty__btn" onClick={refetch}>
              <Icon name="refresh" /> Reintentar
            </button>
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
          <div className="sp-grid">
            {filtered.map((item) => (
              <StoreProductCard key={item.id} item={item} locationId={locationId} />
            ))}
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
      </main>
    </div>
  );
}
