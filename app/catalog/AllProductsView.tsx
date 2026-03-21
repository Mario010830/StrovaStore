"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
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
  { name: "name" as const, weight: 0.5 },
  { name: "categoryName" as const, weight: 0.25 },
  { name: "description" as const, weight: 0.15 },
  { name: "tags.name" as const, weight: 0.1 },
];

type SortKey = "default" | "price-asc" | "price-desc" | "name-asc" | "name-desc";

const PAGE_SIZE = 50;

function MarketplaceProductCard({
  item,
  onPedir,
}: {
  item: PublicCatalogItem;
  onPedir: () => void;
}) {
  const proxiedImageUrl = toImageProxyUrl(item.imagenUrl);
  return (
    <div
      className="mp-card"
      onClick={onPedir}
      onKeyDown={(e) => e.key === "Enter" && onPedir()}
      role="button"
      tabIndex={0}
    >
      <div className="mp-card__img-wrap">
        {proxiedImageUrl ? (
          <Image src={proxiedImageUrl} alt={item.name} width={480} height={320} />
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
          <PriceText value={item.precio} className="mp-card__price" />
          <IconActionButton
            label="Pedir"
            className="mp-card__pedir"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPedir();
            }}
            icon={<Icon name="chat" />}
          />
        </div>
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
  const [selectedTagSlugs, setSelectedTagSlugs] = useState<string[]>(() => {
    const rawTagParams = searchParams.getAll("tag");
    return rawTagParams
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
      .filter((slug, index, arr) => arr.indexOf(slug) === index);
  });
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [page, setPage] = useState(1);
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
  }, [search, selectedCategory, selectedTagSlugs, priceRange, onlyInStock, sortKey]);

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
    if (!items.length) return;
    let mn = Infinity;
    let mx = -Infinity;
    for (const p of items) {
      if (p.precio < mn) mn = p.precio;
      if (p.precio > mx) mx = p.precio;
    }
    if (!Number.isFinite(mn) || !Number.isFinite(mx)) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPriceRange([Math.floor(mn), Math.ceil(mx)]);
  }, [items]);

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
        <FilterChip
          label="Todos"
          iconName="apps"
          active={selectedTagSlugs.length === 0}
          onClick={() => setSelectedTagSlugs([])}
          className="mp-chip"
          activeClassName="mp-chip--active"
        />
        {tagsWithCount.map((t) => (
          <FilterChip
            key={t.slug}
            label={t.name}
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

    </div>
  );
}