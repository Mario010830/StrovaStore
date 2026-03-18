"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useCatalogCtx } from "./layout";
import { useGetAllPublicProductsQuery, useGetPublicTagsQuery } from "./_service/catalogApi";
import { useFuseSearch } from "@/hooks/useFuseSearch";
import type { PublicCatalogItem } from "@/lib/dashboard-types";

const STROVA_BUSINESS_URL = "https://strova.com";

const MP_CHIP_ICONS: Record<string, string> = {
  todos: "apps",
  alimentación: "restaurant",
  ferretería: "build",
  librería: "menu_book",
  hogar: "home",
  electrónica: "devices",
  deporte: "fitness_center",
};

const PRODUCT_FUSE_KEYS = [
  { name: "name" as const, weight: 0.5 },
  { name: "categoryName" as const, weight: 0.25 },
  { name: "description" as const, weight: 0.15 },
  { name: "tags.name" as const, weight: 0.1 },
];

type SortKey = "default" | "price-asc" | "price-desc" | "name-asc" | "name-desc";

const PAGE_SIZE = 50;

function fmtPrice(v: number) {
  return `$${v.toFixed(2)}`;
}

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
        <span>{fmtPrice(value[0])}</span>
        <span>{fmtPrice(value[1])}</span>
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

function FilterSidebar({
  categories,
  selectedCategory,
  setSelectedCategory,
  tags,
  selectedTagSlugs,
  setSelectedTagSlugs,
  priceRange,
  setPriceRange,
  priceExtent,
  onlyInStock,
  setOnlyInStock,
  sortKey,
  setSortKey,
}: {
  categories: { name: string; color: string; count: number }[];
  selectedCategory: string | null;
  setSelectedCategory: (v: string | null) => void;
  tags: { id: number; name: string; slug: string; color: string; count: number }[];
  selectedTagSlugs: string[];
  setSelectedTagSlugs: (v: string[] | ((prev: string[]) => string[])) => void;
  priceRange: [number, number];
  setPriceRange: (v: [number, number]) => void;
  priceExtent: [number, number];
  onlyInStock: boolean;
  setOnlyInStock: (v: boolean) => void;
  sortKey: SortKey;
  setSortKey: (v: SortKey) => void;
}) {
  const [visibleTagCount, setVisibleTagCount] = useState(6);

  const toggleTag = (slug: string) => {
    setSelectedTagSlugs((prev) =>
      prev.includes(slug) ? prev.filter((x) => x !== slug) : [...prev, slug],
    );
  };

  return (
    <aside className="allprod-sidebar">
      {categories.length > 0 && (
        <section className="filter-section">
          <div className="filter-title">Categorías</div>
          <div className="filter-cat-list">
            <button
              type="button"
              className={`filter-cat${!selectedCategory ? " filter-cat--active" : ""}`}
              onClick={() => setSelectedCategory(null)}
            >
              <span className="filter-cat__dot" />
              Todas
            </button>
            {categories.map((c) => (
              <button
                key={c.name}
                type="button"
                className={`filter-cat${selectedCategory === c.name ? " filter-cat--active" : ""}`}
                onClick={() => setSelectedCategory(selectedCategory === c.name ? null : c.name)}
              >
                <span className="filter-cat__dot" style={{ background: c.color }} />
                {c.name}
                <span className="filter-cat__count">({c.count})</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {tags.length > 0 && (
        <section className="filter-section">
          <div className="filter-title">Etiquetas</div>
          <div className="filter-cat-list">
            <button
              type="button"
              className={`filter-cat${selectedTagSlugs.length === 0 ? " filter-cat--active" : ""}`}
              onClick={() => setSelectedTagSlugs([])}
            >
              <span className="filter-cat__dot" />
              Todas
            </button>
            {tags.slice(0, visibleTagCount).map((t) => (
              <button
                key={t.slug}
                type="button"
                className={`filter-cat${selectedTagSlugs.includes(t.slug) ? " filter-cat--active" : ""}`}
                onClick={() => toggleTag(t.slug)}
              >
                <span
                  className="filter-cat__dot"
                  style={{ background: t.color }}
                />
                {t.name}
                <span className="filter-cat__count">({t.count})</span>
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
        </section>
      )}

      <section className="filter-section">
        <div className="filter-title">Precio</div>
        <PriceRangeSlider
          min={priceExtent[0]}
          max={priceExtent[1]}
          value={priceRange}
          onChange={setPriceRange}
        />
      </section>

      <section className="filter-section">
        <div className="filter-title">Disponibilidad</div>
        <label className="filter-check">
          <input
            type="checkbox"
            checked={onlyInStock}
            onChange={(e) => setOnlyInStock(e.target.checked)}
          />
          Solo en stock
        </label>
      </section>

      <section className="filter-section">
        <div className="filter-title">Ordenar por</div>
        <select
          className="filter-select"
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
        >
          <option value="default">Relevancia</option>
          <option value="price-asc">Precio: menor a mayor</option>
          <option value="price-desc">Precio: mayor a menor</option>
          <option value="name-asc">Nombre: A-Z</option>
          <option value="name-desc">Nombre: Z-A</option>
        </select>
      </section>
    </aside>
  );
}

function SkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="allprod-grid">
      {Array.from({ length: count }).map((_, i) => (
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

function ProductCard({
  item,
  onGoToStore,
}: {
  item: PublicCatalogItem;
  onGoToStore: () => void;
}) {
  const cc = item.categoryColor ?? "#3b82f6";

  return (
    <div className="p-card">
      <div className="p-card__img-area" onClick={onGoToStore}>
        {item.imagenUrl ? (
          <img
            src={item.imagenUrl}
            alt={item.name}
            className="p-card__img"
            loading="lazy"
          />
        ) : (
          <div className="p-card__no-img">
            <Icon name="inventory_2" />
          </div>
        )}
        <div className="p-card__img-top">
          {item.categoryName && (
            <div className="p-card__cat-chip">
              <span
                className="p-card__cat-dot"
                style={{ backgroundColor: cc }}
              />
              <span className="p-card__cat-label">{item.categoryName}</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-card__info">
        <div className="p-card__name" onClick={onGoToStore}>
          {item.name}
        </div>
        {item.description && (
          <p className="p-card__desc">{item.description}</p>
        )}
        {item.locationName && item.locationId != null && (
          <button
            type="button"
            className="p-card__location"
            onClick={onGoToStore}
          >
            <Icon name="location_on" />
            <span>{item.locationName}</span>
          </button>
        )}
        <div className="p-card__price-row">
          <span className="p-card__price">{fmtPrice(item.precio)}</span>
        </div>
        <button
          type="button"
          className="p-card__add"
          onClick={onGoToStore}
        >
          <Icon name="add_shopping_cart" />
          <span>Ver en tienda</span>
        </button>
      </div>
    </div>
  );
}

function MarketplaceProductCard({
  item,
  onPedir,
}: {
  item: PublicCatalogItem;
  onPedir: () => void;
}) {
  return (
    <div
      className="mp-card"
      onClick={onPedir}
      onKeyDown={(e) => e.key === "Enter" && onPedir()}
      role="button"
      tabIndex={0}
    >
      <div className="mp-card__img-wrap">
        {item.imagenUrl ? (
          <img src={item.imagenUrl} alt={item.name} loading="lazy" />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #eef1f5 0%, #e2e8f0 100%)" }}>
            <Icon name="inventory_2" />
          </div>
        )}
        {item.categoryName && (
          <span className="mp-card__cat-tag">{item.categoryName}</span>
        )}
      </div>
      <div className="mp-card__body">
        <h3 className="mp-card__name">{item.name}</h3>
        {item.locationName && (
          <span className="mp-card__store">
            <Icon name="store" />
            {item.locationName}
          </span>
        )}
        <div className="mp-card__footer">
          <span className="mp-card__price">{fmtPrice(item.precio)}</span>
          <button
            type="button"
            className="mp-card__pedir"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPedir();
            }}
          >
            <Icon name="chat" />
            Pedir
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AllProductsView() {
  const router = useRouter();
  const { search, setSearch } = useCatalogCtx();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTagSlugs, setSelectedTagSlugs] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<PublicCatalogItem[]>([]);
  const [mobileFilters, setMobileFilters] = useState(false);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetAllPublicProductsQuery({ page, pageSize: PAGE_SIZE });
  const { data: publicTagsRaw } = useGetPublicTagsQuery();
  const publicTags = publicTagsRaw ?? [];
  const lastTagsRef = useRef<typeof publicTags>([]);
  if (publicTags.length > 0) lastTagsRef.current = publicTags;
  const tagsStable = publicTags.length > 0 ? publicTags : lastTagsRef.current;

  const pagination = data?.pagination;

  // Reset página cuando cambian filtros principales
  useEffect(() => {
    setPage(1);
  }, [search, selectedCategory, selectedTagSlugs, priceRange, onlyInStock, sortKey]);

  // Sincronizar items con la respuesta del backend cuando cambia page
  useEffect(() => {
    if (!data) return;
    if (page === 1) {
      setItems(data.data);
    } else {
      setItems((prev) => [...prev, ...data.data]);
    }
  }, [data, page]);

  // Inicializar rango de precios
  useEffect(() => {
    if (!items.length) return;
    let mn = Infinity;
    let mx = -Infinity;
    for (const p of items) {
      if (p.precio < mn) mn = p.precio;
      if (p.precio > mx) mx = p.precio;
    }
    if (!Number.isFinite(mn) || !Number.isFinite(mx)) return;
    setPriceRange([Math.floor(mn), Math.ceil(mx)]);
  }, [items.length]);

  const filteredBySearch = useFuseSearch(items, PRODUCT_FUSE_KEYS, search);

  const priceExtent: [number, number] = useMemo(() => {
    if (!items.length) return [0, 100];
    let mn = Infinity;
    let mx = -Infinity;
    for (const p of items) {
      if (p.precio < mn) mn = p.precio;
      if (p.precio > mx) mx = p.precio;
    }
    if (!Number.isFinite(mn) || !Number.isFinite(mx)) return [0, 100];
    return [Math.floor(mn), Math.ceil(mx)];
  }, [items]);

  const categories = useMemo(() => {
    const m = new Map<string, { name: string; color: string; count: number }>();
    for (const p of filteredBySearch) {
      if (!p.categoryName) continue;
      const existing = m.get(p.categoryName);
      if (existing) existing.count++;
      else m.set(p.categoryName, { name: p.categoryName, color: p.categoryColor ?? "#3b82f6", count: 1 });
    }
    return Array.from(m.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredBySearch]);

  const tagsWithCount = useMemo(() => {
    const countBySlug = new Map<string, number>();
    for (const p of filteredBySearch) {
      const slugs = (p.tagIds ?? []).map((id) => tagsStable.find((t) => t.id === id)?.slug).filter(Boolean) as string[];
      for (const slug of slugs) {
        countBySlug.set(slug, (countBySlug.get(slug) ?? 0) + 1);
      }
    }
    return tagsStable
      .filter((t) => (countBySlug.get(t.slug) ?? 0) > 0)
      .map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        color: t.color ?? "#3b82f6",
        count: countBySlug.get(t.slug) ?? 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredBySearch, tagsStable]);

  const filtered = useMemo(() => {
    let list = [...filteredBySearch];
    if (selectedCategory) {
      list = list.filter((p) => p.categoryName === selectedCategory);
    }
    if (selectedTagSlugs.length > 0) {
      list = list.filter((p) => {
        const productSlugs = (p.tagIds ?? [])
          .map((id) => tagsStable.find((t) => t.id === id)?.slug)
          .filter(Boolean) as string[];
        return productSlugs.some((s) => selectedTagSlugs.includes(s));
      });
    }
    list = list.filter(
      (p) => p.precio >= priceRange[0] && p.precio <= priceRange[1],
    );
    if (onlyInStock) {
      list = list.filter(
        (p) => p.tipo === "elaborado" || p.stockAtLocation > 0,
      );
    }
    switch (sortKey) {
      case "price-asc":
        list.sort((a, b) => a.precio - b.precio);
        break;
      case "price-desc":
        list.sort((a, b) => b.precio - a.precio);
        break;
      case "name-asc":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        list.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }
    return list;
  }, [
    filteredBySearch,
    selectedCategory,
    selectedTagSlugs,
    priceRange,
    onlyInStock,
    sortKey,
    tagsStable,
  ]);

  const totalProducts = filtered.length;
  const totalLocations =
    new Set(filtered.map((p) => p.locationId).filter((v) => v != null)).size ||
    0;


  const hasMore =
    !!pagination && page < pagination.totalPages && !isLoading && !isError;

  const loadMore = () => {
    if (hasMore && !isFetching) {
      setPage((p) => p + 1);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setSelectedCategory(null);
    setSelectedTagSlugs([]);
    setOnlyInStock(false);
    setSortKey("default");
    setPriceRange(priceExtent);
  };

  const goToStore = useCallback(
    (locationId: number | null) => {
      if (locationId == null) return;
      router.push(`/catalog/${locationId}`);
    },
    [router],
  );

  const loadingFirstPage = isLoading && page === 1;
  const loadingMore = isFetching && page > 1;

  if (isError) {
    return (
      <div className="store-empty">
        <div className="store-empty__icon">
          <Icon name="wifi_off" />
        </div>
        <p className="store-empty__text">
          No pudimos cargar los productos.
        </p>
        <button
          type="button"
          className="store-empty__btn"
          onClick={() => refetch()}
        >
          <Icon name="refresh" /> Reintentar
        </button>
      </div>
    );
  }

  if (!loadingFirstPage && !filtered.length && !items.length) {
    return (
      <div className="store-empty">
        <div className="store-empty__icon">
          <Icon name="inventory_2" />
        </div>
        <p className="store-empty__text">No hay productos disponibles</p>
      </div>
    );
  }

  const hasFilterResults = filtered.length > 0;

  return (
    <div className="mp-page">
      <section className="mp-hero">
        <div className="mp-hero__text">
          <h1 className="mp-hero__title">Marketplace de Productos</h1>
          <p className="mp-hero__subtitle">
            Explorá lo que ofrecen los negocios de tu ciudad
          </p>
        </div>
        <div className="mp-hero__search-wrap">
          <div className="mp-hero__search-box">
            <Icon name="search" />
            <input
              type="text"
              className="mp-hero__search"
              placeholder="Buscá herramientas, café, libros..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="mp-chips">
        <button
          type="button"
          className={`mp-chip ${selectedTagSlugs.length === 0 ? "mp-chip--active" : ""}`}
          onClick={() => setSelectedTagSlugs([])}
        >
          <Icon name="apps" />
          Todos
        </button>
        {tagsWithCount.map((t) => (
          <button
            key={t.slug}
            type="button"
            className={`mp-chip ${selectedTagSlugs.includes(t.slug) ? "mp-chip--active" : ""}`}
            onClick={() =>
              setSelectedTagSlugs((prev) =>
                prev.includes(t.slug)
                  ? prev.filter((x) => x !== t.slug)
                  : [...prev, t.slug],
              )
            }
          >
            <Icon name={MP_CHIP_ICONS[t.name.toLowerCase()] ?? "label"} />
            {t.name}
          </button>
        ))}
      </div>

      <div className="mp-stats">
        <div className="mp-stats__inner">
          <div className="mp-stats__item">
            <span className="mp-stats__value mp-stats__value--primary">
              {totalProducts.toLocaleString()}+
            </span>
            <span className="mp-stats__label">Productos disponibles</span>
          </div>
          <div className="mp-stats__divider" />
          <div className="mp-stats__item">
            <span className="mp-stats__value mp-stats__value--secondary">Directo</span>
            <span className="mp-stats__label">Sin comisiones</span>
          </div>
          <div className="mp-stats__divider" />
          <div className="mp-stats__item">
            <span className="mp-stats__value mp-stats__value--secondary">WhatsApp</span>
            <span className="mp-stats__label">Acordá el envío</span>
          </div>
        </div>
      </div>

      {!hasFilterResults && items.length > 0 && (
        <div className="store-empty store-empty--compact">
          <div className="store-empty__icon">
            <Icon name="search_off" />
          </div>
          <p className="store-empty__text">
            No se encontraron productos con esos filtros.
          </p>
          <button type="button" className="store-empty__btn" onClick={resetFilters}>
            Limpiar filtros
          </button>
        </div>
      )}

      {loadingFirstPage ? (
        <div className="mp-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="mp-card" style={{ opacity: 0.6 }}>
              <div className="mp-card__img-wrap" />
              <div className="mp-card__body">
                <div style={{ height: 20, background: "#e2e8f0", borderRadius: 4 }} />
                <div style={{ height: 14, background: "#e2e8f0", borderRadius: 4, width: "60%" }} />
                <div className="mp-card__footer" style={{ marginTop: 12 }}>
                  <div style={{ height: 24, width: 60, background: "#e2e8f0", borderRadius: 4 }} />
                  <div style={{ height: 40, width: 80, background: "#e2e8f0", borderRadius: 12 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mp-grid">
          {filtered.map((item) => (
            <MarketplaceProductCard
              key={`${item.id}-${item.locationId ?? "x"}`}
              item={item}
              onPedir={() => goToStore(item.locationId)}
            />
          ))}
        </div>
      )}

      {hasMore && !loadingFirstPage && !loadingMore && (
        <div className="mp-more">
          <button
            type="button"
            className="mp-more__btn"
            onClick={loadMore}
            disabled={loadingMore}
          >
            Ver más productos
          </button>
        </div>
      )}

      <section className="mp-cta">
        <div className="mp-cta__bg-icon" aria-hidden>
          <Icon name="storefront" />
        </div>
        <div className="mp-cta__inner">
          <div className="mp-cta__content">
            <h2 className="mp-cta__title">¿Tenés un negocio local?</h2>
            <p className="mp-cta__text">
              Sumate a StrovaStore y empezá a recibir pedidos por WhatsApp hoy mismo. Tu catálogo online listo en minutos.
            </p>
            <div className="mp-cta__btns">
              <a
                href={STROVA_BUSINESS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mp-cta__btn-primary"
              >
                Registrar mi negocio
              </a>
              <a
                href={STROVA_BUSINESS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mp-cta__btn-outline"
              >
                Saber más
              </a>
            </div>
          </div>
          <div className="mp-cta__icon" aria-hidden>
            <Icon name="rocket_launch" />
          </div>
        </div>
      </section>

      <footer className="mp-footer">
        <div className="mp-footer__inner">
          <div className="mp-footer__left">
            <Link href="/" className="mp-footer__brand">
              <span className="store-nav__logo-box" style={{ width: 24, height: 24 }}>
                <Icon name="storefront" />
              </span>
              StrovaStore
            </Link>
            <p className="mp-footer__copy">
              © 2024 Powered by Strova. Todos los derechos reservados.
            </p>
          </div>
          <div className="mp-footer__right">
            <div className="mp-footer__links">
              <a href="#">Privacidad</a>
              <a href="#">Términos</a>
              <a href="#">Ayuda</a>
            </div>
            <div className="mp-footer__social">
              <a href="#" aria-label="Instagram">
                <Icon name="instagram" />
              </a>
              <a href="#" aria-label="Facebook">
                <Icon name="facebook" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}