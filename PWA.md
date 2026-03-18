# PWA — StrovaStore

## Iconos de la PWA

El `manifest.json` referencia estos iconos en `public/images/`:

- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-192x192.png`
- `icon-512x512.png`

Para generarlos desde el logo sin fondo:

1. Entrá a [maskable.app/editor](https://maskable.app/editor)
2. Subí `public/images/logo-claro-nobg.png`
3. Descargá todos los tamaños y guardalos en `public/images/` con los nombres del manifest.

## Notificaciones push (VAPID)

Crear `.env.local` con las claves VAPID. Para generarlas una vez:

```bash
node -e "const webpush = require('web-push'); console.log(webpush.generateVAPIDKeys())"
```

En `.env.local`:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=tu_clave_publica
VAPID_PRIVATE_KEY=tu_clave_privada
VAPID_EMAIL=mailto:contacto@strovastore.com
```

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` se usa en el frontend para suscribirse.
- `VAPID_PRIVATE_KEY` solo en el servidor (API `/api/push/send`).

## Probar la PWA

El service worker no corre en `npm run dev`. Para probar:

```bash
npm run build
npm run start
```

Luego en Chrome DevTools → Application:

- **Manifest**: verificar que carga bien.
- **Service Workers**: ver que está activo.
- **Lighthouse** → PWA: revisar el score.

Para probar push a mano: Application → Push, pegar un payload JSON y enviar.
