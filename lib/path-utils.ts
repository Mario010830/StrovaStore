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

/**
 * Misma regla que `CartDrawer` en AppChrome: rutas donde el carrito global existe.
 * Si el drawer no se monta, el estado `cartOpen` debe cerrarse para no reaparecer al volver atrás.
 */
export function shouldShowGlobalCartDrawer(
  pathname: string,
  searchParams: Pick<URLSearchParams, "get">,
): boolean {
  if (pathname.startsWith("/pedido")) return false;
  if (normalizePathname(pathname) === "/") return false;
  const tab = searchParams.get("tab") ?? "tiendas";
  const activeCatalogTab = tab === "productos" ? "productos" : "tiendas";
  if (isCatalogIndexPath(pathname) && activeCatalogTab === "tiendas") return false;
  if (isCatalogIndexPath(pathname) && activeCatalogTab === "productos") return false;
  return true;
}
