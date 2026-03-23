"use client";

import { Suspense, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { SharedNavbar } from "@/components/ui/SharedNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { CartDrawer } from "@/app/catalog/components/CartDrawer";
import { getBusinessUrl } from "@/lib/runtime-config";
import { isCatalogIndexPath } from "@/lib/path-utils";

const STROVA_BUSINESS_URL = getBusinessUrl();

/** Navbar sin `useSearchParams` — sirve de fallback de Suspense (evita UI “muerta” en prod). */
function NavbarPathnameOnly() {
  const pathname = usePathname();
  const isCatalogRoute = pathname.startsWith("/catalog");
  const variant = isCatalogRoute ? "store" : "landing";
  return (
    <SharedNavbar variant={variant} businessUrl={STROVA_BUSINESS_URL} activeCatalogTab={null} />
  );
}

function NavbarWithSearchParams() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
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

function CartDrawerWithSearchParams() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [cartOpen, setCartOpen] = useState(false);

  const tab = searchParams.get("tab") ?? "tiendas";
  const activeCatalogTab = tab === "productos" ? "productos" : "tiendas";
  const isLandingHome = pathname === "/";
  const hideCartOnTiendasDirectory = isCatalogIndexPath(pathname) && activeCatalogTab === "tiendas";
  const showCart = !isLandingHome && !hideCartOnTiendasDirectory;

  if (!showCart) return null;
  return <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />;
}

export function AppChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<NavbarPathnameOnly />}>
        <NavbarWithSearchParams />
      </Suspense>
      {children}
      <LandingFooter businessUrl={STROVA_BUSINESS_URL} />
      <Suspense fallback={null}>
        <CartDrawerWithSearchParams />
      </Suspense>
    </>
  );
}
