import { haversineKm } from "@/lib/geo";
import type { PublicLocation } from "@/lib/dashboard-types";

/** Por encima de esto no mostramos km en tarjeta (datos poco fiables para “cerca”). */
export const MAX_DISTANCE_DISPLAY_KM = 200;

export function distanceToStoreKm(
  loc: PublicLocation,
  user: { lat: number; lng: number },
): number | null {
  const lat = loc.latitude;
  const lon = loc.longitude;
  if (lat == null || lon == null) return null;
  if (typeof lat !== "number" || typeof lon !== "number") return null;
  return haversineKm(user.lat, user.lng, lat, lon);
}

export function sortLocations(
  list: PublicLocation[],
  sortLabel: string,
  userPos: { lat: number; lng: number } | null,
): PublicLocation[] {
  const next = [...list];
  if (sortLabel === "Más cercanos" && userPos) {
    return next.sort((a, b) => {
      const da = distanceToStoreKm(a, userPos);
      const db = distanceToStoreKm(b, userPos);
      if (da != null && db != null) return da - db;
      if (da != null) return -1;
      if (db != null) return 1;
      return (a.name ?? "").localeCompare(b.name ?? "", "es");
    });
  }
  if (sortLabel === "Nuevos") {
    return next.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
  }
  if (sortLabel === "Más populares") {
    return next.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", "es"));
  }
  return next.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", "es"));
}

export function filterOpenOnly(list: PublicLocation[]): PublicLocation[] {
  return list.filter((loc) => loc.isOpenNow === true);
}

export function filterByRadiusKm(
  list: PublicLocation[],
  maxKm: number,
  userPos: { lat: number; lng: number } | null,
): PublicLocation[] {
  if (maxKm <= 0 || !userPos) return list;
  return list.filter((loc) => {
    const d = distanceToStoreKm(loc, userPos);
    return d != null && d <= maxKm;
  });
}

/** Texto para tarjeta o null si no conviene mostrar distancia. */
export function formatDistanceForCard(km: number | null): string | null {
  if (km == null || !Number.isFinite(km) || km < 0) return null;
  if (km > MAX_DISTANCE_DISPLAY_KM) return null;
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}
