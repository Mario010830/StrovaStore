import type { PublicCatalogItem } from "@/lib/dashboard-types";
import { toImageProxyUrl } from "@/lib/image";

/**
 * URLs listas para `<Image>` (proxy local), en orden de galería.
 * Usa `images` si hay entradas válidas; si no, la URL principal `imagenUrl`.
 */
export function getPublicCatalogGalleryProxyUrls(item: PublicCatalogItem): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  const push = (raw: string | null | undefined) => {
    const proxied = toImageProxyUrl(raw);
    if (!proxied || seen.has(proxied)) return;
    seen.add(proxied);
    out.push(proxied);
  };

  if (item.images?.length) {
    for (const img of item.images) {
      push(img.imageUrl);
    }
  }
  if (out.length > 0) return out;

  push(item.imagenUrl);
  return out;
}
