"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import {
  QUERY_POLLING_OPTIONS,
  useGetBusinessCategoriesQuery,
  useGetPublicLocationsQuery,
} from "./_service/catalogApi";
import { useFuseSearch } from "@/hooks/useFuseSearch";
import type { PublicLocation } from "@/lib/dashboard-types";
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
    <div className="dir-mp-grid dir-mp-grid--skeleton" aria-busy="true">
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
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Compat: links viejos /catalog?tab=productos -> /catalog/productos (preserva q si existe).
  useEffect(() => {
    if (tab !== "productos") return;
    const q = searchParams.get("q")?.trim() ?? "";
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    const qs = sp.toString();
    router.replace(qs ? `/catalog/productos?${qs}` : "/catalog/productos");
  }, [router, searchParams, tab]);

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
      <div className="dir-page dir-mp">
        <div className="dir-tiendas-sticky dir-tiendas-sticky--minimal">
          <header className="dir-hero-minimal">
            <div className="dir-shell">
              <h1 className="dir-hero-minimal__title">Tiendas locales</h1>
              <p className="dir-hero-minimal__lead">Busca por nombre o categoría; filtra y ordena desde el panel.</p>
              <div className="dir-hero-minimal__search-row">
                <div className="dir-tiendas-search">
                  <Icon name="search" />
                  <input
                    ref={searchInputRef}
                    type="search"
                    className="dir-tiendas-search__input"
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
          </header>
        </div>

        <div className="dir-shell dir-mp__shell">
          <div className="dir-mp__layout">
            <aside className="dir-mp__sidebar" aria-label="Filtros del directorio">
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

            <div className="dir-mp__main">
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

              <div className={`dir-tiendas-zones${vista === "grid" ? " dir-tiendas-zones--grid-mode" : ""}`}>
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
                  <div className="dir-mp-grid">
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
                    {groupedZones.map(({ province, municipios }) => (
                      <section key={province} className="dir-zone-provincia">
                        <div className="dir-zone-provincia__head">
                          <div className="dir-zone-provincia__title-row">
                            <MapPin className="dir-zone-provincia__pin" size={20} strokeWidth={2} aria-hidden />
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
                      </section>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
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
      </div>
    );
  }

  // Marketplace ahora vive en /catalog/productos
  return null;
}
