/**
 * URL base de la API para el catálogo público.
 * Configura NEXT_PUBLIC_API_URL en .env.local (ej: https://tu-backend.ngrok-free.dev/api).
 */
export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
}
