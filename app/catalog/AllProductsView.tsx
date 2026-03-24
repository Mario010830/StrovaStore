"use client";

import { useMemo, useState, useEffect, useCallback, useRef, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import { useCatalogCtx } from "./layout";
import {
  QUERY_POLLING_OPTIONS,
  useGetAllPublicProductsQuery,
  useGetPublicTagsQuery,
} from "./_service/catalogApi";
import { useFuseSearch } from "@/hooks/useFuseSearch";
import type { PublicCatalogItem } from "@/lib/dashboard-types";
import { getBusinessUrl } from "@/lib/runtime-config";
import { toImageProxyUrl } from "@/lib/image";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChip } from "@/components/ui/FilterChip";
import { PriceText } from "@/components/ui/PriceText";
import { IconActionButton } from "@/components/ui/IconActionButton";
import { getRtkErrorInfo } from "@/lib/rtk-error";
import { getProductCardSubtitle, categoryDotColor } from "@/lib/catalog-display";
import type { Tag } from "@/lib/dashboard-types";
import { CardFavoriteButton } from "@/components/ui/CardFavoriteButton";
import { useFavoriteProduct } from "@/hooks/useFavorites";
import {
  getFavoriteProductKeysSortKey,
  productFavoriteKey,
  subscribeFavorites,
} from "@/lib/favorites";
import { buildLocationCatalogPath } from "@/lib/location-path";

const STROVA_BUSINESS_URL = getBusinessUrl();

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
  { name: "name" as const, weight: 0.45 },
  { name: "description" as const, weight: 0.2 },
  { name: "tags.name" as const, weight: 0.35 },
];

function shuffleCopy<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function tagLabelsForProduct(item: PublicCatalogItem, tagsStable: Tag[]): string[] {
  if (item.tags?.length) {
    return item.tags.map((t) => t.name).filter(Boolean);
  }
  const ids = item.tagIds ?? [];
  return ids
    .map((id) => tagsStable.find((t) => t.id === id)?.name)
    .filter((n): n is string => Boolean(n));
}

const PAGE_SIZE = 50;

type MarketplaceSortKey = "random" | "price-asc" | "price-desc" | "name-asc" | "name-desc";

function sortProductList(
  list: PublicCatalogItem[],
  sortKey: MarketplaceSortKey,
  randomReady: boolean,
): PublicCatalogItem[] {
  const copy = [...list];
  switch (sortKey) {
    case "random":
      return randomReady ? shuffleCopy(copy) : copy;
    case "price-asc":
      return copy.sort((a, b) => a.precio - b.precio);
    case "price-desc":
      return copy.sort((a, b) => b.precio - a.precio);
    case "name-asc":
      return copy.sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));
    case "name-desc":
      return copy.sort((a, b) => b.name.localeCompare(a.name, "es", { sensitivity: "base" }));
    default:
      return copy;
  }
}

function MpCardFavorite({ locationId, productId }: { locationId: number; productId: number }) {
  const { isFavorite, toggle } = useFavoriteProduct(locationId, productId);
  return (
    <CardFavoriteButton
      isFavorite={isFavorite}
      onToggle={toggle}
      labelOn="Quitar producto de favoritos"
      labelOff="Guardar producto en favoritos"
      className="mp-card__fav"
    />
  );
}

function MarketplaceProductCard({
  item,
  tagLabels,
  onPedir,
}: {
  item: PublicCatalogItem;
  tagLabels: string[];
  onPedir: () => void;
}) {
  const proxiedImageUrl = toImageProxyUrl(item.imagenUrl);
  const soldOut = item.tipo === "inventariable" && item.stockAtLocation <= 0;
  const subtitle = getProductCardSubtitle(item);
  const lid = item.locationId;

  const handleActivate = () => {
    if (!soldOut) onPedir();
  };

  return (
    <div
      className={`mp-card${soldOut ? " mp-card--sold-out" : ""}`}
      onClick={handleActivate}
      onKeyDown={(e) => e.key === "Enter" && handleActivate()}
      role="button"
      tabIndex={soldOut ? -1 : 0}
      aria-disabled={soldOut}
    >
      <div className="mp-card__img-wrap">
        {proxiedImageUrl ? (
          <Image src={proxiedImageUrl} alt={item.name} width={480} height={320} />
        ) : (
          <div className="mp-card__img-placeholder">
            <Icon name="inventory_2" />
          </div>
        )}
        {tagLabels.length > 0 ? (
          <div className="mp-card__tags-row" aria-label="Etiquetas">
            {tagLabels.slice(0, 3).map((label, idx) => (
              <span key={`${label}-${idx}`} className="mp-card__tag-pill">
                <span
                  className="mp-card__tag-dot"
                  style={{ background: categoryDotColor(label) }}
                  aria-hidden
                />
                {label}
              </span>
            ))}
          </div>
        ) : null}
        {lid != null ? <MpCardFavorite locationId={lid} productId={item.id} /> : null}
      </div>
      <div className="mp-card__body">
        {item.locationName ? (
          <p className="mp-card__store-name" title={item.locationName}>
            <Icon name="store" />
            {item.locationName}
          </p>
        ) : null}
        <h3 className="mp-card__name" title={item.name}>
          {item.name}
        </h3>
        <PriceText value={item.precio} className="mp-card__price" />
        {!soldOut ? (
          <p className="mp-card__stock-ok" role="status">
            En stock
          </p>
        ) : null}
        {subtitle ? <p className="mp-card__desc">{subtitle}</p> : null}
        <IconActionButton
          label={soldOut ? "Sin stock" : "Ver en la tienda"}
          className="mp-card__cta mp-card__cta--outline"
          disabled={soldOut}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!soldOut) onPedir();
          }}
          icon={<Icon name="store" />}
        />
      </div>
    </div>
  );
}

export default function AllProductsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { search, setSearch } = useCatalogCtx();
  const initializedQueryFromUrlRef = useRef(false);
  const initialQueryFromUrl = searchParams.get("q")?.trim() ?? "";
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<MarketplaceSortKey>("random");
  const [selectedTagSlugs, setSelectedTagSlugs] = useState<string[]>(() => {
    const rawTagParams = searchParams.getAll("tag");
    return rawTagParams
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
      .filter((slug, index, arr) => arr.indexOf(slug) === index);
  });
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [page, setPage] = useState(1);
  const [randomReady, setRandomReady] = useState(false);
  const [priceReady, setPriceReady] = useState(false);
  const [items, setItems] = useState<PublicCatalogItem[]>([]);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetAllPublicProductsQuery(
    { page, pageSize: PAGE_SIZE },
    QUERY_POLLING_OPTIONS.general,
  );
  const { data: publicTagsRaw } = useGetPublicTagsQuery(undefined, QUERY_POLLING_OPTIONS.general);
  const tagsStable = useMemo(() => publicTagsRaw ?? [], [publicTagsRaw]);

  useEffect(() => {
    if (initializedQueryFromUrlRef.current) return;
    initializedQueryFromUrlRef.current = true;
    if (!initialQueryFromUrl) return;
    setSearch(initialQueryFromUrl);
  }, [initialQueryFromUrl, setSearch]);

  const pagination = data?.pagination;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [search, selectedTagSlugs, selectedCategory, priceRange, onlyInStock, sortKey]);

  useEffect(() => {
    setRandomReady(true);
  }, []);

  useEffect(() => {
    if (!data) return;
    if (page === 1) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems(data.data);
    } else {
      setItems((prev) => [...prev, ...data.data]);
    }
  }, [data, page]);

  useEffect(() => {
    if (!items.length || priceReady) return;
    let mn = Infinity;
    let mx = -Infinity;
    for (const p of items) {
      if (p.precio < mn) mn = p.precio;
      if (p.precio > mx) mx = p.precio;
    }
    if (!Number.isFinite(mn) || !Number.isFinite(mx)) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPriceRange([Math.floor(mn), Math.ceil(mx)]);
    setPriceReady(true);
  }, [items, priceReady]);

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

  const productsForTagCounts = useMemo(() => {
    if (!selectedCategory) return filteredBySearch;
    return filteredBySearch.filter((p) => p.categoryName === selectedCategory);
  }, [filteredBySearch, selectedCategory]);

  const categoriesWithCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of filteredBySearch) {
      if (!p.categoryName?.trim()) continue;
      m.set(p.categoryName, (m.get(p.categoryName) ?? 0) + 1);
    }
    return Array.from(m.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));
  }, [filteredBySearch]);

  const tagsWithCount = useMemo(() => {
    const countBySlug = new Map<string, number>();
    for (const p of productsForTagCounts) {
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
  }, [productsForTagCounts, tagsStable]);

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
    if (priceReady) {
      list = list.filter(
        (p) => p.precio >= priceRange[0] && p.precio <= priceRange[1],
      );
    }
    if (onlyInStock) {
      list = list.filter(
        (p) => p.tipo === "elaborado" || p.stockAtLocation > 0,
      );
    }
    return list;
  }, [filteredBySearch, selectedCategory, selectedTagSlugs, priceRange, priceReady, onlyInStock, tagsStable]);

  const favKeysSort = useSyncExternalStore(
    subscribeFavorites,
    () => getFavoriteProductKeysSortKey(),
    () => "",
  );

  const { favoriteItems, restItems } = useMemo(() => {
    const keys = favKeysSort ? favKeysSort.split(",").filter(Boolean) : [];
    const favSet = new Set(keys);
    const fav: PublicCatalogItem[] = [];
    const rest: PublicCatalogItem[] = [];
    for (const p of filtered) {
      const loc = p.locationId;
      if (loc != null && favSet.has(productFavoriteKey(loc, p.id))) {
        fav.push(p);
      } else {
        rest.push(p);
      }
    }
    return {
      favoriteItems: sortProductList(fav, sortKey, randomReady),
      restItems: sortProductList(rest, sortKey, randomReady),
    };
  }, [filtered, favKeysSort, sortKey, randomReady]);

  const totalProducts = filtered.length;
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
    setSortKey("random");
    setPriceRange(priceExtent);
    setPriceReady(true);
  };

  const clampPrice = useCallback(
    (n: number) =>
      Math.min(Math.max(n, priceExtent[0]), priceExtent[1]),
    [priceExtent],
  );

  const onPriceMinInput = (raw: string) => {
    const v = Number(raw);
    if (!Number.isFinite(v)) return;
    const nextMin = clampPrice(v);
    const nextMax = Math.max(nextMin, priceRange[1]);
    setPriceRange([nextMin, nextMax]);
  };

  const onPriceMaxInput = (raw: string) => {
    const v = Number(raw);
    if (!Number.isFinite(v)) return;
    const nextMax = clampPrice(v);
    const nextMin = Math.min(priceRange[0], nextMax);
    setPriceRange([nextMin, nextMax]);
  };

  const goToStore = useCallback(
    (locationId: number | null, locationName: string | null) => {
      if (locationId == null) return;
      router.push(
        buildLocationCatalogPath({
          id: locationId,
          name: locationName?.trim() || `Tienda ${locationId}`,
        }),
      );
    },
    [router],
  );

  const loadingFirstPage = isLoading && page === 1;
  const loadingMore = isFetching && page > 1;
  const errorInfo = getRtkErrorInfo(error);

  if (isError) {
    return (
      <EmptyState
        icon={<Icon name="wifi_off" />}
        message={`${errorInfo.title}: ${errorInfo.message}`}
        action={
          errorInfo.retryable ? (
            <button
              type="button"
              className="store-empty__btn"
              onClick={() => refetch()}
            >
              <Icon name="refresh" /> Reintentar
            </button>
          ) : null
        }
      />
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
      <section className="mp-hero mp-hero--centered">
        <div className="mp-hero__text">
          <h1 className="mp-hero__title">Marketplace de Productos</h1>
          <p className="mp-hero__subtitle">
            Explora lo que ofrecen los negocios de tu ciudad
          </p>
        </div>
        <div className="mp-hero__search-wrap">
          <div className="mp-hero__search-box">
            <Icon name="search" />
            <input
              type="search"
              className="mp-hero__search"
              placeholder="Busca herramientas, café, libros…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar en el catálogo"
            />
          </div>
        </div>
      </section>

      <div className="mp-filter-block">
        <p className="mp-filter-block__label" id="mp-cat-label">
          Categoría
        </p>
        <div
          className="mp-chips mp-chips--categories"
          role="group"
          aria-labelledby="mp-cat-label"
        >
          <FilterChip
            label={`Todas (${filteredBySearch.length})`}
            iconName="apps"
            active={selectedCategory === null}
            onClick={() => setSelectedCategory(null)}
            className="mp-chip"
            activeClassName="mp-chip--active"
          />
          {categoriesWithCount.map((c) => (
            <FilterChip
              key={c.name}
              label={`${c.name} (${c.count})`}
              iconName={
                MP_CHIP_ICONS[c.name.toLowerCase()] ?? "category"
              }
              active={selectedCategory === c.name}
              onClick={() =>
                setSelectedCategory((prev) =>
                  prev === c.name ? null : c.name,
                )
              }
              className="mp-chip"
              activeClassName="mp-chip--active"
            />
          ))}
        </div>
      </div>

      <div className="mp-filter-block">
        <p className="mp-filter-block__label" id="mp-tag-label">
          Etiquetas
        </p>
        <div
          className="mp-chips"
          role="group"
          aria-labelledby="mp-tag-label"
        >
          <FilterChip
            label={`Todas (${productsForTagCounts.length})`}
            iconName="label"
            active={selectedTagSlugs.length === 0}
            onClick={() => setSelectedTagSlugs([])}
            className="mp-chip"
            activeClassName="mp-chip--active"
          />
          {tagsWithCount.map((t) => (
            <FilterChip
              key={t.slug}
              label={`${t.name} (${t.count})`}
              iconName={MP_CHIP_ICONS[t.name.toLowerCase()] ?? "label"}
              active={selectedTagSlugs.includes(t.slug)}
              onClick={() =>
                setSelectedTagSlugs((prev) =>
                  prev.includes(t.slug)
                    ? prev.filter((x) => x !== t.slug)
                    : [...prev, t.slug],
                )
              }
              className="mp-chip"
              activeClassName="mp-chip--active"
            />
          ))}
        </div>
      </div>

      <div className="mp-toolbar" role="region" aria-label="Filtros y orden">
        <div className="mp-toolbar__row">
          <div className="mp-toolbar__group mp-toolbar__group--price">
            <span className="mp-toolbar__field-label" id="mp-price-label">
              Precio ({priceReady ? `${priceExtent[0]}–${priceExtent[1]}` : "…"})
            </span>
            <div className="mp-toolbar__price-inputs">
              <input
                type="number"
                className="mp-toolbar__input"
                min={priceExtent[0]}
                max={priceExtent[1]}
                value={priceReady ? priceRange[0] : ""}
                onChange={(e) => onPriceMinInput(e.target.value)}
                disabled={!priceReady}
                aria-labelledby="mp-price-label"
                aria-label="Precio mínimo"
              />
              <span className="mp-toolbar__dash" aria-hidden>
                —
              </span>
              <input
                type="number"
                className="mp-toolbar__input"
                min={priceExtent[0]}
                max={priceExtent[1]}
                value={priceReady ? priceRange[1] : ""}
                onChange={(e) => onPriceMaxInput(e.target.value)}
                disabled={!priceReady}
                aria-labelledby="mp-price-label"
                aria-label="Precio máximo"
              />
            </div>
          </div>
          <div className="mp-toolbar__group">
            <label className="mp-toolbar__field-label" htmlFor="mp-sort">
              Ordenar por
            </label>
            <select
              id="mp-sort"
              className="mp-toolbar__select"
              value={sortKey}
              onChange={(e) =>
                setSortKey(e.target.value as MarketplaceSortKey)
              }
            >
              <option value="random">Aleatorio</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
              <option value="name-asc">Nombre: A–Z</option>
              <option value="name-desc">Nombre: Z–A</option>
            </select>
          </div>
          <label className="mp-toolbar__stock">
            <input
              type="checkbox"
              checked={onlyInStock}
              onChange={(e) => setOnlyInStock(e.target.checked)}
            />
            Solo con stock
          </label>
        </div>
        <p className="mp-toolbar__meta">
          {totalProducts === 1
            ? "1 producto con los filtros actuales"
            : `${totalProducts.toLocaleString()} productos con los filtros actuales`}
        </p>
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
            <div key={i} className="mp-card mp-card--skeleton" aria-hidden>
              <div className="mp-card__img-wrap" />
              <div className="mp-card__body">
                <div className="mp-skel-line mp-skel-line--title" />
                <div className="mp-skel-line mp-skel-line--price" />
                <div className="mp-skel-line mp-skel-line--short" />
                <div className="mp-skel-line mp-skel-line--cta" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mp-catalog-grids">
          {favoriteItems.length > 0 ? (
            <section className="mp-catalog-section" aria-labelledby="mp-fav-heading">
              <h2 id="mp-fav-heading" className="mp-catalog-section__title">
                Favoritos
              </h2>
              <div className="mp-grid">
                {favoriteItems.map((item) => (
                  <MarketplaceProductCard
                    key={`fav-${item.id}-${item.locationId ?? "x"}`}
                    item={item}
                    tagLabels={tagLabelsForProduct(item, tagsStable)}
                    onPedir={() => goToStore(item.locationId, item.locationName)}
                  />
                ))}
              </div>
            </section>
          ) : null}
          {restItems.length > 0 ? (
            <section
              className="mp-catalog-section"
              aria-labelledby={favoriteItems.length > 0 ? "mp-rest-heading" : undefined}
            >
              {favoriteItems.length > 0 ? (
                <h2 id="mp-rest-heading" className="mp-catalog-section__title">
                  Productos
                </h2>
              ) : null}
              <div className="mp-grid">
                {restItems.map((item) => (
                  <MarketplaceProductCard
                    key={`${item.id}-${item.locationId ?? "x"}`}
                    item={item}
                    tagLabels={tagLabelsForProduct(item, tagsStable)}
                    onPedir={() => goToStore(item.locationId, item.locationName)}
                  />
                ))}
              </div>
            </section>
          ) : null}
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
            <h2 className="mp-cta__title">¿Tienes un negocio local?</h2>
            <p className="mp-cta__text">
              Únete a StrovaStore y empieza a recibir pedidos por WhatsApp hoy mismo. Tu catálogo online listo en minutos.
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

    </div>
  );
}