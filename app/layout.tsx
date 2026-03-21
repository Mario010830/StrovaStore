import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import { AppChrome } from "@/components/ui/AppChrome";
import { InstallBanner } from "@/components/ui/InstallBanner";
import "./css/globals.css";
import "./css/tokens.css";
import "./css/landing.css";
import "./catalog/css/catalog.css";

export const metadata: Metadata = {
  title: "StrovaStore",
  description: "Descubrí tiendas locales y explorá sus productos",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "StrovaStore",
  },
  icons: {
    icon: "/images/icon-192x192.png",
    apple: "/images/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#185FA5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="StrovaStore" />
        <link rel="apple-touch-icon" href="/images/icon-192x192.png" />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>
          <AppChrome>{children}</AppChrome>
        </Providers>
        <InstallBanner />
      </body>
    </html>
  );
}
