"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useCatalogCtx } from "@/app/catalog/layout";
import {
  QUERY_POLLING_OPTIONS,
  useGetAllPublicProductsQuery,
  useGetPublicTagsQuery,
} from "@/app/catalog/_service/catalogApi";
import type { PublicCatalogItem, Tag } from "@/lib/dashboard-types";
import { toImageProxyUrl } from "@/lib/image";
import { useFuseSearch } from "@/hooks/useFuseSearch";
import { PriceText } from "@/components/ui/PriceText";
import { EmptyState } from "@/components/ui/EmptyState";
import { getRtkErrorInfo } from "@/lib/rtk-error";
import { buildLocationCatalogPath } from "@/lib/location-path";
import { CxButton } from "@/components/ui/catalog/CxButton";
import { CxSwitch } from "@/components/ui/catalog/CxSwitch";
import { RatingStars } from "@/components/ui/catalog/RatingStars";
import { CardFavoriteButton } from "@/components/ui/CardFavoriteButton";
import { useFavoriteProduct } from "@/hooks/useFavorites";

const PAGE_SIZE = 48;

const PRODUCT_FUSE_KEYS = [
  { name: "name" as const, weight: 0.55 },
  { name: "description" as const, weight: 0.15 },
  { name: "tags.name" as const, weight: 0.3 },
];

function tagLabelsForProduct(item: PublicCatalogItem, tagsStable: Tag[]): string[] {
  if (item.tags?.length) return item.tags.map((t) => t.name).filter(Boolean);
  const ids = item.tagIds ?? [];
  return ids
    .map((id) => tagsStable.find((t) => t.id === id)?.name)
    .filter((n): n is string => Boolean(n));
}

function MkFav({ locationId, productId }: { locationId: number; productId: number }) {
  const { isFavorite, toggle } = useFavoriteProduct(locationId, productId);
  return (
    <CardFavoriteButton
      isFavorite={isFavorite}
      onToggle={toggle}
      labelOn="Quitar de favoritos"
      labelOff="Guardar en favoritos"
      className="cx-mp-card__fav"
    />
  );
}

function ProductCard({
  item,
  tagsStable,
  onOpenStore,
}: {
  item: PublicCatalogItem;
  tagsStable: Tag[];
  onOpenStore: () => void;
}) {
  const img = toImageProxyUrl(item.imagenUrl);
  const soldOut = item.tipo === "inventariable" && item.stockAtLocation <= 0;
  const ratingSafe = typeof item.rating === "number" && Number.isFinite(item.rating) ? item.rating : 4.6;
  const reviewsSafe =
    typeof item.reviewCount === "number" && Number.isFinite(item.reviewCount) ? Math.max(0, Math.round(item.reviewCount)) : 120;
  const labels = tagLabelsForProduct(item, tagsStable);
  const badges = labels
    .map((t) => t.toLowerCase())
    .slice(0, 6)
    .join(" ");
  const isTop = badges.includes("top") || badges.includes("más vendido") || badges.includes("mas vendido");
  const isDeal = badges.includes("oferta") || badges.includes("promo");

  return (
    <article className="cx-mp-card">
      <div className="cx-mp-card__img">
        {img ? (
          <Image src={img} alt={item.name} width={520} height={420} />
        ) : (
          <div className="cx-mp-card__imgPh">
            <Icon name="image" />
          </div>
        )}

        <div className="cx-mp-card__badges" aria-label="Badges">
          {isTop ? <span className="cx-badge cx-badge--top">TOP VENTAS</span> : null}
          {isDeal ? <span className="cx-badge cx-badge--deal">OFERTA</span> : null}
        </div>

        {item.locationId != null ? <MkFav locationId={item.locationId} productId={item.id} /> : null}
      </div>

      <div className="cx-mp-card__body">
        <div className="cx-mp-card__priceRow">
          <PriceText value={item.precio} className="cx-mp-card__price" />
          {!soldOut ? <span className="cx-mp-card__ship">Llega hoy</span> : null}
        </div>

        <h3 className="cx-mp-card__title" title={item.name}>
          {item.name}
        </h3>

        {item.locationName ? (
          <p className="cx-mp-card__brand" title={item.locationName}>
            {item.locationName}
          </p>
        ) : null}

        <RatingStars value={ratingSafe} reviews={reviewsSafe.toLocaleString("es-US")} />

        {!soldOut ? (
          <p className="cx-mp-card__stock cx-mp-card__stock--ok">En stock disponible</p>
        ) : (
          <p className="cx-mp-card__stock cx-mp-card__stock--err">Sin stock</p>
        )}

        <CxButton
          variant="primary"
          size="md"
          iconName="shopping_cart"
          className="cx-mp-card__cta"
          disabled={soldOut}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onOpenStore();
          }}
        >
          Agregar al carrito
        </CxButton>
      </div>
    </article>
  );
}

export default function CatalogProductsPage() {
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
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [ratingMin, setRatingMin] = useState(0);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

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
    if (onlyInStock) list = list.filter((p) => p.tipo === "elaborado" || p.stockAtLocation > 0);
    if (ratingMin > 0) {
      list = list.filter((p) => (typeof p.rating === "number" ? p.rating : 4.4) >= ratingMin);
    }
    return list;
  }, [filteredBySearch, onlyInStock, ratingMin, selectedTag, tagsStable]);

  const errorInfo = getRtkErrorInfo(error);
  const total = data?.pagination?.total ?? filtered.length;

  const patchQ = useCallback(
    (q: string) => {
      const sp = new URLSearchParams(searchParams.toString());
      if (q.trim()) sp.set("q", q.trim());
      else sp.delete("q");
      const qs = sp.toString();
      router.replace(qs ? `/catalog/productos?${qs}` : "/catalog/productos", { scroll: false });
    },
    [router, searchParams],
  );

  const goToStore = useCallback(
    (locationId: number | null, locationName: string | null) => {
      if (locationId == null || !locationName) return;
      router.push(buildLocationCatalogPath({ id: locationId, name: locationName }));
    },
    [router],
  );

  return (
    <div className="cx-mp-page">
      <div className="cx-mp-shell">
        <header className="cx-mp-head">
          <div>
            <h1 className="cx-mp-head__title">Resultados de Búsqueda</h1>
            <p className="cx-mp-head__sub">
              Mostrando {filtered.length ? `1-${Math.min(filtered.length, 12)}` : "0"} de{" "}
              {total.toLocaleString("es-US")} productos encontrados
            </p>
          </div>

          <form
            className="cx-mp-search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              patchQ(search);
            }}
          >
            <Icon name="search" />
            <input
              className="cx-mp-search__input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Busca por producto, marca o categoría..."
              aria-label="Buscar productos"
            />
            <CxButton type="submit" variant="primary" size="md">
              Buscar
            </CxButton>
          </form>
        </header>

        <div className="cx-mp-layout">
          <aside className="cx-mp-filters" aria-label="Filtros de búsqueda">
            <div className="cx-mp-filters__title">Filtros de Búsqueda</div>

            <div className="cx-mp-group">
              <div className="cx-mp-group__label">Categoría</div>
              <div className="cx-mp-catList" role="group" aria-label="Categorías">
                <button
                  type="button"
                  className={`cx-mp-cat${selectedTag == null ? " cx-mp-cat--active" : ""}`}
                  onClick={() => setSelectedTag(null)}
                >
                  Todas
                </button>
                {tagsWithCount.slice(0, 4).map((t) => (
                  <button
                    key={t.slug}
                    type="button"
                    className={`cx-mp-cat${selectedTag === t.slug ? " cx-mp-cat--active" : ""}`}
                    onClick={() => setSelectedTag(t.slug)}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="cx-mp-group">
              <div className="cx-mp-group__label">Valoración</div>
              <button
                type="button"
                className={`cx-mp-ratingLine${ratingMin === 4 ? " cx-mp-ratingLine--active" : ""}`}
                onClick={() => setRatingMin((v) => (v === 4 ? 0 : 4))}
              >
                <span className="cx-mp-ratingStars" aria-hidden>
                  ★★★★☆
                </span>
                <span>&nbsp;&amp; más</span>
              </button>
            </div>

            <div className="cx-mp-divider" aria-hidden />

            <CxSwitch checked={onlyInStock} onChange={setOnlyInStock} label="En Stock" />
          </aside>

          <section className="cx-mp-results" aria-label="Resultados">
            {isError ? (
              <EmptyState
                icon={<Icon name="cloud_off" />}
                message={errorInfo.message ?? "No se pudo cargar el marketplace. Intenta nuevamente."}
                action={
                  <CxButton type="button" variant="outline" iconName="refresh" onClick={() => refetch()}>
                    Reintentar
                  </CxButton>
                }
              />
            ) : null}

            {!isLoading && !filtered.length && !isError ? (
              <EmptyState
                icon={<Icon name="search_off" />}
                message="Sin resultados. Prueba con otros filtros o una búsqueda distinta."
                compact
                action={
                  <CxButton
                    type="button"
                    variant="outline"
                    iconName="restart_alt"
                    onClick={() => {
                      setSelectedTag(null);
                      setOnlyInStock(false);
                      setRatingMin(0);
                      setSearch("");
                      patchQ("");
                    }}
                  >
                    Limpiar
                  </CxButton>
                }
              />
            ) : null}

            <div className="cx-mp-grid" aria-busy={isLoading || isFetching}>
              {filtered.map((item) => (
                <ProductCard
                  key={`${item.id}-${item.locationId ?? "x"}`}
                  item={item}
                  tagsStable={tagsStable}
                  onOpenStore={() => goToStore(item.locationId, item.locationName)}
                />
              ))}
            </div>

            <div className="cx-mp-more">
              <CxButton
                type="button"
                variant="outline"
                iconName="add"
                disabled={isFetching || !data?.pagination || page >= (data.pagination.totalPages ?? 1)}
                onClick={() => setPage((p) => p + 1)}
              >
                Ver más resultados
              </CxButton>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

