"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useAppSelector } from "@/store/store";
import { useOpenCart } from "@/components/ui/CartUiContext";
import { useCatalogCtx } from "@/app/catalog/layout";
import {
  QUERY_POLLING_OPTIONS,
  useGetAllPublicProductsQuery,
  useGetPublicTagsQuery,
} from "@/app/catalog/_service/catalogApi";
import type { PublicCatalogItem, Tag } from "@/lib/dashboard-types";
import { toImageProxyUrl } from "@/lib/image";
import { PriceText } from "@/components/ui/PriceText";
import { useFuseSearch } from "@/hooks/useFuseSearch";
import { EmptyState } from "@/components/ui/EmptyState";
import { getRtkErrorInfo } from "@/lib/rtk-error";
import { buildLocationCatalogPath } from "@/lib/location-path";

const PAGE_SIZE = 60;

const PRODUCT_FUSE_KEYS = [
  { name: "name" as const, weight: 0.55 },
  { name: "description" as const, weight: 0.15 },
  { name: "tags.name" as const, weight: 0.3 },
];

function stars(rating: number): string {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return "★★★★★".slice(0, filled) + "☆☆☆☆☆".slice(0, 5 - filled);
}

function useCartCount(): number {
  return useAppSelector((s) => s.cart.items.reduce((sum, it) => sum + it.quantity, 0));
}

function tagLabelsForProduct(item: PublicCatalogItem, tagsStable: Tag[]): string[] {
  if (item.tags?.length) return item.tags.map((t) => t.name).filter(Boolean);
  const ids = item.tagIds ?? [];
  return ids
    .map((id) => tagsStable.find((t) => t.id === id)?.name)
    .filter((n): n is string => Boolean(n));
}

function deriveBadges(item: PublicCatalogItem, tagLabels: string[]) {
  const normalized = tagLabels.map((t) => t.toLowerCase().trim());
  const top =
    normalized.some((t) => t.includes("top") && t.includes("venta")) ||
    normalized.some((t) => t.includes("más vendido")) ||
    normalized.some((t) => t.includes("mas vendido"));
  const oferta = normalized.some((t) => t.includes("oferta") || t.includes("promo") || t.includes("sale"));
  const fast = normalized.some((t) => t.includes("env") || t.includes("entrega") || t.includes("prime") || t.includes("ráp"));

  // Fallbacks para que SIEMPRE exista lenguaje visual ecommerce aunque el backend no mande flags.
  const ratingSafe = typeof item.rating === "number" && Number.isFinite(item.rating) ? item.rating : 4.4;
  const any = top || oferta || fast;
  return {
    top: top || (!any && ratingSafe >= 4.6),
    oferta: oferta || (!any && item.precio % 5 === 0),
    fast: fast || (!any && item.stockAtLocation >= 3),
  };
}

function MarketplaceHeader({
  query,
  onQueryChange,
  onSubmit,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  onSubmit: () => void;
}) {
  const openCart = useOpenCart();
  const cartCount = useCartCount();

  return (
    <header className="mk-topbar">
      <div className="mk-topbar__inner">
        <div className="mk-brand" aria-label="Strova">
          <span className="mk-brand__icon" aria-hidden>
            <Icon name="shopping_bag" />
          </span>
          <span className="mk-brand__text">Strova</span>
        </div>

        <form
          className="mk-search"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <span className="mk-search__icon" aria-hidden>
            <Icon name="search" />
          </span>
          <input
            className="mk-search__input"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Busca por producto, marca o categoría..."
            aria-label="Buscar productos"
          />
          <button type="submit" className="mk-search__btn">
            BUSCAR
          </button>
        </form>

        <div className="mk-actions">
          <button type="button" className="mk-account" aria-label="Mi cuenta">
            <Icon name="person_outline" />
            <span className="mk-account__meta">
              <span className="mk-account__hello">Hola, Invitado</span>
              <span className="mk-account__label">Mi Cuenta</span>
            </span>
          </button>

          <button type="button" className="mk-cart" aria-label="Abrir carrito" onClick={() => openCart()}>
            <span className="mk-cart__icon" aria-hidden>
              <Icon name="shopping_cart" />
            </span>
            {cartCount > 0 ? <span className="mk-cart__badge">{cartCount}</span> : null}
          </button>
        </div>
      </div>
    </header>
  );
}

function MarketplaceSubnav() {
  return (
    <div className="mk-subbar" aria-label="Navegación del marketplace">
      <div className="mk-subbar__inner">
        <button type="button" className="mk-subbar__cat">
          <Icon name="menu" />
          Categorías
        </button>
        <button type="button" className="mk-subbar__link mk-subbar__link--accent">
          Ofertas Flash
        </button>
        <button type="button" className="mk-subbar__link">Lo más vendido</button>
        <button type="button" className="mk-subbar__link">Novedades</button>
        <span className="mk-subbar__spacer" />
        <div className="mk-subbar__shipto" aria-label="Enviar a">
          <Icon name="location_on" />
          Enviar a: Madrid, ES
        </div>
      </div>
    </div>
  );
}

function ProductCard({
  item,
  tagLabels,
  onOpenStore,
}: {
  item: PublicCatalogItem;
  tagLabels: string[];
  onOpenStore: () => void;
}) {
  const img = toImageProxyUrl(item.imagenUrl);
  const soldOut = item.tipo === "inventariable" && item.stockAtLocation <= 0;
  const ratingSafe = typeof item.rating === "number" && Number.isFinite(item.rating) ? item.rating : 4.6;
  const reviewsSafe =
    typeof item.reviewCount === "number" && Number.isFinite(item.reviewCount) ? Math.max(0, Math.round(item.reviewCount)) : 120;
  const badges = deriveBadges(item, tagLabels);

  return (
    <article className="mk-card" aria-label={item.name}>
      <div className="mk-card__img">
        {img ? (
          <Image src={img} alt={item.name} width={560} height={420} />
        ) : (
          <div className="mk-card__imgPh">
            <Icon name="image" />
          </div>
        )}

        <div className="mk-card__badges" aria-label="Badges">
          {badges.top ? <span className="mk-badge mk-badge--top">TOP VENTAS</span> : null}
          {badges.oferta ? <span className="mk-badge mk-badge--deal">OFERTA</span> : null}
        </div>
      </div>

      <div className="mk-card__body">
        <PriceText value={item.precio} className="mk-card__price" />

        <h3 className="mk-card__title" title={item.name}>
          {item.name}
        </h3>

        <div className="mk-card__rating" aria-label={`Rating ${ratingSafe.toFixed(1)} de 5`}>
          <span className="mk-card__stars" aria-hidden>
            {stars(ratingSafe)}
          </span>
          <span className="mk-card__ratingMeta">
            {ratingSafe.toFixed(1)} ({reviewsSafe.toLocaleString("es-US")})
          </span>
        </div>

        <div className="mk-card__meta">
          {!soldOut ? (
            <span className="mk-pill mk-pill--success">
              <Icon name="local_shipping" />
              Llega hoy
            </span>
          ) : (
            <span className="mk-pill mk-pill--error">
              <Icon name="error_outline" />
              Sin stock
            </span>
          )}
        </div>

        <button type="button" className="mk-card__cta" disabled={soldOut} onClick={onOpenStore}>
          <Icon name="shopping_cart" />
          Agregar al carrito
        </button>
      </div>
    </article>
  );
}

function FiltersSidebar({
  tags,
  selectedTag,
  onSelectTag,
  priceExtent,
  priceRange,
  onPriceMin,
  onPriceMax,
  ratingMin,
  setRatingMin,
  onlyInStock,
  setOnlyInStock,
}: {
  tags: { slug: string; name: string; count: number }[];
  selectedTag: string | null;
  onSelectTag: (slug: string | null) => void;
  priceExtent: [number, number];
  priceRange: [number, number];
  onPriceMin: (v: number) => void;
  onPriceMax: (v: number) => void;
  ratingMin: number;
  setRatingMin: (v: number) => void;
  onlyInStock: boolean;
  setOnlyInStock: (v: boolean) => void;
}) {
  return (
    <aside className="mk-filters" aria-label="Filtros de búsqueda">
      <h2 className="mk-filters__title">Filtros de Búsqueda</h2>

      <section className="mk-filter">
        <p className="mk-filter__label">Categoría</p>
        <div className="mk-chips" role="group" aria-label="Categorías">
          <button
            type="button"
            className={`mk-chip${selectedTag == null ? " mk-chip--active" : ""}`}
            onClick={() => onSelectTag(null)}
          >
            Todas
          </button>
          {tags.slice(0, 8).map((t) => (
            <button
              key={t.slug}
              type="button"
              className={`mk-chip${selectedTag === t.slug ? " mk-chip--active" : ""}`}
              onClick={() => onSelectTag(t.slug)}
              title={`${t.name} (${t.count})`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </section>

      <section className="mk-filter">
        <p className="mk-filter__label">Rango de Precio</p>
        <div className="mk-priceInputs">
          <input
            type="number"
            className="mk-input"
            placeholder="Min €"
            min={priceExtent[0]}
            max={priceExtent[1]}
            value={priceRange[0]}
            onChange={(e) => onPriceMin(Number(e.target.value || 0))}
            aria-label="Precio mínimo"
          />
          <input
            type="number"
            className="mk-input"
            placeholder="Max €"
            min={priceExtent[0]}
            max={priceExtent[1]}
            value={priceRange[1]}
            onChange={(e) => onPriceMax(Number(e.target.value || 0))}
            aria-label="Precio máximo"
          />
        </div>
        <input
          type="range"
          className="mk-slider"
          min={priceExtent[0]}
          max={priceExtent[1]}
          value={priceRange[1]}
          onChange={(e) => onPriceMax(Number(e.target.value || 0))}
          aria-label="Precio máximo (slider)"
        />
      </section>

      <section className="mk-filter">
        <p className="mk-filter__label">Valoración</p>
        <div className="mk-ratingRow" role="group" aria-label="Mínimo de estrellas">
          {[4, 3, 2].map((v) => (
            <button
              key={v}
              type="button"
              className={`mk-ratingBtn${ratingMin === v ? " mk-ratingBtn--active" : ""}`}
              onClick={() => setRatingMin(v)}
            >
              {"★★★★★".slice(0, v) + "☆☆☆☆☆".slice(0, 5 - v)} <span>&nbsp;y más</span>
            </button>
          ))}
        </div>
      </section>

      <div className="mk-divider" aria-hidden />

      <label className="mk-switch">
        <input type="checkbox" checked={onlyInStock} onChange={(e) => setOnlyInStock(e.target.checked)} />
        <span>En Stock</span>
      </label>
    </aside>
  );
}

export default function MarketplaceProductosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { search, setSearch } = useCatalogCtx();
  const initializedQueryFromUrlRef = useRef(false);

  const initialQ = searchParams.get("q")?.trim() ?? "";
  useEffect(() => {
    if (initializedQueryFromUrlRef.current) return;
    initializedQueryFromUrlRef.current = true;
    if (initialQ) setSearch(initialQ);
  }, [initialQ, setSearch]);

  const [page, setPage] = useState(1);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [ratingMin, setRatingMin] = useState(0);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetAllPublicProductsQuery(
    { page, pageSize: PAGE_SIZE },
    QUERY_POLLING_OPTIONS.general,
  );
  const { data: tagsRaw } = useGetPublicTagsQuery(undefined, QUERY_POLLING_OPTIONS.general);
  const tagsStable = useMemo(() => tagsRaw ?? [], [tagsRaw]);

  const [items, setItems] = useState<PublicCatalogItem[]>([]);
  useEffect(() => {
    if (!data?.data) return;
    if (page === 1) setItems(data.data);
    else setItems((prev) => [...prev, ...data.data]);
  }, [data, page]);

  const filteredBySearch = useFuseSearch(items, PRODUCT_FUSE_KEYS, search);

  const priceExtent: [number, number] = useMemo(() => {
    if (!filteredBySearch.length) return [0, 100];
    let mn = Infinity;
    let mx = -Infinity;
    for (const p of filteredBySearch) {
      mn = Math.min(mn, p.precio);
      mx = Math.max(mx, p.precio);
    }
    if (!Number.isFinite(mn) || !Number.isFinite(mx)) return [0, 100];
    return [Math.floor(mn), Math.ceil(mx)];
  }, [filteredBySearch]);

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  useEffect(() => {
    if (priceRange[1] === 0 && priceExtent[1] > 0) {
      setPriceRange([priceExtent[0], priceExtent[1]]);
    }
  }, [priceExtent, priceRange]);

  const tagsWithCount = useMemo(() => {
    const countBySlug = new Map<string, number>();
    for (const p of filteredBySearch) {
      const slugs = (p.tagIds ?? [])
        .map((id) => tagsStable.find((t) => t.id === id)?.slug)
        .filter(Boolean) as string[];
      for (const s of slugs) countBySlug.set(s, (countBySlug.get(s) ?? 0) + 1);
    }
    return tagsStable
      .filter((t) => (countBySlug.get(t.slug) ?? 0) > 0)
      .map((t) => ({ slug: t.slug, name: t.name, count: countBySlug.get(t.slug) ?? 0 }))
      .sort((a, b) => b.count - a.count);
  }, [filteredBySearch, tagsStable]);

  const filtered = useMemo(() => {
    let list = [...filteredBySearch];
    if (selectedTag) {
      list = list.filter((p) => {
        const slugs = (p.tagIds ?? [])
          .map((id) => tagsStable.find((t) => t.id === id)?.slug)
          .filter(Boolean) as string[];
        return slugs.includes(selectedTag);
      });
    }
    list = list.filter((p) => p.precio >= priceRange[0] && p.precio <= priceRange[1]);
    if (onlyInStock) list = list.filter((p) => p.tipo === "elaborado" || p.stockAtLocation > 0);
    if (ratingMin > 0) {
      list = list.filter((p) => (typeof p.rating === "number" ? p.rating : 4.4) >= ratingMin);
    }
    return list;
  }, [filteredBySearch, onlyInStock, priceRange, ratingMin, selectedTag, tagsStable]);

  const total = data?.pagination?.total ?? filtered.length;
  const errorInfo = getRtkErrorInfo(error);

  const patchQ = useCallback(
    (q: string) => {
      const sp = new URLSearchParams(searchParams.toString());
      if (q.trim()) sp.set("q", q.trim());
      else sp.delete("q");
      router.replace(`/catalog/productos?${sp.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const onSubmit = useCallback(() => patchQ(search), [patchQ, search]);

  const goToStore = useCallback(
    (locationId: number | null, locationName: string | null) => {
      if (locationId == null || !locationName) return;
      router.push(buildLocationCatalogPath({ id: locationId, name: locationName }));
    },
    [router],
  );

  return (
    <div className="mk-page">
      <MarketplaceHeader query={search} onQueryChange={setSearch} onSubmit={onSubmit} />
      <MarketplaceSubnav />

      <main className="mk-main">
        <div className="mk-shell">
          <div className="mk-layout">
            <FiltersSidebar
              tags={tagsWithCount}
              selectedTag={selectedTag}
              onSelectTag={(slug) => setSelectedTag(slug)}
              priceExtent={priceExtent}
              priceRange={priceRange}
              onPriceMin={(v) => setPriceRange((p) => [Math.max(priceExtent[0], Math.min(v, p[1])), p[1]])}
              onPriceMax={(v) => setPriceRange((p) => [p[0], Math.min(priceExtent[1], Math.max(v, p[0]))])}
              ratingMin={ratingMin}
              setRatingMin={setRatingMin}
              onlyInStock={onlyInStock}
              setOnlyInStock={setOnlyInStock}
            />

            <section className="mk-results" aria-label="Resultados">
              <div className="mk-results__head">
                <div>
                  <h1 className="mk-results__title">Resultados de Búsqueda</h1>
                  <p className="mk-results__sub">
                    Mostrando {filtered.length ? `1-${Math.min(filtered.length, 12)}` : "0"} de{" "}
                    {total.toLocaleString("es-US")} productos encontrados
                  </p>
                </div>
                <button type="button" className="mk-sort" aria-label="Ordenar por">
                  <span>Ordenar por:</span> <strong>Más relevantes</strong> <Icon name="expand_more" />
                </button>
              </div>

              {isError ? (
                <EmptyState
                  icon={<Icon name="cloud_off" />}
                  message={errorInfo.message ?? "No se pudo cargar el marketplace. Intenta nuevamente."}
                  action={
                    <button type="button" className="mk-more__btn" onClick={() => refetch()}>
                      <Icon name="refresh" />
                      Reintentar
                    </button>
                  }
                />
              ) : null}

              {!isLoading && !filtered.length && !isError ? (
                <EmptyState
                  icon={<Icon name="search_off" />}
                  message="Sin resultados. Prueba con otros filtros o una búsqueda distinta."
                  compact
                  action={
                    <button
                      type="button"
                      className="mk-more__btn"
                      onClick={() => {
                        setSelectedTag(null);
                        setOnlyInStock(false);
                        setRatingMin(0);
                        setPriceRange([priceExtent[0], priceExtent[1]]);
                        setSearch("");
                        patchQ("");
                      }}
                    >
                      <Icon name="restart_alt" />
                      Limpiar
                    </button>
                  }
                />
              ) : null}

              <div className="mk-grid" aria-busy={isLoading || isFetching}>
                {filtered.map((item) => (
                  <ProductCard
                    key={`${item.id}-${item.locationId ?? "x"}`}
                    item={item}
                    tagLabels={tagLabelsForProduct(item, tagsStable)}
                    onOpenStore={() => goToStore(item.locationId, item.locationName)}
                  />
                ))}
              </div>

              <div className="mk-more">
                <button
                  type="button"
                  className="mk-more__btn"
                  disabled={isFetching || !data?.pagination || page >= (data.pagination.totalPages ?? 1)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <Icon name="add" />
                  Ver más resultados
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

