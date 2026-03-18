# Catálogo público (Next.js)

Proyecto Next.js con solo el catálogo público de tiendas y productos.

## Cómo completar la instalación

1. **Copia la carpeta `catalog`** desde tu proyecto principal (inventory/strova) dentro de `app/`:
   - Copia todo el contenido de `app/catalog` del otro proyecto **dentro** de `app/catalog/` de este proyecto.
   - Debe quedar: `app/catalog/layout.tsx`, `app/catalog/page.tsx`, `app/catalog/[locationId]/page.tsx`, `app/catalog/AllProductsView.tsx`, `app/catalog/components/CartDrawer.tsx`, `app/catalog/catalog.css`.
   - El archivo `app/catalog/_service/catalogApi.ts` ya está creado; puedes sustituirlo por el tuyo si es distinto.

2. **Dependencias** (si no se instalaron al crear el proyecto):
   ```bash
   npm install
   ```

3. **Variables de entorno**
   - Copia `.env.local.example` a `.env.local`.
   - Ajusta `NEXT_PUBLIC_API_URL` con la URL base de tu API (incluyendo `/api` si aplica).

4. **Ejecutar**
   ```bash
   npm run dev
   ```
   - La raíz `/` redirige a `/catalog`.

## Estructura preparada

- `store/` — Redux con `cartSlice` y `catalogApi`.
- `lib/` — `auth-api` (getApiUrl), `dashboard-types`, `useFavorites`.
- `components/` — `ui/Icon`, `FavoriteButton`.
- `hooks/` — `useFuseSearch`.
- `constants/` — `tags` (TAG_GROUPS).
- `app/providers.tsx` — Provider de Redux + PersistGate para el carrito.
