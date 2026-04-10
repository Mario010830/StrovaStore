"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { SharedNavbar } from "@/components/ui/SharedNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { CartDrawer } from "@/app/catalog/components/CartDrawer";
import { CartUiProvider } from "@/components/ui/CartUiContext";
import { getBusinessUrl } from "@/lib/runtime-config";
import { isCatalogIndexPath } from "@/lib/path-utils";

const STROVA_BUSINESS_URL = getBusinessUrl();

/** Routes that render their own chrome — global navbar/footer/cart are hidden. */
function isStandaloneRoute(pathname: string): boolean {
  return pathname.startsWith("/pedido");
}

/** Navbar fallback (no useSearchParams) — avoids dead UI during Suspense in prod. */
function NavbarPathnameOnly() {
  const pathname = usePathname();
  if (isStandaloneRoute(pathname)) return null;
  const isCatalogRoute = pathname.startsWith("/catalog");
  const variant = isCatalogRoute ? "store" : "landing";
  return (
    <SharedNavbar variant={variant} businessUrl={STROVA_BUSINESS_URL} activeCatalogTab={null} />
  );
}

function NavbarWithSearchParams() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  if (isStandaloneRoute(pathname)) return null;
  const tab = searchParams.get("tab") ?? "tiendas";
  const activeCatalogTab = tab === "productos" ? "productos" : "tiendas";
  const isCatalogRoute = pathname.startsWith("/catalog");
  const navbarVariant = isCatalogRoute ? "store" : "landing";
  return (
    <SharedNavbar
      variant={navbarVariant}
      businessUrl={STROVA_BUSINESS_URL}
      activeCatalogTab={isCatalogRoute ? activeCatalogTab : null}
    />
  );
}

function CartDrawerWithSearchParams({
  cartOpen,
  onOpenChange,
}: {
  cartOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (isStandaloneRoute(pathname)) return null;

  const tab = searchParams.get("tab") ?? "tiendas";
  const activeCatalogTab = tab === "productos" ? "productos" : "tiendas";
  const isLandingHome = pathname === "/";
  const hideCartOnTiendasDirectory = isCatalogIndexPath(pathname) && activeCatalogTab === "tiendas";
  const hideCartOnMarketplace = isCatalogIndexPath(pathname) && activeCatalogTab === "productos";
  const showCart =
    !isLandingHome && !hideCartOnTiendasDirectory && !hideCartOnMarketplace;

  if (!showCart) return null;
  return <CartDrawer open={cartOpen} onOpenChange={onOpenChange} />;
}

function FooterWithPathname() {
  const pathname = usePathname();
  if (isStandaloneRoute(pathname)) return null;
  return <LandingFooter businessUrl={STROVA_BUSINESS_URL} />;
}

export function AppChrome({ children }: { children: React.ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);
  const openCart = useCallback(() => setCartOpen(true), []);
  const cartUi = useMemo(
    () => ({ openCart, cartOpen, setCartOpen }),
    [openCart, cartOpen],
  );

  return (
    <CartUiProvider value={cartUi}>
      <Suspense fallback={<NavbarPathnameOnly />}>
        <NavbarWithSearchParams />
      </Suspense>
      {children}
      <FooterWithPathname />
      <Suspense fallback={null}>
        <CartDrawerWithSearchParams cartOpen={cartOpen} onOpenChange={setCartOpen} />
      </Suspense>
    </CartUiProvider>
  );
}
