/** Parámetros URL del directorio marketplace (?orden=&vista=&abierto=&radio=). */

export type DirectorySortUrl = "cercanos" | "populares" | "nuevos";
export type DirectoryVistaUrl = "grid" | "zonas";

const SORT_LABELS: Record<DirectorySortUrl, string> = {
  cercanos: "Más cercanos",
  populares: "Más populares",
  nuevos: "Nuevos",
};

export function parseSortParam(value: string | null): DirectorySortUrl {
  if (value === "populares" || value === "nuevos" || value === "cercanos") return value;
  return "cercanos";
}

export function parseVistaParam(value: string | null): DirectoryVistaUrl {
  if (value === "grid") return "grid";
  return "zonas";
}

export function sortUrlToLabel(key: DirectorySortUrl): string {
  return SORT_LABELS[key];
}

export function labelToSortUrl(label: string): DirectorySortUrl {
  if (label === "Más populares") return "populares";
  if (label === "Nuevos") return "nuevos";
  return "cercanos";
}

export function parseOpenOnlyParam(value: string | null): boolean {
  return value === "1" || value === "true";
}

/** 0 = sin filtro por distancia; 3, 5, 10 = km máximos */
export function parseRadiusKmParam(value: string | null): 0 | 3 | 5 | 10 {
  const n = value ? Number(value) : 0;
  if (n === 3 || n === 5 || n === 10) return n;
  return 0;
}
