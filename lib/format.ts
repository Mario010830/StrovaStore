/**
 * Precio: símbolo $, miles con punto, sin decimales, sufijo CUP (p. ej. $1.400 CUP).
 */
export function formatPrice(value: number): string {
  if (!Number.isFinite(value)) return "$0 CUP";
  const n = Math.round(value);
  return `$${n.toLocaleString("es-CO", { maximumFractionDigits: 0 })} CUP`;
}
