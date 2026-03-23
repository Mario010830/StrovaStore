"use client";

import { useId } from "react";
import type { DirectorySortUrl, DirectoryVistaUrl } from "@/app/catalog/lib/directory-url";

export type DirectoryCategoryItem = { key: string; name: string; slug: string };

type RadiusValue = 0 | 3 | 5 | 10;

export type DirectoryFiltersFormProps = {
  showSort?: boolean;
  sortKey: DirectorySortUrl;
  onSortChange: (key: DirectorySortUrl) => void;
  categories: DirectoryCategoryItem[];
  activeCategoryKey: string;
  onSelectCategory: (item: DirectoryCategoryItem) => void;
  openOnly: boolean;
  onOpenOnlyChange: (value: boolean) => void;
  radiusKm: RadiusValue;
  onRadiusKmChange: (km: RadiusValue) => void;
  vista: DirectoryVistaUrl;
  onVistaChange: (v: DirectoryVistaUrl) => void;
  geoAvailable: boolean;
};

const SORT_OPTIONS: { value: DirectorySortUrl; label: string }[] = [
  { value: "cercanos", label: "Más cercanos" },
  { value: "populares", label: "Más populares" },
  { value: "nuevos", label: "Nuevos" },
];

const RADIUS_OPTIONS: { value: RadiusValue; label: string }[] = [
  { value: 0, label: "Cualquier distancia" },
  { value: 3, label: "Menos de 3 km" },
  { value: 5, label: "Menos de 5 km" },
  { value: 10, label: "Menos de 10 km" },
];

export function DirectoryFiltersForm({
  showSort,
  sortKey,
  onSortChange,
  categories,
  activeCategoryKey,
  onSelectCategory,
  openOnly,
  onOpenOnlyChange,
  radiusKm,
  onRadiusKmChange,
  vista,
  onVistaChange,
  geoAvailable,
}: DirectoryFiltersFormProps) {
  const formUid = useId();
  const radiusGroupName = `dir-radius-${formUid}`;

  return (
    <>
      <div className="dir-mp-sidebar__group dir-mp-sidebar__group--biz-category">
        <label className="dir-mp-sidebar__label" htmlFor={`${formUid}-biz-cat`} id={`${formUid}-biz-cat-label`}>
          Categoría del comercio
        </label>
        <p className="dir-mp-sidebar__microcopy" id={`${formUid}-biz-cat-hint`}>
          Filtra por tipo de establecimiento.
        </p>
        <select
          id={`${formUid}-biz-cat`}
          className="dir-tiendas-sort-select dir-mp-filters-sort dir-mp-filters-sort--category"
          aria-labelledby={`${formUid}-biz-cat-label`}
          aria-describedby={`${formUid}-biz-cat-hint`}
          value={activeCategoryKey}
          onChange={(e) => {
            const item = categories.find((c) => c.key === e.target.value);
            if (item) onSelectCategory(item);
          }}
        >
          {categories.map((item) => (
            <option key={item.key} value={item.key}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      {showSort ? (
        <div className="dir-mp-sidebar__group">
          <span className="dir-mp-sidebar__label" id="dir-filters-sort-label">
            Ordenar
          </span>
          <select
            className="dir-tiendas-sort-select dir-mp-filters-sort"
            aria-labelledby="dir-filters-sort-label"
            value={sortKey}
            onChange={(e) => onSortChange(e.target.value as DirectorySortUrl)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="dir-mp-sidebar__group">
        <label className="dir-mp-toggle">
          <input
            type="checkbox"
            checked={openOnly}
            onChange={(e) => onOpenOnlyChange(e.target.checked)}
          />
          Solo abiertas ahora
        </label>
      </div>

      <div className="dir-mp-sidebar__group">
        <span className="dir-mp-sidebar__label">Distancia</span>
        {!geoAvailable ? (
          <p className="dir-mp-sidebar__hint">Activa la ubicación del navegador para filtrar por distancia.</p>
        ) : null}
        <div className="dir-mp-radio-list" role="radiogroup" aria-label="Filtrar por distancia máxima">
          {RADIUS_OPTIONS.map((o) => (
            <label
              key={String(o.value)}
              className={`dir-mp-radio${!geoAvailable && o.value !== 0 ? " dir-mp-radio--disabled" : ""}`}
            >
              <input
                type="radio"
                name={radiusGroupName}
                value={String(o.value)}
                checked={radiusKm === o.value}
                disabled={!geoAvailable && o.value !== 0}
                onChange={() => onRadiusKmChange(o.value)}
              />
              {o.label}
            </label>
          ))}
        </div>
      </div>

      <div className="dir-mp-sidebar__group">
        <span className="dir-mp-sidebar__label">Vista</span>
        <div className="dir-mp-seg" role="group" aria-label="Vista del listado">
          <button
            type="button"
            className={`dir-mp-seg__btn${vista === "grid" ? " dir-mp-seg__btn--active" : ""}`}
            aria-pressed={vista === "grid"}
            onClick={() => onVistaChange("grid")}
          >
            Rejilla
          </button>
          <button
            type="button"
            className={`dir-mp-seg__btn${vista === "zonas" ? " dir-mp-seg__btn--active" : ""}`}
            aria-pressed={vista === "zonas"}
            onClick={() => onVistaChange("zonas")}
          >
            Por zona
          </button>
        </div>
      </div>
    </>
  );
}
