import type { PublicLocation } from "@/lib/dashboard-types";

export type LocationZoneGroup = {
  /** Clave estable para React */
  zoneKey: string;
  province: string;
  municipality: string | null;
  locations: PublicLocation[];
};

/**
 * Agrupa ubicaciones públicas por provincia + municipio (solo filas con al menos uno de los dos).
 */
export function groupPublicLocationsByZone(locations: PublicLocation[]): LocationZoneGroup[] {
  const map = new Map<string, LocationZoneGroup>();

  for (const loc of locations) {
    const p = (loc.province ?? "").trim();
    const m = (loc.municipality ?? "").trim();
    if (!p && !m) continue;

    const zoneKey =
      p && m ? `${p}::${m}` : p ? `${p}::` : `::${m}`;

    if (!map.has(zoneKey)) {
      map.set(zoneKey, {
        zoneKey,
        province: p,
        municipality: m || null,
        locations: [],
      });
    }
    map.get(zoneKey)!.locations.push(loc);
  }

  return [...map.values()].sort((a, b) => {
    const ap = a.province || "\uFFFF";
    const bp = b.province || "\uFFFF";
    const byP = ap.localeCompare(bp, "es");
    if (byP !== 0) return byP;
    return (a.municipality || "").localeCompare(b.municipality || "", "es");
  });
}

/** Título principal de la tarjeta de zona (referencia tipo marketplace). */
export function getZoneCardTitle(zone: Pick<LocationZoneGroup, "province" | "municipality">): string {
  if (zone.municipality) return zone.municipality;
  return zone.province || "Zona";
}

/** Subtítulo: «Municipio, Provincia» (si hay ambos); si no, cadena vacía para no repetir el título. */
export function getZoneCardSubtitle(zone: Pick<LocationZoneGroup, "province" | "municipality">): string {
  if (zone.municipality && zone.province) {
    return `${zone.municipality}, ${zone.province}`;
  }
  return "";
}

export function buildCatalogZoneHref(province: string, municipality: string | null): string {
  const params = new URLSearchParams({ tab: "tiendas" });
  if (province) params.set("provincia", province);
  if (municipality) params.set("municipio", municipality);
  return `/catalog?${params.toString()}`;
}
