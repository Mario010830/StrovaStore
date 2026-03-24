import type { PublicLocation } from "@/lib/dashboard-types";

/** Slug URL-safe a partir del nombre del local (sin depender del backend). */
export function slugifyLocationName(name: string): string {
  const s = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return s || "tienda";
}

/**
 * Ruta canónica del catálogo: `/catalog/{nombre-slug}-{id}`.
 * El sufijo `-{id}` garantiza unicidad y permite resolver sin ambigüedad.
 */
export function buildLocationCatalogPath(loc: Pick<PublicLocation, "id" | "name">): string {
  return `/catalog/${slugifyLocationName(loc.name)}-${loc.id}`;
}

export function buildLocationProductPath(
  loc: Pick<PublicLocation, "id" | "name">,
  productId: number,
): string {
  return `${buildLocationCatalogPath(loc)}/product/${productId}`;
}

/**
 * Obtiene el `locationId` desde el segmento dinámico de la ruta.
 * - Legado: `8` → 8
 * - Canónico: `la-tienda-8` → 8 (último segmento numérico tras el último guion)
 */
export function parseLocationRouteParam(param: string): number | null {
  const p = param.trim();
  if (!p) return null;
  if (/^\d+$/.test(p)) {
    const n = Number(p);
    return Number.isInteger(n) && n > 0 ? n : null;
  }
  const m = p.match(/-(\d+)$/);
  if (m) {
    const id = Number(m[1]);
    return Number.isInteger(id) && id > 0 ? id : null;
  }
  return null;
}
