/**
 * Precio estilo tienda local: símbolo $, miles con punto, sin decimales (p. ej. $1.400).
 */
export function formatPrice(value: number): string {
  if (!Number.isFinite(value)) return "$0";
  const n = Math.round(value);
  return `$${n.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;
}
