/** Normaliza pathname (barra final, etc.) para comparar rutas de forma estable en cliente y servidor. */
export function normalizePathname(pathname: string | null): string {
  if (!pathname) return "";
  const t = pathname.replace(/\/$/, "");
  return t === "" ? "/" : t;
}

/** Raíz del catálogo público: /catalog (con o sin / final según el host). */
export function isCatalogIndexPath(pathname: string | null): boolean {
  return normalizePathname(pathname) === "/catalog";
}

/** Marketplace de productos: /catalog/productos (con o sin / final). */
export function isCatalogProductsPath(pathname: string | null): boolean {
  return normalizePathname(pathname) === "/catalog/productos";
}
