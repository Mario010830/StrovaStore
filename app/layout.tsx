import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import { AppChrome } from "@/components/ui/AppChrome";
import { InstallBanner } from "@/components/ui/InstallBanner";
import "./css/globals.css";
import "./css/tokens.css";
import "./css/landing.css";
import "./catalog/css/catalog.css";

export const metadata: Metadata = {
  title: "Tu Cuadre",
  description: "Descubre tiendas locales y explora sus productos",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tu Cuadre",
  },
  icons: {
    icon: "/images/logocuadre.png",
    apple: "/images/logocuadre.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F766E",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-US" className="h-full antialiased">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined"
          rel="stylesheet"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Tu Cuadre" />
        <link rel="apple-touch-icon" href="/images/logocuadre.png" />
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
