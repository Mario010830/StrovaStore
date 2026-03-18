import type { NextConfig } from "next";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /^https?.*(_next\/static|_next\/image|favicon)/,
      handler: "CacheFirst",
      options: {
        cacheName: "static-assets",
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60 * 30, // 30 días
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
};

export default withPWA(nextConfig);
