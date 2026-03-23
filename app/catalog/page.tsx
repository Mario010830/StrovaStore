"use client";

import { createElement, useCallback, useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { LayoutGrid, MapPin, Store } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import {
  QUERY_POLLING_OPTIONS,
  useGetBusinessCategoriesQuery,
  useGetPublicLocationsQuery,
} from "./_service/catalogApi";
import { useFuseSearch } from "@/hooks/useFuseSearch";
import type { PublicLocation } from "@/lib/dashboard-types";
import AllProductsView from "./AllProductsView";
import { useCatalogCtx } from "./layout";
import { toImageProxyUrl } from "@/lib/image";
import { EmptyState } from "@/components/ui/EmptyState";
import { getRtkErrorInfo } from "@/lib/rtk-error";
import { getBusinessCategoryLucideIcon } from "@/utils/businessCategoryIcons";
import { buildCatalogZoneHref } from "@/app/lib/landing-zones";
import { haversineKm } from "@/lib/geo";

const SORT_OPTIONS = ["Más cercanos", "Más populares", "Nuevos"] as const;

type PublicLocationSearch = PublicLocation & { _bizSearch: string };

type DirBizCatItem = { key: string; name: string; slug: string };

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

function distanceToStoreKm(
  loc: PublicLocation,
  user: { lat: number; lng: number },
): number | null {
  const lat = loc.latitude;
  const lon = loc.longitude;
  if (lat == null || lon == null) return null;
  if (typeof lat !== "number" || typeof lon !== "number") return null;
  return haversineKm(user.lat, user.lng, lat, lon);
}

function sortLocations(
  list: PublicLocation[],
  sort: string,
  userPos: { lat: number; lng: number } | null,
): PublicLocation[] {
  const next = [...list];
  if (sort === "Más cercanos" && userPos) {
    return next.sort((a, b) => {
      const da = distanceToStoreKm(a, userPos);
      const db = distanceToStoreKm(b, userPos);
      if (da != null && db != null) return da - db;
      if (da != null) return -1;
      if (db != null) return 1;
      return (a.name ?? "").localeCompare(b.name ?? "", "es");
    });
  }
  if (sort === "Nuevos") {
    return next.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
  }
  if (sort === "Más populares") {
    return next.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", "es"));
  }
  return next.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", "es"));
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

function formatDistanceKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

function DirectoryCard({
  loc,
  businessCategoryDisplay,
  distanceKm,
}: {
  loc: PublicLocation;
  businessCategoryDisplay: string | null;
  distanceKm: number | null;
}) {
  const hasHours = !!loc.businessHours;
  const showStatus = hasHours && loc.isOpenNow != null;
  const isOpen = loc.isOpenNow === true;
  const proxiedImageUrl = toImageProxyUrl(loc.photoUrl);
  const BizIcon = businessCategoryDisplay
    ? getBusinessCategoryLucideIcon(businessCategoryDisplay)
    : LayoutGrid;

  return (
    <Link href={`/catalog/${loc.id}`} className="dir-store-card">
      <div className="dir-store-card__media">
        {proxiedImageUrl ? (
          <Image
            src={proxiedImageUrl}
            alt={loc.name}
            fill
            className="dir-store-card__img"
            sizes="(max-width: 599px) 160px, 220px"
          />
        ) : (
          <div className="dir-store-card__placeholder">
            <Store className="dir-store-card__placeholder-icon" size={32} strokeWidth={1.5} aria-hidden />
          </div>
        )}
      </div>
      <div className="dir-store-card__body">
        <h3 className="dir-store-card__name">{loc.name}</h3>
        {businessCategoryDisplay ? (
          <div className="dir-store-card__biz">
            {createElement(BizIcon, {
              className: "dir-store-card__biz-icon",
              size: 12,
              strokeWidth: 2,
              "aria-hidden": true,
            })}
            <span className="dir-store-card__biz-label">{businessCategoryDisplay}</span>
          </div>
        ) : null}
        {distanceKm != null ? (
          <p className="dir-store-card__distance">{formatDistanceKm(distanceKm)}</p>
        ) : null}
        <div
          className={`dir-store-card__bottom${showStatus ? "" : " dir-store-card__bottom--solo"}`}
        >
          {showStatus ? (
            <span className="dir-store-card__status">
              <span
                className={`dir-store-card__dot${isOpen ? " dir-store-card__dot--open" : " dir-store-card__dot--closed"}`}
                aria-hidden
              />
              {isOpen ? "Abierto" : "Cerrado"}
            </span>
          ) : null}
          <span className="dir-store-card__cta">Ver tienda →</span>
        </div>
      </div>
    </Link>
  );
}

function DirSkeletons() {
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
  const sortSelectId = useId();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get("tab") ?? "tiendas";
  const zonaProvincia = searchParams.get("provincia")?.trim() ?? "";
  const zonaMunicipio = searchParams.get("municipio")?.trim() ?? "";
  const categorySlug = searchParams.get("category")?.trim() ?? "";

  const { data: locations, isLoading, isError, error, refetch } = useGetPublicLocationsQuery(
    undefined,
    QUERY_POLLING_OPTIONS.general,
  );
  const { data: businessCategories = [] } = useGetBusinessCategoriesQuery(
    undefined,
    QUERY_POLLING_OPTIONS.general,
  );
  const { search, setSearch } = useCatalogCtx();
  const [directorySort, setDirectorySort] = useState<string>("Más cercanos");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

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

  const activeDirBizKey = activeBizCategoryId != null ? String(activeBizCategoryId) : "todos";

  const dirBizCategoryItems: DirBizCatItem[] = useMemo(() => {
    const sorted = [...businessCategories].sort((a, b) =>
      a.name.localeCompare(b.name, "es", { sensitivity: "base" }),
    );
    return [
      { key: "todos", name: "Todos", slug: "" },
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
    return sortLocations(list, directorySort, userCoords);
  }, [fuseFiltered, activeBizCategoryId, directorySort, userCoords]);

  const groupedZones = useMemo(() => groupByProvinceMunicipality(directoryList), [directoryList]);

  useEffect(() => {
    if (!filtersOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFiltersOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filtersOpen]);

  const clearSearch = useCallback(() => setSearch(""), [setSearch]);

  const showTiendas = tab === "tiendas";
  const errorInfo = getRtkErrorInfo(error);

  if (showTiendas) {
    const hideProvinciaVerTodas = zonaProvincia.length > 0 && zonaMunicipio.length === 0;

    return (
      <div className="dir-page dir-page--zones">
        <div className="dir-tiendas-sticky">
          <header className="dir-tiendas-header">
            <div className="landing-shell dir-tiendas-header__shell">
              <div className="dir-tiendas-header__top">
                <div className="dir-tiendas-header__headline">
                  <h1 className="dir-tiendas-title">Tiendas locales en tu ciudad</h1>
                </div>
                <div className="dir-tiendas-header__actions">
                  <div className="dir-tiendas-sort-wrap">
                    <label className="dir-tiendas-sort-label" htmlFor={sortSelectId}>
                      Ordenar listado
                    </label>
                    <select
                      id={sortSelectId}
                      className="dir-tiendas-sort-select"
                      value={directorySort}
                      onChange={(e) => setDirectorySort(e.target.value)}
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
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
              <p className="dir-tiendas-subtitle">
                Descubrí los mejores negocios cerca tuyo y pedí directamente por WhatsApp. El listado se
                agrupa por zona; podés filtrar por rubro y búsqueda.
              </p>
              <div className="dir-tiendas-search">
                <Icon name="search" />
                <input
                  type="search"
                  className="dir-tiendas-search__input"
                  placeholder="Buscar tiendas por nombre o rubro..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Buscar tiendas por nombre o rubro"
                />
              </div>
            </div>
          </header>

          <div className="landing-desktop-category-strip dir-tiendas-cat-strip">
            <div className="landing-shell landing-desktop-category-strip__inner">
              <div className="landing-desktop-categories" role="tablist" aria-label="Categorías de negocio">
                {dirBizCategoryItems.map((item) => {
                  const active = activeDirBizKey === item.key;
                  const LucideIcon =
                    item.key === "todos" ? LayoutGrid : getBusinessCategoryLucideIcon(item.name);
                  return (
                    <button
                      key={item.key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      className={`landing-desktop-cat${active ? " landing-desktop-cat--active" : ""}`}
                      onClick={() => selectDirBizCategory(item)}
                    >
                      <span className="landing-desktop-cat__icon" aria-hidden>
                        <LucideIcon size={16} strokeWidth={2} />
                      </span>
                      <span className="landing-desktop-cat__label">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {!isLoading && !isError && prepared.base.length > 0 ? (
          <div className="landing-shell">
            <div className="dir-tiendas-results-bar" role="status" aria-live="polite">
              <p className="dir-tiendas-results-bar__count">
                {directoryList.length === 1
                  ? "1 tienda encontrada"
                  : `${directoryList.length} tiendas encontradas`}
              </p>
            </div>
          </div>
        ) : null}

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
              <p className="dir-tiendas-filters-panel__section-label">Ordenar por</p>
              <ul className="dir-tiendas-sort-list">
                {SORT_OPTIONS.map((opt) => (
                  <li key={opt}>
                    <button
                      type="button"
                      className={`dir-tiendas-sort-option${directorySort === opt ? " dir-tiendas-sort-option--active" : ""}`}
                      onClick={() => {
                        setDirectorySort(opt);
                        setFiltersOpen(false);
                      }}
                    >
                      {opt}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : null}

        <div className="dir-tiendas-zones">
          {isLoading && <DirSkeletons />}

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
                <p className="dir-tiendas-empty__title">No encontramos tiendas</p>
                {search.trim() ? (
                  <button type="button" className="dir-tiendas-empty__clear" onClick={clearSearch}>
                    Limpiar búsqueda
                  </button>
                ) : null}
              </div>
            )}

          {!isLoading && !isError && groupedZones.length > 0 && (
            <div className="dir-tiendas-zones__inner landing-shell">
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
                          <DirectoryCard
                            key={loc.id}
                            loc={loc}
                            businessCategoryDisplay={resolveLocationBizName(loc)}
                            distanceKm={userCoords ? distanceToStoreKm(loc, userCoords) : null}
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
    );
  }

  return <AllProductsView />;
}
