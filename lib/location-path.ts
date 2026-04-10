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
 * Ruta canónica del catálogo: `/catalog/{nombre-slug}`.
 * La unicidad depende del nombre; si varios locales comparten el mismo slug, se toma el de menor id.
 */
export function buildLocationCatalogPath(loc: Pick<PublicLocation, "id" | "name">): string {
  return `/catalog/${slugifyLocationName(loc.name)}`;
}

export function buildLocationProductPath(
  loc: Pick<PublicLocation, "id" | "name">,
  productId: number,
): string {
  return `${buildLocationCatalogPath(loc)}/product/${productId}`;
}

/**
 * Resuelve el id del local desde el segmento de ruta `/catalog/[locationSlug]`.
 *
 * - `/catalog/la-83` → el guion y números forman parte del **nombre** slugificado, no el id.
 * - `/catalog/mi-tienda-12` (legado) → solo si coincide `slugify(nombre)-12` con un local.
 * - `/catalog/12` → id numérico (legado).
 */
export function resolveLocationIdFromCatalogSlug(
  param: string,
  locations: PublicLocation[] | undefined | null,
): number | null {
  const raw = param.trim();
  if (!raw) return null;
  const p = raw.toLowerCase();

  if (/^\d+$/.test(p)) {
    const n = Number(p);
    if (!Number.isInteger(n) || n <= 0) return null;
    if (locations?.length) return locations.some((l) => l.id === n) ? n : null;
    return n;
  }

  if (!locations?.length) return null;

  // 1) URL canónica: todo el segmento es el slug del nombre (p. ej. nombre "La 83" → la-83).
  const bySlug = locations.filter((l) => slugifyLocationName(l.name) === p);
  if (bySlug.length === 1) return bySlug[0]!.id;
  if (bySlug.length > 1) return [...bySlug].sort((a, b) => a.id - b.id)[0]!.id;

  // 2) Legado: …-{id} solo cuando coincide el slug completo del local con el prefijo.
  for (const loc of locations) {
    const legacy = `${slugifyLocationName(loc.name)}-${loc.id}`;
    if (legacy === p) return loc.id;
  }

  return null;
}
