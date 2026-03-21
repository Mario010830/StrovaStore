"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { LayoutGrid } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { BusinessCategoryPill } from "@/components/ui/BusinessCategoryPill";
import {
  QUERY_POLLING_OPTIONS,
  useGetBusinessCategoriesQuery,
  useGetPublicLocationsQuery,
} from "./_service/catalogApi";
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
import { getBusinessCategoryLucideIcon } from "@/utils/businessCategoryIcons";

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

function DirectoryCard({
  loc,
  businessCategoryDisplay,
}: {
  loc: PublicLocation;
  businessCategoryDisplay: string | null;
}) {
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
        <div className="dir-card__biz-pill">
          <BusinessCategoryPill name={businessCategoryDisplay} />
        </div>
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

type DirBizCatItem = { key: string; name: string; slug: string };

export default function CatalogLocationsPage() {
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

  const dirBizCategoryItems: DirBizCatItem[] = useMemo(() => {
    const sorted = [...businessCategories].sort((a, b) =>
      a.name.localeCompare(b.name, "es", { sensitivity: "base" }),
    );
    return [
      { key: "todos", name: "Todos", slug: "" },
      ...sorted.map((c) => ({ key: String(c.id), name: c.name, slug: c.slug })),
    ];
  }, [businessCategories]);

  const activeBizCategoryId = useMemo(() => {
    if (!categorySlug) return null;
    const match = businessCategories.find((c) => c.slug === categorySlug);
    return match?.id ?? null;
  }, [categorySlug, businessCategories]);

  const activeDirBizKey = activeBizCategoryId != null ? String(activeBizCategoryId) : "todos";

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

  const resolveLocationBizName = useCallback(
    (loc: PublicLocation): string | null => {
      if (loc.businessCategoryName?.trim()) return loc.businessCategoryName.trim();
      if (loc.businessCategoryId == null) return null;
      const c = businessCategories.find((x) => x.id === loc.businessCategoryId);
      return c?.name ?? null;
    },
    [businessCategories],
  );

  const categoryFilterLabel = useMemo(() => {
    if (!categorySlug) return null;
    return businessCategories.find((c) => c.slug === categorySlug)?.name ?? null;
  }, [categorySlug, businessCategories]);

  const directoryList = useMemo(() => {
    let list = [...filtered];
    if (zonaProvincia) {
      list = list.filter((loc) => (loc.province ?? "").trim() === zonaProvincia);
    }
    if (zonaMunicipio) {
      list = list.filter((loc) => (loc.municipality ?? "").trim() === zonaMunicipio);
    }
    if (activeBizCategoryId != null) {
      list = list.filter((loc) => loc.businessCategoryId === activeBizCategoryId);
    }
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
  }, [
    filtered,
    directoryCategory,
    directorySort,
    zonaProvincia,
    zonaMunicipio,
    activeBizCategoryId,
  ]);

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

        <div className="dir-biz-category-strip">
          <div className="dir-biz-category-strip__scroll" role="tablist" aria-label="Tipo de negocio">
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
                  className={`dir-biz-cat-pill${active ? " dir-biz-cat-pill--active" : ""}`}
                  onClick={() => selectDirBizCategory(item)}
                >
                  <span className="dir-biz-cat-pill__icon" aria-hidden>
                    <LucideIcon size={16} strokeWidth={2} />
                  </span>
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>
        </div>

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
                message={`No se encontraron tiendas para "${search}"${directoryCategory !== "todos" ? ` en ${DIRECTORY_CATEGORIES.find((c) => c.id === directoryCategory)?.label}` : ""}${categoryFilterLabel ? ` · ${categoryFilterLabel}` : ""}`}
              />
            )}

          {!isLoading && !isError && directoryList.length > 0 && (
            <div className="dir-grid">
              {directoryList.map((loc) => (
                <DirectoryCard
                  key={loc.id}
                  loc={loc}
                  businessCategoryDisplay={resolveLocationBizName(loc)}
                />
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
