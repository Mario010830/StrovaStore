import type { NextConfig } from "next";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("next-pwa")({
  dest: "public",
  customWorkerDir: "worker",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    // NetworkFirst: tras cada deploy en Vercel, el SW no debe servir JS viejo con CacheFirst
    // (hidrato roto → clics que no responden). El navegador usa red primero y actualiza caché.
    {
      urlPattern: /^https?.*(_next\/static|_next\/image|favicon)/,
      handler: "NetworkFirst",
      options: {
        cacheName: "static-assets",
        networkTimeoutSeconds: 5,
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60 * 7, // 7 días máx. en caché
        },
      },
    },
    {
      urlPattern: /^https?.*\.(woff|woff2|ttf|otf)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "fonts",
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 24 * 60 * 60 * 365, // 1 año
        },
      },
    },
    {
      urlPattern: /^https?.*\.(png|jpg|jpeg|webp|svg|gif)$/,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "images",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60, // 1 día
        },
      },
    },
    {
      urlPattern: /^https?.*\/api\/public\/.*/,
      handler: "NetworkOnly",
    },
  ],
});

const nextConfig: NextConfig = {
  turbopack: {
    root: ".",
  },
  images: {
    qualities: [75, 92],
    localPatterns: [
      {
        pathname: "/api/image",
      },
      {
        pathname: "/images/**",
      },
    ],
  },
};

export default withPWA(nextConfig);
