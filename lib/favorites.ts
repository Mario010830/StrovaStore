/**
 * Favoritos en localStorage (sin servidor). Claves versionadas por si cambia el formato.
 */
const LS_STORES = "strova-fav-stores-v1";
const LS_PRODUCTS = "strova-fav-products-v1";

export const FAVORITES_CHANGED_EVENT = "strova-favorites-changed";

function parseStoreIds(json: string | null): number[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.filter((x): x is number => Number.isInteger(x) && x > 0);
  } catch {
    return [];
  }
}

function parseProductKeys(json: string | null): string[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.filter((x): x is string => typeof x === "string" && /^\d+:\d+$/.test(x));
  } catch {
    return [];
  }
}

function readStoreSet(): Set<number> {
  if (typeof window === "undefined") return new Set();
  return new Set(parseStoreIds(localStorage.getItem(LS_STORES)));
}

function readProductSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  return new Set(parseProductKeys(localStorage.getItem(LS_PRODUCTS)));
}

export function productFavoriteKey(locationId: number, productId: number): string {
  return `${locationId}:${productId}`;
}

export function isFavoriteStore(id: number): boolean {
  return readStoreSet().has(id);
}

export function isFavoriteProduct(locationId: number, productId: number): boolean {
  return readProductSet().has(productFavoriteKey(locationId, productId));
}

export function toggleFavoriteStore(id: number): boolean {
  const set = readStoreSet();
  const next = !set.has(id);
  if (next) set.add(id);
  else set.delete(id);
  localStorage.setItem(LS_STORES, JSON.stringify([...set].sort((a, b) => a - b)));
  dispatchFavoritesChanged();
  return next;
}

export function toggleFavoriteProduct(locationId: number, productId: number): boolean {
  const key = productFavoriteKey(locationId, productId);
  const set = readProductSet();
  const next = !set.has(key);
  if (next) set.add(key);
  else set.delete(key);
  localStorage.setItem(LS_PRODUCTS, JSON.stringify([...set].sort()));
  dispatchFavoritesChanged();
  return next;
}

function dispatchFavoritesChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(FAVORITES_CHANGED_EVENT));
}

/** Para `useSyncExternalStore`: se actualiza entre pestañas (`storage`) y en la misma pestaña (evento custom). */
export function subscribeFavorites(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const onStorage = (e: StorageEvent) => {
    if (e.key === LS_STORES || e.key === LS_PRODUCTS) onChange();
  };
  const onLocal = () => onChange();

  window.addEventListener("storage", onStorage);
  window.addEventListener(FAVORITES_CHANGED_EVENT, onLocal);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(FAVORITES_CHANGED_EVENT, onLocal);
  };
}

export function getFavoriteStoreSnapshot(id: number): boolean {
  return isFavoriteStore(id);
}

export function getFavoriteProductSnapshot(locationId: number, productId: number): boolean {
  return isFavoriteProduct(locationId, productId);
}

/** IDs de productos favoritos para una tienda (para ordenar el grid). */
export function getFavoriteProductIdsForLocation(locationId: number): number[] {
  if (typeof window === "undefined") return [];
  const keys = parseProductKeys(localStorage.getItem(LS_PRODUCTS));
  const out: number[] = [];
  for (const k of keys) {
    const parts = k.split(":");
    if (parts.length !== 2) continue;
    const loc = Number(parts[0]);
    const pid = Number(parts[1]);
    if (loc === locationId && Number.isInteger(pid) && pid > 0) out.push(pid);
  }
  return out;
}

/** Clave estable para `useSyncExternalStore` al cambiar favoritos. */
export function getFavoriteProductSortKey(locationId: number): string {
  return getFavoriteProductIdsForLocation(locationId)
    .sort((a, b) => a - b)
    .join(",");
}
