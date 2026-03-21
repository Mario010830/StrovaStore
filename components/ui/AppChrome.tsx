"use client";

import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { SharedNavbar } from "@/components/ui/SharedNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { CartDrawer } from "@/app/catalog/components/CartDrawer";
import { getBusinessUrl } from "@/lib/runtime-config";

const STROVA_BUSINESS_URL = getBusinessUrl();

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [cartOpen, setCartOpen] = useState(false);

  const tab = searchParams.get("tab") ?? "tiendas";
  const activeCatalogTab = tab === "productos" ? "productos" : "tiendas";
  const isCatalogRoute = pathname.startsWith("/catalog");
  const isLandingHome = pathname === "/";
  const navbarVariant = isCatalogRoute ? "store" : "landing";
  return (
    <>
      <SharedNavbar
        variant={navbarVariant}
        businessUrl={STROVA_BUSINESS_URL}
        activeCatalogTab={isCatalogRoute ? activeCatalogTab : null}
      />
      {children}
      <LandingFooter businessUrl={STROVA_BUSINESS_URL} />
      {!isLandingHome && <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />}
    </>
  );
}
