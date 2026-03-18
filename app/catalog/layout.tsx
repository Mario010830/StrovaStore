"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import { useAppSelector } from "@/store/store";
import { CartDrawer } from "./components/CartDrawer";
import "./catalog.css";

const STROVA_BUSINESS_URL = "https://inventory-fkca.vercel.app/";

interface CatalogCtx {
  search: string;
  setSearch: (v: string) => void;
  openCart: () => void;
}

const CatalogContext = createContext<CatalogCtx>({
  search: "",
  setSearch: () => {},
  openCart: () => {},
});

export const useCatalogCtx = () => useContext(CatalogContext);

export default function CatalogLayout({ children }: { children: React.ReactNode }) {
  const [search, setSearch] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const openCart = useCallback(() => setCartOpen(true), []);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const count = useAppSelector((s) =>
    s.cart.items.reduce((a, i) => a + i.quantity, 0)
  );

  const hideCart =
    pathname === "/catalog" && searchParams.get("tab") === "productos";
  const tab = searchParams.get("tab") ?? "tiendas";
  const isTiendas = tab === "tiendas";

  return (
    <CatalogContext.Provider value={{ search, setSearch, openCart }}>
      <div className="store-layout">
        <nav className="store-nav store-nav--directory">
          <Link href="/" className="store-nav__brand">
            <span className="store-nav__logo-box">
              <Image
                src="/images/logo-claro-nobg.png"
                alt="StrovaStore"
                width={120}
                height={36}
                priority
              />
            </span>
            <span className="store-nav__brand-label">StrovaStore</span>
          </Link>

          <div className="store-nav__links">
            <Link
              href="/catalog"
              className={`store-nav__link ${isTiendas ? "store-nav__link--active" : ""}`}
            >
              Tiendas
            </Link>
            <Link
              href="/catalog?tab=productos"
              className={`store-nav__link ${!isTiendas ? "store-nav__link--active" : ""}`}
            >
              Productos
            </Link>
            <a
              href={STROVA_BUSINESS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="store-nav__link"
            >
              ¿Tenés un negocio?
            </a>
          </div>

          <div className="store-nav__actions">
            {!hideCart && (
              <button type="button" className="store-nav__cart" onClick={openCart}>
                <Icon name="shopping_cart" />
                {count > 0 && <span className="store-nav__cart-count">{count}</span>}
                <span className="store-nav__cart-label">Carrito</span>
                {count > 0 && <span className="store-nav__badge">{count > 99 ? "99+" : count}</span>}
              </button>
            )}
            <Link href="/catalog" className="store-nav__cta">
              Explorar ahora
            </Link>
          </div>
        </nav>

        <main className="store-main">{children}</main>

        {!hideCart && <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />}
      </div>
    </CatalogContext.Provider>
  );
}
