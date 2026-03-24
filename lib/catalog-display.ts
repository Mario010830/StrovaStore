import type { PublicCatalogItem } from "@/lib/dashboard-types";

/** Color estable por nombre de categoría (punto en chip estilo catálogo). */
export function categoryDotColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  const hue = Math.abs(h) % 360;
  return `hsl(${hue} 72% 48%)`;
}

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
