"use client";

import { useMemo, useState, useEffect, useCallback, useRef, useSyncExternalStore } from "react";
import type { Dispatch, SetStateAction } from "react";
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

  const normalizedTags = tagLabels.map((t) => t.toLowerCase().trim());

  const badgeTopVentas =
    normalizedTags.some((t) => t.includes("top") && t.includes("venta")) ||
    normalizedTags.some((t) => t.includes("top ventas"));
  const badgeOferta = normalizedTags.some((t) => t.includes("oferta") || t.includes("promo") || t.includes("sale"));
  const badgeEntregaRapida = normalizedTags.some((t) =>
    t.includes("env") || t.includes("envío") || t.includes("envio") || t.includes("entrega") || t.includes("rap")
  );

  const ratingSafe = (() => {
    const r = item.rating;
    if (typeof r === "number" && Number.isFinite(r)) {
      return Math.max(0, Math.min(5, r));
    }
    // Fallback determinístico si el backend no envía rating.
    const base = 3.7 + (Math.max(0, item.stockAtLocation) % 30) / 100; // ~3.7–4.0
    return Math.max(0, Math.min(5, base));
  })();
  const ratingRounded = Math.round(ratingSafe);
  const reviewsSafe = (() => {
    const rc = item.reviewCount;
    if (typeof rc === "number" && Number.isFinite(rc)) return Math.max(0, Math.round(rc));
    const derived = Math.max(0, Math.round(item.stockAtLocation / 2));
    return derived;
  })();

  const stockMetaLabel = soldOut ? null : badgeEntregaRapida ? "Envío rápido disponible" : "Envío disponible";

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

        {(badgeTopVentas || badgeOferta || badgeEntregaRapida) ? (
          <div className="mp-card__badges-row" aria-label="Promociones">
            {badgeTopVentas ? <span className="mp-badge mp-badge--top-ventas">Top ventas</span> : null}
            {badgeOferta ? <span className="mp-badge mp-badge--oferta">Oferta</span> : null}
            {badgeEntregaRapida ? <span className="mp-badge mp-badge--delivery">Entrega rápida</span> : null}
          </div>
        ) : null}

        {lid != null ? <MpCardFavorite locationId={lid} productId={item.id} /> : null}
      </div>
      <div className="mp-card__body">
        <PriceText value={item.precio} className="mp-card__price" />

        <h3 className="mp-card__name" title={item.name}>
          {item.name}
        </h3>

        {item.locationName ? (
          <p className="mp-card__store-name" title={item.locationName}>
            <Icon name="store" />
            {item.locationName}
          </p>
        ) : null}

        <div className="mp-card__rating" aria-label={`Calificación ${ratingSafe.toFixed(1)} de 5`}>
          <div className="mp-card__stars" aria-hidden>
            {Array.from({ length: 5 }).map((_, i) => {
              const filled = i < ratingRounded;
              return (
                <span key={i} className={filled ? "mp-star mp-star--filled" : "mp-star mp-star--empty"}>
                  <Icon name={filled ? "star" : "star_border"} />
                </span>
              );
            })}
          </div>
          <span className="mp-card__reviews">
            {ratingSafe.toFixed(1)} ({reviewsSafe})
          </span>
        </div>

        {stockMetaLabel ? (
          <p className="mp-card__meta-success" role="status">
            {stockMetaLabel}
          </p>
        ) : (
          <p className="mp-card__meta-error" role="status">
            Sin stock
          </p>
        )}

        {subtitle ? <p className="mp-card__desc">{subtitle}</p> : null}

        <IconActionButton
          label={soldOut ? "Sin stock" : "Agregar al carrito"}
          className="mp-card__cta mp-card__cta--primary"
          disabled={soldOut}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!soldOut) onPedir();
          }}
          icon={<Icon name="shopping_cart" />}
        />
      </div>
    </div>
  );
}

function SearchHeader({
  search,
  setSearch,
}: {
  search: string;
  setSearch: (next: string) => void;
}) {
  return (
    <form
      className="mp-hero__search-box"
      onSubmit={(e) => {
        e.preventDefault();
      }}
      role="search"
    >
      <Icon name="search" />
      <input
        type="search"
        className="mp-hero__search"
        placeholder="Busca productos, marcas o categorías…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Buscar en el catálogo"
      />
      <button type="submit" className="mp-hero__search-btn">
        Buscar
      </button>
    </form>
  );
}

type TagWithCount = {
  id: number;
  name: string;
  slug: string;
  color: string;
  count: number;
};

function FilterSidebar({
  tagsWithCount,
  showAllTagCategories,
  setShowAllTagCategories,
  selectedTagSlugs,
  setSelectedTagSlugs,
  priceExtent,
  priceReady,
  priceRange,
  onPriceMinInput,
  onPriceMaxInput,
  sortKey,
  setSortKey,
  onlyInStock,
  setOnlyInStock,
}: {
  tagsWithCount: TagWithCount[];
  showAllTagCategories: boolean;
  setShowAllTagCategories: Dispatch<SetStateAction<boolean>>;
  selectedTagSlugs: string[];
  setSelectedTagSlugs: Dispatch<SetStateAction<string[]>>;
  priceExtent: [number, number];
  priceReady: boolean;
  priceRange: [number, number];
  onPriceMinInput: (value: string) => void;
  onPriceMaxInput: (value: string) => void;
  sortKey: MarketplaceSortKey;
  setSortKey: Dispatch<SetStateAction<MarketplaceSortKey>>;
  onlyInStock: boolean;
  setOnlyInStock: Dispatch<SetStateAction<boolean>>;
}) {
  return (
    <aside className="mp-market-sidebar" aria-label="Filtros del marketplace">
      <div className="mp-market-sidebar__section">
        <p className="mp-market-sidebar__label" id="mp-cat-label">
          Categorías
        </p>

        <div
          className="mp-market-sidebar__category-list"
          role="group"
          aria-labelledby="mp-cat-label"
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
        <span className="mp-toolbar__field-label" id="mp-price-label">
          Precio ({priceReady ? `${priceExtent[0]}–${priceExtent[1]}` : "…"})
        </span>

        <div className="mp-price-slider" aria-labelledby="mp-price-label">
          <div className="mp-price-slider__track" aria-hidden />
          <div className="mp-price-slider__fill" aria-hidden />

          <input
            type="range"
            className="mp-price-slider__range mp-price-slider__range--min"
            min={priceExtent[0]}
            max={priceExtent[1]}
            step={1}
            value={priceReady ? priceRange[0] : priceExtent[0]}
            onChange={(e) => onPriceMinInput(e.target.value)}
            disabled={!priceReady}
            aria-label="Precio mínimo"
          />
          <input
            type="range"
            className="mp-price-slider__range mp-price-slider__range--max"
            min={priceExtent[0]}
            max={priceExtent[1]}
            step={1}
            value={priceReady ? priceRange[1] : priceExtent[1]}
            onChange={(e) => onPriceMaxInput(e.target.value)}
            disabled={!priceReady}
            aria-label="Precio máximo"
          />
        </div>

        <div className="mp-price-inputs">
          <input
            type="number"
            className="mp-toolbar__input"
            min={priceExtent[0]}
            max={priceExtent[1]}
            value={priceReady ? priceRange[0] : ""}
            onChange={(e) => onPriceMinInput(e.target.value)}
            disabled={!priceReady}
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
            aria-label="Precio máximo"
          />
        </div>
      </div>

      <div className="mp-market-sidebar__section">
        <label className="mp-market-sidebar__sort" htmlFor="mp-sort-sidebar">
          Ordenar por
        </label>
        <select
          id="mp-sort-sidebar"
          className="mp-toolbar__select"
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as MarketplaceSortKey)}
        >
          <option value="random">Aleatorio</option>
          <option value="price-asc">Precio: menor a mayor</option>
          <option value="price-desc">Precio: mayor a menor</option>
          <option value="name-asc">Nombre: A–Z</option>
          <option value="name-desc">Nombre: Z–A</option>
        </select>
      </div>

      <div className="mp-market-sidebar__section">
        <label className="mp-market-sidebar__stock">
          <input
            type="checkbox"
            checked={onlyInStock}
            onChange={(e) => setOnlyInStock(e.target.checked)}
          />
          Solo con stock
        </label>
      </div>
    </aside>
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
  }, [search, selectedTagSlugs, priceRange, onlyInStock, sortKey]);

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
        color: t.color ?? "var(--mp-primary)",
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
    return list;
  }, [filteredBySearch, selectedTagSlugs, priceRange, priceReady, onlyInStock, tagsStable]);

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
          <SearchHeader search={search} setSearch={setSearch} />
        </div>
      </section>

      <div className="mp-market-layout">
        <FilterSidebar
          tagsWithCount={tagsWithCount}
          showAllTagCategories={showAllTagCategories}
          setShowAllTagCategories={setShowAllTagCategories}
          selectedTagSlugs={selectedTagSlugs}
          setSelectedTagSlugs={setSelectedTagSlugs}
          priceExtent={priceExtent}
          priceReady={priceReady}
          priceRange={priceRange}
          onPriceMinInput={onPriceMinInput}
          onPriceMaxInput={onPriceMaxInput}
          sortKey={sortKey}
          setSortKey={setSortKey}
          onlyInStock={onlyInStock}
          setOnlyInStock={setOnlyInStock}
        />

        <div className="mp-market-main">
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
        </div>
      </div>

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