"use client";

import {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
  useSyncExternalStore,
  type Dispatch,
  type SetStateAction,
} from "react";
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
import { getOriginalPriceForDisplay, getPromotionBadgeLabel } from "@/lib/catalog-promotion";
import { useMetrics } from "@/src/metrics/useMetrics";
import { CatalogMobileVistaMenu } from "@/app/catalog/_components/CatalogMobileVistaMenu";

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

type MarketplaceSortKey =
  | "random"
  | "price-asc"
  | "price-desc"
  | "name-asc"
  | "name-desc"
  | "promo-first";

type MarketplaceTagRow = {
  id: number;
  name: string;
  slug: string;
  color: string;
  count: number;
};

type MarketplaceFiltersBodyProps = {
  idPrefix: string;
  tagsWithCount: MarketplaceTagRow[];
  selectedTagSlugs: string[];
  setSelectedTagSlugs: Dispatch<SetStateAction<string[]>>;
  showAllTagCategories: boolean;
  setShowAllTagCategories: Dispatch<SetStateAction<boolean>>;
  priceExtent: [number, number];
  priceReady: boolean;
  priceRange: [number, number];
  onPriceMinInput: (raw: string) => void;
  onPriceMaxInput: (raw: string) => void;
  sortKey: MarketplaceSortKey;
  setSortKey: (k: MarketplaceSortKey) => void;
  onlyInStock: boolean;
  setOnlyInStock: (v: boolean) => void;
  onlyOffers: boolean;
  setOnlyOffers: (v: boolean) => void;
};

function MarketplaceFiltersBody({
  idPrefix,
  tagsWithCount,
  selectedTagSlugs,
  setSelectedTagSlugs,
  showAllTagCategories,
  setShowAllTagCategories,
  priceExtent,
  priceReady,
  priceRange,
  onPriceMinInput,
  onPriceMaxInput,
  sortKey,
  setSortKey,
  onlyInStock,
  setOnlyInStock,
  onlyOffers,
  setOnlyOffers,
}: MarketplaceFiltersBodyProps) {
  const catLabelId = `${idPrefix}-cat-label`;
  const priceLabelId = `${idPrefix}-price-label`;
  const sortId = `${idPrefix}-sort`;

  return (
    <>
      <div className="mp-market-sidebar__section">
        <p className="mp-market-sidebar__label" id={catLabelId}>
          Categorías
        </p>

        <div
          className="mp-market-sidebar__category-list"
          role="group"
          aria-labelledby={catLabelId}
        >
          <button
            type="button"
            className={`mp-market-cat-btn${selectedTagSlugs.length === 0 ? " mp-market-cat-btn--active" : ""}`}
            onClick={() => setSelectedTagSlugs([])}
          >
            Todas
          </button>

          {(showAllTagCategories ? tagsWithCount : tagsWithCount.slice(0, 5)).map((t) => (
            <button
              key={t.slug}
              type="button"
              className={`mp-market-cat-btn${selectedTagSlugs.includes(t.slug) ? " mp-market-cat-btn--active" : ""}`}
              onClick={() =>
                setSelectedTagSlugs((prev) =>
                  prev.includes(t.slug) ? prev.filter((x) => x !== t.slug) : [...prev, t.slug],
                )
              }
            >
              <span className="mp-market-cat-btn__dot" style={{ background: t.color }} aria-hidden />
              <span className="mp-market-cat-btn__text">{t.name}</span>
              <span className="mp-market-cat-btn__count">({t.count})</span>
            </button>
          ))}
        </div>

        {tagsWithCount.length > 5 ? (
          <button
            type="button"
            className="mp-market-sidebar__more"
            onClick={() => setShowAllTagCategories((v) => !v)}
          >
            {showAllTagCategories ? "Ver menos" : "Ver más"}
          </button>
        ) : null}
      </div>

      <div className="mp-market-sidebar__section">
        <span className="mp-toolbar__field-label" id={priceLabelId}>
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
            aria-labelledby={priceLabelId}
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
            aria-labelledby={priceLabelId}
            aria-label="Precio máximo"
          />
        </div>
      </div>

      <div className="mp-market-sidebar__section">
        <label className="mp-toolbar__field-label" htmlFor={sortId}>
          Ordenar por
        </label>
        <select
          id={sortId}
          className="mp-toolbar__select"
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as MarketplaceSortKey)}
        >
          <option value="random">Aleatorio</option>
          <option value="price-asc">Precio: menor a mayor</option>
          <option value="price-desc">Precio: mayor a menor</option>
          <option value="name-asc">Nombre: A–Z</option>
          <option value="name-desc">Nombre: Z–A</option>
          <option value="promo-first">Primero en oferta</option>
        </select>
      </div>

      <div className="mp-market-sidebar__section">
        <label className="mp-market-sidebar__stock" htmlFor={`${idPrefix}-stock`}>
          <input
            id={`${idPrefix}-stock`}
            type="checkbox"
            checked={onlyInStock}
            onChange={(e) => setOnlyInStock(e.target.checked)}
          />
          Solo con stock
        </label>
      </div>
      <div className="mp-market-sidebar__section">
        <label className="mp-market-sidebar__stock" htmlFor={`${idPrefix}-offers`}>
          <input
            id={`${idPrefix}-offers`}
            type="checkbox"
            checked={onlyOffers}
            onChange={(e) => setOnlyOffers(e.target.checked)}
          />
          Solo ofertas
        </label>
      </div>
    </>
  );
}

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
    case "promo-first":
      return copy.sort((a, b) => {
        const aPromo = a.hasActivePromotion ? 1 : 0;
        const bPromo = b.hasActivePromotion ? 1 : 0;
        if (aPromo !== bPromo) return bPromo - aPromo;
        return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
      });
    default:
      return copy;
  }
}

function MpCardFavorite({
  locationId,
  productId,
}: {
  locationId: number;
  productId: number;
}) {
  const { trackFavorite } = useMetrics();
  const { isFavorite, toggle } = useFavoriteProduct(locationId, productId);
  return (
    <CardFavoriteButton
      isFavorite={isFavorite}
      onToggle={(ev) => {
        if (!isFavorite) trackFavorite(String(locationId), productId);
        toggle(ev);
      }}
      labelOn="Quitar producto de favoritos"
      labelOff="Guardar producto en favoritos"
      className="sp-card__fav"
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
  const promoBadge = getPromotionBadgeLabel(item);
  const originalPrice = getOriginalPriceForDisplay(item);

  const handleActivate = () => {
    if (!soldOut) onPedir();
  };

  return (
    <div
      className={`sp-card${soldOut ? " sp-card--sold" : ""}`}
      onClick={handleActivate}
      onKeyDown={(e) => e.key === "Enter" && handleActivate()}
      role="button"
      tabIndex={soldOut ? -1 : 0}
      aria-disabled={soldOut}
    >
      <div className={`sp-card__img-wrap${promoBadge && item.categoryName ? " sp-card__img-wrap--promo-cat" : ""}`}>
        {proxiedImageUrl ? (
          <Image
            src={proxiedImageUrl}
            alt={item.name}
            width={480}
            height={320}
            className="sp-card__img"
          />
        ) : (
          <div className="sp-card__img-placeholder">
            <Icon name="inventory_2" />
          </div>
        )}
        {tagLabels.length > 0 ? (
          <div className="sp-card__tags-row" aria-label="Etiquetas">
            {tagLabels.slice(0, 3).map((label, idx) => (
              <span key={`${label}-${idx}`} className="sp-card__tag-pill">
                <span
                  className="sp-card__tag-dot"
                  style={{ background: categoryDotColor(label) }}
                  aria-hidden
                />
                {label}
              </span>
            ))}
          </div>
        ) : null}
        {promoBadge ? <span className="sp-card__promo-pill">{promoBadge}</span> : null}
        {lid != null ? (
          <MpCardFavorite locationId={lid} productId={item.id} />
        ) : null}
        <div className="sp-card__img-gradient" aria-hidden />
        <span className="sp-card__overlay-name">{item.name}</span>
        {!soldOut ? (
          <button
            type="button"
            className="sp-card__fab"
            onClick={(e) => { e.stopPropagation(); onPedir(); }}
            aria-label="Ver en tienda"
          >
            <Icon name="storefront" />
          </button>
        ) : null}
      </div>
      <div className="sp-card__body">
        {item.locationName ? (
          <p className="sp-card__store-line" title={item.locationName}>
            <Icon name="store" />
            {item.locationName}
          </p>
        ) : null}
        <h3 className="sp-card__name sp-card__name--lines-2" title={item.name}>
          {item.name}
        </h3>
        <div className="sp-card__price-wrap">
          <PriceText value={item.precio} className="sp-card__price" />
          {originalPrice != null ? (
            <PriceText value={originalPrice} className="sp-card__price-old" />
          ) : null}
        </div>
        {!soldOut ? (
          <p className="sp-card__stock-ok" role="status">
            En stock
          </p>
        ) : null}
        {subtitle ? <p className="sp-card__desc">{subtitle}</p> : null}
        <IconActionButton
          label={soldOut ? "Sin stock" : "Ver en la tienda"}
          className="sp-card__add sp-card__add--outline"
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
  const [sortKey, setSortKey] = useState<MarketplaceSortKey>("random");
  const [showAllTagCategories, setShowAllTagCategories] = useState(false);
  const [selectedTagSlugs, setSelectedTagSlugs] = useState<string[]>(() => {
    const rawTagParams = searchParams.getAll("tag");
    return rawTagParams
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
      .filter((slug, index, arr) => arr.indexOf(slug) === index);
  });
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [onlyOffers, setOnlyOffers] = useState(false);
  const [page, setPage] = useState(1);
  const [randomReady, setRandomReady] = useState(false);
  const [priceReady, setPriceReady] = useState(false);
  const [items, setItems] = useState<PublicCatalogItem[]>([]);
  const [mpFiltersOpen, setMpFiltersOpen] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pagination = data?.pagination;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [search, selectedTagSlugs, priceRange, onlyInStock, onlyOffers, sortKey]);

  useEffect(() => {
    setRandomReady(true);
  }, []);

  useEffect(() => {
    if (!mpFiltersOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMpFiltersOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mpFiltersOpen]);

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
    if (onlyOffers) {
      list = list.filter((p) => p.hasActivePromotion === true);
    }
    return list;
  }, [filteredBySearch, selectedTagSlugs, priceRange, priceReady, onlyInStock, onlyOffers, tagsStable]);

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
    setSelectedTagSlugs([]);
    setOnlyInStock(false);
    setOnlyOffers(false);
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

  const mpFilterBadgeCount =
    selectedTagSlugs.length + (onlyInStock ? 1 : 0) + (onlyOffers ? 1 : 0);

  const filtersBodyProps: MarketplaceFiltersBodyProps = {
    idPrefix: "mp-sidebar",
    tagsWithCount,
    selectedTagSlugs,
    setSelectedTagSlugs,
    showAllTagCategories,
    setShowAllTagCategories,
    priceExtent,
    priceReady,
    priceRange,
    onPriceMinInput,
    onPriceMaxInput,
    sortKey,
    setSortKey,
    onlyInStock,
    setOnlyInStock,
    onlyOffers,
    setOnlyOffers,
  };

  return (
    <>
    <div className="sp-layout sp-layout--marketplace">
        <aside className="sp-sidebar sp-sidebar--marketplace-desktop" aria-label="Filtros del marketplace">
          <MarketplaceFiltersBody {...filtersBodyProps} />
        </aside>

        <main className="sp-main">
          <div className="sp-catalog-header">
            <div className="sp-catalog-title-wrap">
              <h1 className="sp-catalog-title">Marketplace de productos</h1>
              <p className="sp-catalog-subtitle">
                Explora lo que ofrecen los negocios de tu ciudad
              </p>
            </div>
            <div className="sp-catalog-search-wrap">
              <div className="sp-catalog-search-box">
                <Icon name="search" />
                <input
                  type="search"
                  className="sp-catalog-search"
                  placeholder="Busca herramientas, café, libros…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Buscar en el catálogo"
                />
              </div>
            </div>
            <CatalogMobileVistaMenu active="productos" />
          </div>

          <div className="mp-marketplace-toolbar mp-marketplace-toolbar--mobile-only">
            <button
              type="button"
              className="dir-tiendas-filters-trigger"
              aria-expanded={mpFiltersOpen}
              aria-controls="mp-marketplace-filters-panel"
              onClick={() => setMpFiltersOpen(true)}
            >
              <Icon name="filter_list" />
              Filtros
              {mpFilterBadgeCount > 0 ? (
                <span className="mp-marketplace-filters-badge">{mpFilterBadgeCount}</span>
              ) : null}
            </button>
          </div>

          <p className="mp-toolbar__meta">
            {totalProducts === 1
              ? "1 producto con los filtros actuales"
              : `${totalProducts.toLocaleString()} productos con los filtros actuales`}
          </p>

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
            <div className="sp-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skel-card" aria-hidden>
                  <div className="skel-card__img" />
                  <div className="skel-card__body">
                    <div className="skel-line skel-line--lg" />
                    <div className="skel-line skel-line--md" />
                    <div className="skel-line skel-line--price" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="sp-catalog-grids">
              {favoriteItems.length > 0 ? (
                <section className="sp-catalog-section" aria-labelledby="mp-fav-heading">
                  <h2 id="mp-fav-heading" className="sp-catalog-section__title">
                    Favoritos
                  </h2>
                  <div className="sp-grid">
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
                  className="sp-catalog-section"
                  aria-labelledby={favoriteItems.length > 0 ? "mp-rest-heading" : undefined}
                >
                  {favoriteItems.length > 0 ? (
                    <h2 id="mp-rest-heading" className="sp-catalog-section__title">
                      Productos
                    </h2>
                  ) : null}
                  <div className="sp-grid">
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
            <div className="sp-load-more">
              <button
                type="button"
                className="sp-load-more__btn"
                onClick={loadMore}
                disabled={loadingMore}
              >
                Ver más productos
              </button>
            </div>
          )}
        </main>
    </div>

      <section className="mp-cta">
        <div className="mp-cta__bg-icon" aria-hidden>
          <Icon name="storefront" />
        </div>
        <div className="mp-cta__inner">
          <div className="mp-cta__content">
            <h2 className="mp-cta__title">¿Tienes un negocio local?</h2>
            <p className="mp-cta__text">
              Únete a Tu Cuadre y empieza a recibir pedidos por WhatsApp hoy mismo. Tu catálogo online listo en minutos.
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

      {mpFiltersOpen ? (
        <>
          <button
            type="button"
            className="dir-tiendas-filters-backdrop"
            aria-label="Cerrar filtros"
            onClick={() => setMpFiltersOpen(false)}
          />
          <div
            id="mp-marketplace-filters-panel"
            className="dir-tiendas-filters-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mp-marketplace-filters-title"
          >
            <div className="dir-tiendas-filters-panel__head">
              <h2 id="mp-marketplace-filters-title" className="dir-tiendas-filters-panel__title">
                Filtros
              </h2>
              <button
                type="button"
                className="dir-tiendas-filters-panel__close"
                onClick={() => setMpFiltersOpen(false)}
                aria-label="Cerrar"
              >
                <Icon name="close" />
              </button>
            </div>
            <div className="dir-tiendas-filters-panel__body">
              <MarketplaceFiltersBody {...filtersBodyProps} idPrefix="mp-drawer" />
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}