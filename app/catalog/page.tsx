"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import { useGetPublicLocationsQuery } from "./_service/catalogApi";
import { useFuseSearch } from "@/hooks/useFuseSearch";
import type { PublicLocation } from "@/lib/dashboard-types";
import AllProductsView from "./AllProductsView";
import { useCatalogCtx } from "./layout";
import { getBusinessUrl } from "@/lib/runtime-config";
import { toImageProxyUrl } from "@/lib/image";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChip } from "@/components/ui/FilterChip";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getRtkErrorInfo } from "@/lib/rtk-error";

const STROVA_BUSINESS_URL = getBusinessUrl();

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

function DirectoryCard({ loc }: { loc: PublicLocation }) {
  const hasHours = !!loc.businessHours;
  const showBadge = hasHours && loc.isOpenNow != null;
  const isOpen = loc.isOpenNow === true;
  const categoryLine = loc.organizationName || "—";

  const proxiedImageUrl = toImageProxyUrl(loc.photoUrl);

  return (
    <Link href={`/catalog/${loc.id}`} className="dir-card">
      <div className="dir-card__img-wrap">
        {proxiedImageUrl ? (
          <Image src={proxiedImageUrl} alt={loc.name} width={480} height={320} />
        ) : (
          <div className="dir-card__placeholder">
            <Icon name="storefront" />
          </div>
        )}
        {showBadge && (
          <StatusBadge
            label={isOpen ? "Abierto" : "Cerrado"}
            className="dir-card__badge"
            active={isOpen}
            inactiveClassName="dir-card__badge--closed"
            icon={<span className="dir-card__badge-dot" />}
          />
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
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "tiendas";

  const { data: locations, isLoading, isError, error, refetch } = useGetPublicLocationsQuery();
  const { search, setSearch } = useCatalogCtx();
  const [directoryCategory, setDirectoryCategory] = useState<string>("todos");
  const [directorySort, setDirectorySort] = useState<string>("Más cercanos");

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

  const showTiendas = tab === "tiendas";
  const errorInfo = getRtkErrorInfo(error);

  if (showTiendas) {
    return (
      <div className="dir-page">
        <header className="dir-header">
          <div className="dir-header__inner">
            <SectionHeader
              title="Tiendas locales en tu ciudad"
              subtitle="Descubrí los mejores negocios cerca tuyo y pedí directamente por WhatsApp."
            />
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
            <FilterChip
              key={cat.id}
              label={cat.label}
              iconName={cat.icon}
              active={directoryCategory === cat.id}
              onClick={() => setDirectoryCategory(cat.id)}
              className="dir-chip"
              activeClassName="dir-chip--active"
            />
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
            directoryList.length === 0 &&
            locations &&
            locations.length > 0 && (
              <EmptyState
                icon={<Icon name="search_off" />}
                message={`No se encontraron tiendas para "${search}"${directoryCategory !== "todos" ? ` en ${DIRECTORY_CATEGORIES.find((c) => c.id === directoryCategory)?.label}` : ""}`}
              />
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

      </div>
    );
  }

  return <AllProductsView />;
}
