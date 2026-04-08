"use client";

import { createElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import {
  QUERY_POLLING_OPTIONS,
  useGetBusinessCategoriesQuery,
  useGetPublicLocationsQuery,
  useGetAllPublicProductsQuery,
} from "./_service/catalogApi";
import { useFuseSearch } from "@/hooks/useFuseSearch";
import type { PublicLocation, PublicCatalogItem } from "@/lib/dashboard-types";
import { toImageProxyUrl } from "@/lib/image";
import { buildLocationCatalogPath } from "@/lib/location-path";
import { getBusinessCategoryLucideIcon } from "@/utils/businessCategoryIcons";
import { getPromotionBadgeLabel } from "@/lib/catalog-promotion";
import AllProductsView from "./AllProductsView";
import { useCatalogCtx } from "./layout";
import { EmptyState } from "@/components/ui/EmptyState";
import { getRtkErrorInfo } from "@/lib/rtk-error";
import { buildCatalogZoneHref } from "@/app/lib/landing-zones";
import {
  filterByRadiusKm,
  filterOpenOnly,
  sortLocations,
  distanceToStoreKm,
} from "@/app/catalog/lib/directory-filters";
import {
  parseSortParam,
  parseVistaParam,
  parseOpenOnlyParam,
  parseRadiusKmParam,
  sortUrlToLabel,
  type DirectorySortUrl,
  type DirectoryVistaUrl,
} from "@/app/catalog/lib/directory-url";
import { StoreCard } from "@/app/catalog/_components/directory/StoreCard";
import {
  DirectoryFiltersForm,
  type DirectoryCategoryItem,
} from "@/app/catalog/_components/directory/DirectoryFiltersForm";

type PublicLocationSearch = PublicLocation & { _bizSearch: string };

type DirBizCatItem = DirectoryCategoryItem;

type MunicipioGroup = { municipality: string; locations: PublicLocation[] };
type ProvinciaGroup = { province: string; municipios: MunicipioGroup[] };

function isExcludedDirectoryLocation(loc: PublicLocation): boolean {
  const name = (loc.name ?? "").trim().toLowerCase();
  const org = (loc.organizationName ?? "").trim().toLowerCase();
  if (name === "almacén principal" || name === "almacen principal") return true;
  if (org === "organización principal" || org === "organizacion principal") return true;
  return false;
}

function hasZoneData(loc: PublicLocation): boolean {
  return !!(loc.province?.trim() || loc.municipality?.trim());
}

function groupByProvinceMunicipality(locations: PublicLocation[]): ProvinciaGroup[] {
  const provinceMap = new Map<string, Map<string, PublicLocation[]>>();

  for (const loc of locations) {
    const p = (loc.province ?? "").trim() || "Sin provincia";
    const m = (loc.municipality ?? "").trim() || "Sin municipio";
    if (!provinceMap.has(p)) provinceMap.set(p, new Map());
    const mMap = provinceMap.get(p)!;
    if (!mMap.has(m)) mMap.set(m, []);
    mMap.get(m)!.push(loc);
  }

  const provinces = [...provinceMap.keys()].sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));

  return provinces.map((province) => {
    const mMap = provinceMap.get(province)!;
    const municipios = [...mMap.keys()]
      .sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }))
      .map((municipality) => ({
        municipality,
        locations: mMap.get(municipality)!,
      }));
    return { province, municipios };
  });
}

function zoneLine(loc: PublicLocation): string | null {
  const m = (loc.municipality ?? "").trim();
  const p = (loc.province ?? "").trim();
  if (!m && !p) return null;
  if (m && p) return `${m}, ${p}`;
  return m || p;
}

function DirGridSkeleton() {
  return (
    <div className="sp-grid dir-mp-grid--skeleton" aria-busy="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="dir-mp-skeleton-card" />
      ))}
    </div>
  );
}

function DirZonesSkeleton() {
  return (
    <div className="dir-tiendas-skeleton" aria-busy="true">
      {[0, 1].map((i) => (
        <div key={i} className="dir-tiendas-skeleton__prov">
          <div className="dir-tiendas-skeleton__prov-head" />
          <div className="dir-tiendas-skeleton__muni-label" />
          <div className="dir-zone-card-row dir-zone-card-row--skeleton">
            {[0, 1, 2, 3].map((j) => (
              <div key={j} className="dir-tiendas-skeleton__card" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TiendasEmptyIllustration() {
  return (
    <div className="dir-tiendas-empty__art" aria-hidden>
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="dir-tiendas-empty__svg">
        <circle cx="60" cy="60" r="52" fill="#F1F5F9" />
        <path
          d="M38 52h44v36H38V52zm6-14h32l4 14H40l4-14z"
          stroke="#94A3B8"
          strokeWidth="2.5"
          strokeLinejoin="round"
          fill="#fff"
        />
        <circle cx="60" cy="72" r="6" fill="#CBD5E1" />
        <path d="M44 44h32" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function CatalogLocationsPage() {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    document.body.classList.add("page-catalog-directory");
    return () => document.body.classList.remove("page-catalog-directory");
  }, []);
  const router = useRouter();
  const tab = searchParams.get("tab") ?? "tiendas";
  const zonaProvincia = searchParams.get("provincia")?.trim() ?? "";
  const zonaMunicipio = searchParams.get("municipio")?.trim() ?? "";
  const categorySlug = searchParams.get("category")?.trim() ?? "";

  const sortKey = parseSortParam(searchParams.get("orden"));
  const vista = parseVistaParam(searchParams.get("vista"));
  const openOnly = parseOpenOnlyParam(searchParams.get("abierto"));
  const radiusKm = parseRadiusKmParam(searchParams.get("radio"));

  const { data: locations, isLoading, isError, error, refetch } = useGetPublicLocationsQuery(
    undefined,
    QUERY_POLLING_OPTIONS.general,
  );
  const { data: businessCategories = [] } = useGetBusinessCategoriesQuery(
    undefined,
    QUERY_POLLING_OPTIONS.general,
  );
  const { search, setSearch } = useCatalogCtx();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mobSearchOpen, setMobSearchOpen] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  const patchParams = useCallback(
    (patch: Record<string, string | null | undefined>) => {
      const sp = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v == null || v === "") sp.delete(k);
        else sp.set(k, v);
      }
      if (!sp.get("tab")) sp.set("tab", "tiendas");
      router.replace(`/catalog?${sp.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => setUserCoords(null),
      { enableHighAccuracy: false, maximumAge: 300_000, timeout: 10_000 },
    );
  }, []);

  const resolveLocationBizName = useCallback(
    (loc: PublicLocation): string | null => {
      if (loc.businessCategoryName?.trim()) return loc.businessCategoryName.trim();
      if (loc.businessCategoryId == null) return null;
      const c = businessCategories.find((x) => x.id === loc.businessCategoryId);
      return c?.name ?? null;
    },
    [businessCategories],
  );

  const prepared = useMemo(() => {
    if (!locations) return { base: [] as PublicLocation[], forSearch: [] as PublicLocationSearch[] };
    let base = locations.filter((loc) => !isExcludedDirectoryLocation(loc) && hasZoneData(loc));
    if (zonaProvincia) {
      base = base.filter((loc) => (loc.province ?? "").trim() === zonaProvincia);
    }
    if (zonaMunicipio) {
      base = base.filter((loc) => (loc.municipality ?? "").trim() === zonaMunicipio);
    }
    const forSearch: PublicLocationSearch[] = base.map((loc) => ({
      ...loc,
      _bizSearch: resolveLocationBizName(loc) ?? "",
    }));
    return { base, forSearch };
  }, [locations, zonaProvincia, zonaMunicipio, resolveLocationBizName]);

  const fuseFiltered = useFuseSearch(
    prepared.forSearch,
    [
      { name: "name" as const, weight: 0.45 },
      { name: "_bizSearch" as const, weight: 0.45 },
      { name: "province" as const, weight: 0.05 },
      { name: "municipality" as const, weight: 0.05 },
    ],
    search,
  );

  const activeBizCategoryId = useMemo(() => {
    if (!categorySlug) return null;
    const match = businessCategories.find((c) => c.slug === categorySlug);
    return match?.id ?? null;
  }, [categorySlug, businessCategories]);

  const activeBizCategoryLabel = useMemo(() => {
    if (!categorySlug) return null;
    return businessCategories.find((c) => c.slug === categorySlug)?.name ?? null;
  }, [categorySlug, businessCategories]);

  const activeDirBizKey = activeBizCategoryId != null ? String(activeBizCategoryId) : "todos";

  const dirBizCategoryItems: DirBizCatItem[] = useMemo(() => {
    const sorted = [...businessCategories].sort((a, b) =>
      a.name.localeCompare(b.name, "es", { sensitivity: "base" }),
    );
    return [
      { key: "todos", name: "Todas las categorías", slug: "" },
      ...sorted.map((c) => ({ key: String(c.id), name: c.name, slug: c.slug })),
    ];
  }, [businessCategories]);

  const selectDirBizCategory = useCallback(
    (item: DirBizCatItem) => {
      const sp = new URLSearchParams(searchParams.toString());
      if (item.key === "todos" || !item.slug) sp.delete("category");
      else sp.set("category", item.slug);
      if (!sp.get("tab")) sp.set("tab", "tiendas");
      router.replace(`/catalog?${sp.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const directoryList = useMemo(() => {
    let list: PublicLocation[] = [...fuseFiltered];
    if (activeBizCategoryId != null) {
      list = list.filter((loc) => loc.businessCategoryId === activeBizCategoryId);
    }
    if (openOnly) list = filterOpenOnly(list);
    list = filterByRadiusKm(list, radiusKm, userCoords);
    const sortLabel = sortUrlToLabel(sortKey);
    return sortLocations(list, sortLabel, userCoords);
  }, [fuseFiltered, activeBizCategoryId, openOnly, radiusKm, sortKey, userCoords]);

  const groupedZones = useMemo(() => groupByProvinceMunicipality(directoryList), [directoryList]);

  const trendingLocations = useMemo(() => {
    if (!locations) return [];
    return [...locations]
      .filter((l) => !isExcludedDirectoryLocation(l) && hasZoneData(l))
      .sort((a, b) => (b.productCount ?? 0) - (a.productCount ?? 0))
      .slice(0, 12);
  }, [locations]);

  const { data: allProductsData } = useGetAllPublicProductsQuery(
    { page: 1, pageSize: 50 },
    QUERY_POLLING_OPTIONS.general,
  );

  const promoProductsByProvince = useMemo(() => {
    if (!allProductsData?.data || !locations) return new Map<string, PublicCatalogItem[]>();
    const promos = allProductsData.data.filter((p) => p.hasActivePromotion);
    const locMap = new Map<number, PublicLocation>();
    for (const l of locations) locMap.set(l.id, l);
    const byProv = new Map<string, PublicCatalogItem[]>();
    for (const p of promos) {
      if (p.locationId == null) continue;
      const loc = locMap.get(p.locationId);
      if (!loc) continue;
      const prov = (loc.province ?? "").trim();
      if (!prov) continue;
      const arr = byProv.get(prov) ?? [];
      if (arr.length < 4) arr.push(p);
      byProv.set(prov, arr);
    }
    return byProv;
  }, [allProductsData, locations]);

  const geoAvailable = userCoords != null;

  const onSortChange = useCallback(
    (k: DirectorySortUrl) => {
      patchParams({ orden: k === "cercanos" ? null : k });
    },
    [patchParams],
  );

  const onOpenOnlyChange = useCallback(
    (v: boolean) => {
      patchParams({ abierto: v ? "1" : null });
    },
    [patchParams],
  );

  const onRadiusKmChange = useCallback(
    (km: 0 | 3 | 5 | 10) => {
      patchParams({ radio: km === 0 ? null : String(km) });
    },
    [patchParams],
  );

  const onVistaChange = useCallback(
    (v: DirectoryVistaUrl) => {
      patchParams({ vista: v === "grid" ? null : "zonas" });
    },
    [patchParams],
  );

  const clearClientFilters = useCallback(() => {
    patchParams({ abierto: null, radio: null, category: null });
  }, [patchParams]);

  useEffect(() => {
    if (!filtersOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFiltersOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filtersOpen]);

  const clearSearch = useCallback(() => setSearch(""), [setSearch]);

  const focusSearch = useCallback(() => {
    searchInputRef.current?.focus();
    searchInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const showTiendas = tab === "tiendas";
  const errorInfo = getRtkErrorInfo(error);

  const hideProvinciaVerTodas = zonaProvincia.length > 0 && zonaMunicipio.length === 0;
  const hasActiveFilters = openOnly || radiusKm > 0 || !!categorySlug;

  if (showTiendas) {
    return (
      <>
      {/* Mobile-only: pill search header (YerroMenu style) */}
      <div className="dir-mob-header">
        {mobSearchOpen ? (
          <div className="dir-mob-header__search-row">
            <div className="dir-mob-header__search-box">
              <Icon name="search" />
              <input
                ref={searchInputRef}
                type="search"
                className="dir-mob-header__search-input"
                placeholder="Buscar productos o tiendas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                onBlur={() => { if (!search) setMobSearchOpen(false); }}
              />
              {search ? (
                <button
                  type="button"
                  className="dir-mob-header__search-clear"
                  onClick={() => { setSearch(""); searchInputRef.current?.focus(); }}
                  aria-label="Limpiar"
                >
                  <Icon name="close" />
                </button>
              ) : null}
            </div>
            <button
              type="button"
              className="dir-mob-header__search-cancel"
              onClick={() => { setMobSearchOpen(false); setSearch(""); }}
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button type="button" className="dir-mob-header__pill" onClick={() => setMobSearchOpen(true)}>
            <span className="dir-mob-header__pill-icon"><Icon name="storefront" /></span>
            <span className="dir-mob-header__pill-text">
              <span className="dir-mob-header__pill-title">Catálogos</span>
              <span className="dir-mob-header__pill-sub">Tu Cuadre</span>
            </span>
            <span className="dir-mob-header__pill-search"><Icon name="search" /></span>
          </button>
        )}
      </div>

      {/* Mobile-only icon category tabs */}
      <nav className="dir-cat-tabs" aria-label="Categorías de negocio">
        {dirBizCategoryItems.map((item) => {
          const CatIcon = getBusinessCategoryLucideIcon(
            item.key === "todos" ? null : item.name,
          );
          return (
            <button
              key={item.key}
              type="button"
              className={`dir-cat-tab${activeDirBizKey === item.key ? " dir-cat-tab--active" : ""}`}
              onClick={() => selectDirBizCategory(item)}
            >
              <span className="dir-cat-tab__icon">
                {item.key === "todos" ? (
                  <Icon name="apps" />
                ) : (
                  createElement(CatIcon, { size: 28, strokeWidth: 1.5, "aria-hidden": true })
                )}
              </span>
              {item.key === "todos" ? "Todos" : item.name}
            </button>
          );
        })}
      </nav>

      <div className="sp-layout">
            <aside className="sp-sidebar" aria-label="Filtros del directorio">
              <div className="dir-mp-sidebar">
                <p className="dir-mp-sidebar__title">Filtros</p>
                <DirectoryFiltersForm
                  showSort
                  sortKey={sortKey}
                  onSortChange={onSortChange}
                  categories={dirBizCategoryItems}
                  activeCategoryKey={activeDirBizKey}
                  onSelectCategory={selectDirBizCategory}
                  openOnly={openOnly}
                  onOpenOnlyChange={onOpenOnlyChange}
                  radiusKm={radiusKm}
                  onRadiusKmChange={onRadiusKmChange}
                  vista={vista}
                  onVistaChange={onVistaChange}
                  geoAvailable={geoAvailable}
                />
                {hasActiveFilters ? (
                  <button type="button" className="dir-mp-clear" onClick={clearClientFilters}>
                    Limpiar filtros
                  </button>
                ) : null}
              </div>
            </aside>

            <main className="sp-main">
              <div className="sp-catalog-header">
                <div className="sp-catalog-title-wrap">
                  <h1 className="sp-catalog-title">Tiendas locales</h1>
                  <p className="sp-catalog-subtitle">
                    Busca por nombre o categoría; filtra y ordena desde el panel.
                  </p>
                </div>
                <div className="sp-catalog-search-wrap sp-catalog-search-wrap--full">
                  <div className="sp-catalog-search-row">
                    <div className="sp-catalog-search-box">
                      <Icon name="search" />
                      <input
                        ref={searchInputRef}
                        type="search"
                        className="sp-catalog-search"
                        placeholder="Buscar tiendas por nombre o categoría..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        aria-label="Buscar tiendas por nombre o categoría"
                      />
                    </div>
                    <button
                      type="button"
                      className="dir-tiendas-filters-trigger dir-tiendas-filters-trigger--mobile-only"
                      aria-expanded={filtersOpen}
                      aria-controls="dir-tiendas-filters-panel"
                      onClick={() => setFiltersOpen(true)}
                    >
                      <Icon name="filter_list" />
                      Filtros
                    </button>
                  </div>
                </div>
              </div>

              {!isLoading && !isError && prepared.base.length > 0 ? (
                <div
                  className="dir-tiendas-results-bar"
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <p className="dir-tiendas-results-bar__count">
                    {directoryList.length === 1
                      ? "1 tienda encontrada"
                      : `${directoryList.length} tiendas encontradas`}
                  </p>
                  {activeBizCategoryLabel ? (
                    <p className="dir-tiendas-results-bar__scope">
                      Categoría del comercio: <strong>{activeBizCategoryLabel}</strong>
                    </p>
                  ) : null}
                </div>
              ) : null}

              {/* Mobile-only: filtered category list (stacked cards) */}
              {!isLoading && !isError && categorySlug && directoryList.length > 0 ? (
                <div className="dir-cat-results">
                  <p className="dir-cat-results__suptitle">Negocios en</p>
                  <p className="dir-cat-results__title">{activeBizCategoryLabel}</p>
                  <div className="dir-cat-results__list">
                    {directoryList.map((loc) => (
                      <StoreCard
                        key={loc.id}
                        loc={loc}
                        businessCategoryDisplay={resolveLocationBizName(loc)}
                        distanceKm={userCoords ? distanceToStoreKm(loc, userCoords) : null}
                        zoneLabel={zoneLine(loc)}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Mobile-only trending section */}
              {!isLoading && !isError && !categorySlug && trendingLocations.length > 0 ? (
                <div className="dir-trending">
                  <p className="dir-trending__suptitle">Negocios en</p>
                  <p className="dir-trending__title">Tendencia</p>
                  <div className="dir-trending__scroll">
                    {trendingLocations.map((tLoc) => {
                      const photo = toImageProxyUrl(tLoc.photoUrl);
                      return (
                        <Link key={tLoc.id} href={buildLocationCatalogPath(tLoc)} className="dir-trending__item">
                          {photo ? (
                            <Image src={photo} alt={tLoc.name} width={88} height={88} className="dir-trending__avatar" />
                          ) : (
                            <span className="dir-trending__avatar-placeholder"><Icon name="storefront" /></span>
                          )}
                          <span className="dir-trending__name">
                            {tLoc.name}
                            {tLoc.isVerified && <Icon name="verified" className="dir-trending__verified" />}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className={`dir-tiendas-zones${vista === "grid" ? " dir-tiendas-zones--grid-mode" : ""}${categorySlug ? " dir-tiendas-zones--filtered" : ""}`}>
                {isLoading && (vista === "grid" ? <DirGridSkeleton /> : <DirZonesSkeleton />)}

                {isError && (
                  <EmptyState
                    icon={<Icon name="wifi_off" />}
                    message={`${errorInfo.title}: ${errorInfo.message}`}
                    action={
                      errorInfo.retryable ? (
                        <button type="button" className="store-empty__btn" onClick={refetch}>
                          <Icon name="refresh" /> Reintentar
                        </button>
                      ) : null
                    }
                  />
                )}

                {!isLoading && !isError && locations && locations.length === 0 && (
                  <EmptyState icon={<Icon name="store" />} message="No hay locales disponibles" />
                )}

                {!isLoading &&
                  !isError &&
                  locations &&
                  locations.length > 0 &&
                  prepared.base.length === 0 && (
                    <EmptyState icon={<Icon name="store" />} message="No hay tiendas para mostrar en esta vista." />
                  )}

                {!isLoading &&
                  !isError &&
                  prepared.base.length > 0 &&
                  directoryList.length === 0 && (
                    <div className="dir-tiendas-empty">
                      <TiendasEmptyIllustration />
                      <p className="dir-tiendas-empty__title">No encontramos tiendas con estos filtros</p>
                      <p className="dir-tiendas-empty__hint">
                        Prueba ampliar la distancia, quitar &quot;Solo abiertas&quot; o limpiar filtros.
                      </p>
                      {search.trim() ? (
                        <button type="button" className="dir-tiendas-empty__clear" onClick={clearSearch}>
                          Limpiar búsqueda
                        </button>
                      ) : null}
                      {hasActiveFilters ? (
                        <button type="button" className="dir-tiendas-empty__clear" onClick={clearClientFilters}>
                          Quitar filtros
                        </button>
                      ) : null}
                    </div>
                  )}

                {!isLoading && !isError && vista === "grid" && directoryList.length > 0 && (
                  <div className="sp-grid">
                    {directoryList.map((loc) => (
                      <StoreCard
                        key={loc.id}
                        loc={loc}
                        businessCategoryDisplay={resolveLocationBizName(loc)}
                        distanceKm={userCoords ? distanceToStoreKm(loc, userCoords) : null}
                        zoneLabel={zoneLine(loc)}
                      />
                    ))}
                  </div>
                )}

                {!isLoading && !isError && vista === "zonas" && groupedZones.length > 0 && (
                  <div className="dir-tiendas-zones__inner">
                    {groupedZones.map(({ province, municipios }, provIdx) => {
                      const promos = promoProductsByProvince.get(province) ?? [];
                      return (
                        <section key={province} className="dir-zone-provincia">
                          {/* Mobile-only zone hero card */}
                          {provIdx > 0 ? (
                            <Link
                              href={buildCatalogZoneHref(province, null)}
                              className="dir-zone-hero"
                            >
                              <div className="dir-zone-hero__bg" />
                              <div className="dir-zone-hero__overlay">
                                <h3 className="dir-zone-hero__title">{province}</h3>
                                <span className="dir-zone-hero__cta">
                                  Explorar <Icon name="arrow_forward" />
                                </span>
                              </div>
                            </Link>
                          ) : null}

                          <div className="dir-zone-provincia__head">
                            <div className="dir-zone-provincia__title-col">
                              <span className="dir-zone-provincia__suptitle">Negocios en</span>
                              <h2 className="dir-zone-provincia__title">{province}</h2>
                            </div>
                            {!hideProvinciaVerTodas ? (
                              <Link href={buildCatalogZoneHref(province, null)} className="dir-zone-provincia__link">
                                Ver todas →
                              </Link>
                            ) : null}
                          </div>
                          <div className="dir-zone-provincia__divider" aria-hidden />

                          {municipios.map(({ municipality, locations: locs }) => (
                            <div key={`${province}::${municipality}`} className="dir-zone-municipio">
                              <h3 className="dir-zone-municipio__label">{municipality}</h3>
                              <div className="dir-zone-card-row">
                                {locs.map((loc) => (
                                  <StoreCard
                                    key={loc.id}
                                    loc={loc}
                                    businessCategoryDisplay={resolveLocationBizName(loc)}
                                    distanceKm={userCoords ? distanceToStoreKm(loc, userCoords) : null}
                                    zoneLabel={null}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}

                          {/* Mobile-only rebajas for this province */}
                          {promos.length > 0 ? (
                            <div className="dir-rebajas">
                              <p className="dir-rebajas__suptitle">Domicilio en</p>
                              <p className="dir-rebajas__title">{province}</p>
                              <div className="dir-rebajas__grid">
                                {promos.map((p) => {
                                  const pImg = toImageProxyUrl(p.imagenUrl);
                                  const badge = getPromotionBadgeLabel(p);
                                  return (
                                    <Link
                                      key={p.id}
                                      href={p.locationId != null ? buildLocationCatalogPath({ id: p.locationId, name: p.locationName ?? "" }) : "/catalog"}
                                      className="dir-rebajas__card"
                                    >
                                      {pImg ? (
                                        <Image src={pImg} alt={p.name} width={240} height={240} className="dir-rebajas__card-img" />
                                      ) : (
                                        <div className="dir-rebajas__card-placeholder"><Icon name="inventory_2" /></div>
                                      )}
                                      <div className="dir-rebajas__card-overlay">
                                        <span className="dir-rebajas__card-name">{p.name}</span>
                                        <span className="dir-rebajas__card-price">${p.precio.toLocaleString()}</span>
                                      </div>
                                      {badge ? <span className="dir-rebajas__card-badge">{badge}</span> : null}
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          ) : null}
                        </section>
                      );
                    })}
                  </div>
                )}
              </div>
            </main>
      </div>

        <div className="dir-mp-mobile-bar" role="toolbar" aria-label="Acciones del directorio">
          <button type="button" className="dir-mp-mobile-bar__btn" onClick={focusSearch}>
            <Icon name="search" />
            Buscar
          </button>
          <button
            type="button"
            className="dir-mp-mobile-bar__btn dir-mp-mobile-bar__btn--primary"
            aria-expanded={filtersOpen}
            aria-controls="dir-tiendas-filters-panel"
            onClick={() => setFiltersOpen(true)}
          >
            <Icon name="filter_list" />
            Filtros
          </button>
        </div>

        {filtersOpen ? (
          <>
            <button
              type="button"
              className="dir-tiendas-filters-backdrop"
              aria-label="Cerrar filtros"
              onClick={() => setFiltersOpen(false)}
            />
            <div
              id="dir-tiendas-filters-panel"
              className="dir-tiendas-filters-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="dir-tiendas-filters-title"
            >
              <div className="dir-tiendas-filters-panel__head">
                <h2 id="dir-tiendas-filters-title" className="dir-tiendas-filters-panel__title">
                  Filtros
                </h2>
                <button
                  type="button"
                  className="dir-tiendas-filters-panel__close"
                  onClick={() => setFiltersOpen(false)}
                  aria-label="Cerrar"
                >
                  <Icon name="close" />
                </button>
              </div>
              <div className="dir-tiendas-filters-panel__body">
                <DirectoryFiltersForm
                  showSort
                  sortKey={sortKey}
                  onSortChange={(k) => {
                    onSortChange(k);
                    setFiltersOpen(false);
                  }}
                  categories={dirBizCategoryItems}
                  activeCategoryKey={activeDirBizKey}
                  onSelectCategory={(item) => {
                    selectDirBizCategory(item);
                    setFiltersOpen(false);
                  }}
                  openOnly={openOnly}
                  onOpenOnlyChange={onOpenOnlyChange}
                  radiusKm={radiusKm}
                  onRadiusKmChange={onRadiusKmChange}
                  vista={vista}
                  onVistaChange={onVistaChange}
                  geoAvailable={geoAvailable}
                />
                {hasActiveFilters ? (
                  <button
                    type="button"
                    className="dir-mp-clear"
                    onClick={() => {
                      clearClientFilters();
                      setFiltersOpen(false);
                    }}
                  >
                    Limpiar filtros
                  </button>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </>
    );
  }

  return <AllProductsView />;
}
