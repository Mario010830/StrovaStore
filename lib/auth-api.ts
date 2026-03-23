/**
 * URL base de la API para el catálogo público.
 *
 * Local: .env.local con NEXT_PUBLIC_API_URL (ej. http://localhost:5000/api).
 * Vercel: Project → Settings → Environment Variables → mismo nombre, valor del backend HTTPS.
 * Si no existe en el build de producción, el bundle puede quedar apuntando a localhost y la API falla.
 */
export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
}
