"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useGetPublicLocationsQuery, useGetAllPublicProductsQuery } from "./_service/catalogApi";
import { useFuseSearch } from "@/hooks/useFuseSearch";
import type { PublicLocation } from "@/lib/dashboard-types";
import { useFavorites } from "@/lib/useFavorites";
import { FavoriteButton } from "@/components/FavoriteButton";
import AllProductsView from "./AllProductsView";
import { useCatalogCtx } from "./layout";

const STROVA_BUSINESS_URL = "https://strova.com";

const DIRECTORY_CATEGORIES = [
  { id: "todos", label: "Todos", icon: "apps" },
  { id: "alimentacion", label: "Alimentación", icon: "restaurant" },
  { id: "ferreteria", label: "Ferretería", icon: "build" },
  { id: "libreria", label: "Librería", icon: "menu_book" },
  { id: "hogar", label: "Hogar", icon: "home" },
  { id: "electronica", label: "Electrónica", icon: "devices" },
  { id: "ropa", label: "Ropa", icon: "checkroom" },
] as const;

const SORT_OPTIONS = ["Más cercanos", "Más populares", "Nuevos"] as const;

const PRODUCT_FUSE_KEYS = [
  { name: "name" as const, weight: 0.5 },
  { name: "categoryName" as const, weight: 0.25 },
  { name: "description" as const, weight: 0.15 },
  { name: "tags.name" as const, weight: 0.1 },
];

interface MunicipalityGroup {
  municipality: string;
  locations: PublicLocation[];
}

interface ProvinceGroup {
  province: string;
  municipalities: MunicipalityGroup[];
  totalLocations: number;
}

function groupByProvinceAndMunicipality(locations: PublicLocation[]): ProvinceGroup[] {
  const provinceMap = new Map<string, Map<string, PublicLocation[]>>();

  for (const loc of locations) {
    const prov = loc.province?.trim() || "Sin provincia";
    const muni = loc.municipality?.trim() || "Sin municipio";

    if (!provinceMap.has(prov)) provinceMap.set(prov, new Map());
    const muniMap = provinceMap.get(prov)!;
    if (!muniMap.has(muni)) muniMap.set(muni, []);
    muniMap.get(muni)!.push(loc);
  }

  const groups: ProvinceGroup[] = [];
  for (const [province, muniMap] of provinceMap) {
    const municipalities: MunicipalityGroup[] = [];
    let totalLocations = 0;
    for (const [municipality, locs] of muniMap) {
      municipalities.push({ municipality, locations: locs });
      totalLocations += locs.length;
    }
    municipalities.sort((a, b) => a.municipality.localeCompare(b.municipality));
    groups.push({ province, municipalities, totalLocations });
  }
  groups.sort((a, b) => a.province.localeCompare(b.province));
  return groups;
}

function LocSkeletons() {
  return (
    <div className="loc2-skel-wrap">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="loc2-skel-card" />
      ))}
    </div>
  );
}

function LocationCard({
  loc,
  isFavorite,
  onToggle,
}: {
  loc: PublicLocation;
  isFavorite: boolean;
  onToggle: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const hasHours = !!loc.businessHours;
  const showBadge = hasHours && loc.isOpenNow != null;
  const isOpen = loc.isOpenNow === true;

  const handleFavoriteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onToggle(e);
  };

  const imagePath =
    loc.photoUrl?.replace(
      process.env.NEXT_PUBLIC_TUNNEL_URL ?? "https://dark-boats-feel.loca.lt",
      "",
    ) ?? "";
  const proxiedImageUrl = imagePath ? `/api/image?path=${imagePath}` : null;

  return (
    <Link href={`/catalog/${loc.id}`} className="loc2-card">
      <div className="loc2-card__img">
        {proxiedImageUrl ? (
          <img src={proxiedImageUrl} alt={loc.name} />
        ) : (
          <div className="loc2-card__placeholder">
            <Icon name="storefront" />
          </div>
        )}
        <div className="loc2-card__overlay">
          <div className="loc2-card__overlay-top">
            <FavoriteButton
              active={isFavorite}
              onToggle={handleFavoriteClick}
              ariaAdd="Agregar tienda a favoritos"
              ariaRemove="Quitar tienda de favoritos"
            />
            {showBadge && (
              <div className={`loc2-badge ${isOpen ? "loc2-badge--open" : "loc2-badge--closed"}`}>
                {isOpen && <span className="loc2-badge__dot" />}
                <span>{isOpen ? "Abierto" : "Cerrado"}</span>
              </div>
            )}
          </div>
          <div className="loc2-card__overlay-bottom">
            <h3 className="loc2-card__name">{loc.name}</h3>
            <span className="loc2-card__org">{loc.organizationName}</span>
          </div>
        </div>
      </div>
      <div className="loc2-card__body">
        {loc.description && (
          <p className="loc2-card__desc">{loc.description}</p>
        )}
      </div>
      <div className="loc2-card__footer">
        <span className="loc2-card__cta">Ver productos</span>
        <Icon name="arrow_forward" />
      </div>
    </Link>
  );
}

function DirectoryCard({ loc }: { loc: PublicLocation }) {
  const hasHours = !!loc.businessHours;
  const showBadge = hasHours && loc.isOpenNow != null;
  const isOpen = loc.isOpenNow === true;
  const categoryLine = loc.organizationName || "—";

  const imagePath =
    loc.photoUrl?.replace(
      process.env.NEXT_PUBLIC_TUNNEL_URL ?? "https://dark-boats-feel.loca.lt",
      "",
    ) ?? "";
  const proxiedImageUrl = imagePath ? `/api/image?path=${imagePath}` : null;

  return (
    <Link href={`/catalog/${loc.id}`} className="dir-card">
      <div className="dir-card__img-wrap">
        {proxiedImageUrl ? (
          <img src={proxiedImageUrl} alt={loc.name} />
        ) : (
          <div className="dir-card__placeholder">
            <Icon name="storefront" />
          </div>
        )}
        {showBadge && (
          <div className={`dir-card__badge ${!isOpen ? "dir-card__badge--closed" : ""}`}>
            <span className="dir-card__badge-dot" />
            {isOpen ? "Abierto" : "Cerrado"}
          </div>
        )}
      </div>
      <div className="dir-card__body">
        <h3 className="dir-card__name">{loc.name}</h3>
        <p className="dir-card__category">{categoryLine}</p>
        <div className="dir-card__footer">
          <span className="dir-card__location">
            <Icon name="location_on" />
            — km
          </span>
          <span className="dir-card__cta">Ver tienda</span>
        </div>
      </div>
    </Link>
  );
}

function DirSkeletons() {
  return (
    <div className="dir-grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="dir-card" style={{ pointerEvents: "none", opacity: 0.7 }}>
          <div className="dir-card__img-wrap" />
          <div className="dir-card__body">
            <div className="dir-card__name" style={{ height: 20, background: "#e2e8f0", borderRadius: 4 }} />
            <div className="dir-card__category" style={{ height: 14, background: "#e2e8f0", borderRadius: 4, width: "60%" }} />
            <div className="dir-card__footer" style={{ marginTop: 8 }}>
              <span style={{ height: 14, background: "#e2e8f0", borderRadius: 4, width: 48 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CatalogLocationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "tiendas";

  const { data: locations, isLoading, isError, refetch } = useGetPublicLocationsQuery();
  const { search, setSearch } = useCatalogCtx();
  const [directoryCategory, setDirectoryCategory] = useState<string>("todos");
  const [directorySort, setDirectorySort] = useState<string>("Más cercanos");

  const {
    favoriteLocations,
    toggleFavoriteLocation,
    isFavoriteLocation,
  } = useFavorites();

  const filtered = useFuseSearch(
    locations ?? [],
    [
      { name: "name" as const, weight: 0.5 },
      { name: "organizationName" as const, weight: 0.2 },
      { name: "province" as const, weight: 0.15 },
      { name: "municipality" as const, weight: 0.15 },
    ],
    search,
  );

  const directoryList = useMemo(() => {
    let list = [...filtered];
    if (directoryCategory !== "todos") {
      const term = directoryCategory.toLowerCase();
      list = list.filter(
        (loc) =>
          (loc.organizationName?.toLowerCase() || "").includes(term) ||
          (loc.name?.toLowerCase() || "").includes(term),
      );
    }
    if (directorySort === "Nuevos") {
      list = [...list].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
    } else if (directorySort === "Más populares") {
      list = [...list].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
    } else {
      list = [...list].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
    }
    return list;
  }, [filtered, directoryCategory, directorySort]);

  const locationSuggestions = useMemo(
    () => (search.trim() ? filtered.slice(0, 6) : []),
    [filtered, search],
  );

  const { data: allProductsData } = useGetAllPublicProductsQuery({
    page: 1,
    pageSize: 50,
  });

  const productSuggestions = useFuseSearch(
    allProductsData?.data ?? [],
    PRODUCT_FUSE_KEYS,
    search,
  ).slice(0, 6);

  const favoriteLocationEntities = useMemo(() => {
    if (!locations || favoriteLocations.length === 0) return [];
    const ids = new Set(favoriteLocations);
    return locations.filter((l) => ids.has(String(l.id)));
  }, [locations, favoriteLocations]);

  const groups = useMemo(() => groupByProvinceAndMunicipality(filtered), [filtered]);

  const showTiendas = tab === "tiendas";

  if (showTiendas) {
    return (
      <div className="dir-page">
        <header className="dir-header">
          <div className="dir-header__inner">
            <h1 className="dir-header__title">Tiendas locales en tu ciudad</h1>
            <p className="dir-header__subtitle">
              Descubrí los mejores negocios cerca tuyo y pedí directamente por WhatsApp.
            </p>
            <div className="dir-header__row">
              <div className="dir-search-box dir-search-wrap">
                <Icon name="search" />
                <input
                  type="text"
                  className="dir-search"
                  placeholder="Buscar tiendas por nombre o rubro..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="dir-sort"
                value={directorySort}
                onChange={(e) => setDirectorySort(e.target.value)}
                aria-label="Ordenar por"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        <div className="dir-chips">
          {DIRECTORY_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`dir-chip ${directoryCategory === cat.id ? "dir-chip--active" : ""}`}
              onClick={() => setDirectoryCategory(cat.id)}
            >
              <Icon name={cat.icon} />
              {cat.label}
            </button>
          ))}
        </div>

        <div className="dir-content">
          <div className="dir-results-bar">
            <span className="dir-results-count">
              {directoryList.length} tiendas encontradas
            </span>
            <button type="button" className="dir-filters-btn">
              <Icon name="filter_list" />
              Filtros
            </button>
          </div>

          {isLoading && <DirSkeletons />}

          {isError && (
            <div className="store-empty">
              <div className="store-empty__icon">
                <Icon name="wifi_off" />
              </div>
              <p className="store-empty__text">No pudimos cargar los locales.</p>
              <button type="button" className="store-empty__btn" onClick={refetch}>
                <Icon name="refresh" /> Reintentar
              </button>
            </div>
          )}

          {!isLoading && !isError && locations && locations.length === 0 && (
            <div className="store-empty">
              <div className="store-empty__icon">
                <Icon name="store" />
              </div>
              <p className="store-empty__text">No hay locales disponibles</p>
            </div>
          )}

          {!isLoading &&
            !isError &&
            directoryList.length === 0 &&
            locations &&
            locations.length > 0 && (
              <div className="store-empty">
                <div className="store-empty__icon">
                  <Icon name="search_off" />
                </div>
                <p className="store-empty__text">
                  No se encontraron tiendas para &ldquo;{search}&rdquo;
                  {directoryCategory !== "todos" && ` en ${DIRECTORY_CATEGORIES.find((c) => c.id === directoryCategory)?.label}`}
                </p>
              </div>
            )}

          {!isLoading && !isError && directoryList.length > 0 && (
            <div className="dir-grid">
              {directoryList.map((loc) => (
                <DirectoryCard key={loc.id} loc={loc} />
              ))}
            </div>
          )}
        </div>

        <section className="dir-banner">
          <div className="dir-banner__content">
            <h2 className="dir-banner__title">¿Tenés un negocio?</h2>
            <p className="dir-banner__text">
              Sumate a StrovaStore y empezá a recibir pedidos por WhatsApp hoy mismo. Tu catálogo online en minutos.
            </p>
            <a
              href={STROVA_BUSINESS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="dir-banner__cta"
            >
              Registrar mi negocio
            </a>
          </div>
          <div className="dir-banner__icon" aria-hidden>
            <Icon name="rocket_launch" />
          </div>
        </section>

        <footer className="dir-footer">
          <div className="dir-footer__inner">
            <div className="dir-footer__top">
              <div>
                <Link href="/" className="dir-footer__brand">
                  <span className="store-nav__logo-box" style={{ width: 24, height: 24 }}>
                    <Icon name="storefront" />
                  </span>
                  StrovaStore
                </Link>
                <p className="dir-footer__tagline">
                  Conectando el comercio local con la comunidad digital.
                </p>
              </div>
              <div className="dir-footer__links">
                <div className="dir-footer__col">
                  <h4>Explorar</h4>
                  <Link href="/catalog">Tiendas</Link>
                  <Link href="/catalog?tab=productos">Productos</Link>
                </div>
                <div className="dir-footer__col">
                  <h4>Negocios</h4>
                  <a href={STROVA_BUSINESS_URL} target="_blank" rel="noopener noreferrer">
                    Registrarse
                  </a>
                  <span>Centro de ayuda</span>
                </div>
              </div>
            </div>
            <div className="dir-footer__bottom">
              <p className="dir-footer__copy">© 2024 StrovaStore. Powered by Strova.</p>
              <div className="dir-footer__social">
                <a href="#" aria-label="Instagram">
                  <Icon name="instagram" />
                </a>
                <a href="#" aria-label="Facebook">
                  <Icon name="facebook" />
                </a>
                <a href="#" aria-label="WhatsApp">
                  <Icon name="chat" />
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return <AllProductsView />;
}
