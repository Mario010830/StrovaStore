import type { PublicCatalogItem } from "@/lib/dashboard-types";

/**
 * Línea secundaria en tarjetas de catálogo: descripción del producto,
 * o nombres de etiquetas si no hay texto (el API a veces solo envía tags).
 */
export function getProductCardSubtitle(item: PublicCatalogItem): string | null {
  const d = item.description?.trim();
  if (d) return d;
  const tags = item.tags;
  if (tags?.length) {
    const line = tags.map((t) => t.name).filter(Boolean).join(" · ");
    return line || null;
  }
  return null;
}
