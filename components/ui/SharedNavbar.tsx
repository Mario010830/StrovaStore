"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/ui/Icon";

type NavbarVariant = "landing" | "store";
type CatalogTab = "tiendas" | "productos";

interface SharedNavbarProps {
  variant: NavbarVariant;
  businessUrl: string;
  activeCatalogTab?: CatalogTab | null;
}

export function SharedNavbar({
  variant,
  businessUrl,
  activeCatalogTab = null,
}: SharedNavbarProps) {
  const [activeInfoModal, setActiveInfoModal] = useState<"about" | "help" | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const landingNavRef = useRef<HTMLElement>(null);

  const isStore = variant === "store";
  const navClassName = isStore ? "store-nav store-nav--directory" : "landing-nav";
  const prefix = isStore ? "store-nav" : "landing-nav";
  const modalPrefix = isStore ? "store-info-modal" : "landing-info-modal";
  const isTiendas = activeCatalogTab === "tiendas";
  const activeClass = isStore ? "store-nav__link--active" : "landing-nav__link--active";

  useEffect(() => {
    if (!activeInfoModal) {
      return;
    }

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveInfoModal(null);
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [activeInfoModal]);

  useEffect(() => {
    if (isStore || !mobileNavOpen) return;

    const onResize = () => {
      if (window.innerWidth > 768) {
        setMobileNavOpen(false);
      }
    };

    const onDocMouseDown = (event: MouseEvent) => {
      const el = event.target as Node;
      if (landingNavRef.current?.contains(el)) return;
      setMobileNavOpen(false);
    };

    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileNavOpen(false);
    };

    window.addEventListener("resize", onResize);
    document.addEventListener("mousedown", onDocMouseDown);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("mousedown", onDocMouseDown);
      window.removeEventListener("keydown", onEsc);
    };
  }, [isStore, mobileNavOpen]);

  const closeMobileNav = () => setMobileNavOpen(false);

  return (
    <>
      <nav ref={!isStore ? landingNavRef : undefined} className={navClassName}>
        <Link href="/" className={`${prefix}__brand`} onClick={closeMobileNav}>
          <span className={`${prefix}__logo-box`}>
            <Image
              src="/images/logocuadre.png"
              alt="Tu Cuadre"
              width={32}
              height={32}
              priority
            />
          </span>
          {isStore ? (
            <span className="store-nav__brand-label">Tu Cuadre</span>
          ) : (
            "Tu Cuadre"
          )}
        </Link>

        {!isStore ? (
          <div className="landing-nav__links">
            <Link
              href="/catalog"
              className={`landing-nav__link ${activeCatalogTab && isTiendas ? activeClass : ""}`.trim()}
            >
              Tiendas
            </Link>
            <Link
              href="/catalog?tab=productos"
              className={`landing-nav__link ${activeCatalogTab && !isTiendas ? activeClass : ""}`.trim()}
            >
              Productos
            </Link>
            <a
              href={businessUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="landing-nav__link"
            >
              ¿Tienes un negocio?
            </a>
          </div>
        ) : (
          <div className={`${prefix}__links`}>
            <Link
              href="/catalog"
              className={`${prefix}__link ${activeCatalogTab && isTiendas ? activeClass : ""}`.trim()}
            >
              Tiendas
            </Link>
            <Link
              href="/catalog?tab=productos"
              className={`${prefix}__link ${activeCatalogTab && !isTiendas ? activeClass : ""}`.trim()}
            >
              Productos
            </Link>
            <a
              href={businessUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${prefix}__link`}
            >
              ¿Tienes un negocio?
            </a>
          </div>
        )}

        <div className={`${prefix}__actions`}>
          <button
            type="button"
            className={`${prefix}__icon-action`}
            onClick={() => setActiveInfoModal("about")}
            aria-label="Información sobre nosotros"
          >
            <Icon name="campaign" />
          </button>
          <button
            type="button"
            className={`${prefix}__icon-action`}
            onClick={() => setActiveInfoModal("help")}
            aria-label="Ayuda para comprar"
          >
            <Icon name="support_agent" />
          </button>
        </div>

        {!isStore ? (
          <>
            <button
              type="button"
              className="landing-nav__menu-toggle"
              aria-expanded={mobileNavOpen}
              aria-controls="landing-nav-mobile-menu"
              aria-label={mobileNavOpen ? "Cerrar menú" : "Abrir menú"}
              onClick={() => setMobileNavOpen((prev) => !prev)}
            >
              <Icon name={mobileNavOpen ? "close" : "menu"} />
            </button>
            {mobileNavOpen ? (
              <div id="landing-nav-mobile-menu" className="landing-nav__mobile-menu" role="menu">
                <Link
                  href="/catalog"
                  role="menuitem"
                  className="landing-nav__mobile-link"
                  onClick={closeMobileNav}
                >
                  Tiendas
                </Link>
                <Link
                  href="/catalog?tab=productos"
                  role="menuitem"
                  className="landing-nav__mobile-link"
                  onClick={closeMobileNav}
                >
                  Productos
                </Link>
                <a
                  href={businessUrl}
                  role="menuitem"
                  className="landing-nav__mobile-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeMobileNav}
                >
                  ¿Tienes un negocio?
                </a>
              </div>
            ) : null}
          </>
        ) : null}
      </nav>

      {activeInfoModal && (
        <div className={`${modalPrefix}__overlay`} onClick={() => setActiveInfoModal(null)}>
          <div
            className={modalPrefix}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={activeInfoModal === "about" ? "Información sobre nosotros" : "Ayuda para comprar"}
          >
            <div className={`${modalPrefix}__head`}>
              <h2 className={`${modalPrefix}__title`}>
                {activeInfoModal === "about" ? "Sobre Tu Cuadre" : "Cómo comprar en Tu Cuadre"}
              </h2>
              <button
                type="button"
                className={`${modalPrefix}__close`}
                onClick={() => setActiveInfoModal(null)}
                aria-label="Cerrar modal"
              >
                <Icon name="close" />
              </button>
            </div>
            <div className={`${modalPrefix}__body`}>
              {activeInfoModal === "about" ? (
                <>
                  <p className={`${modalPrefix}__lead`}>
                    Tu Cuadre conecta comercios locales con su comunidad para descubrir productos cercanos y pedir directamente por WhatsApp.
                  </p>
                  <ul className={`${modalPrefix}__list`}>
                    <li>
                      <Icon name="storefront" />
                      <span>Visibilizamos negocios locales en una vitrina digital simple.</span>
                    </li>
                    <li>
                      <Icon name="bolt" />
                      <span>Facilitamos pedidos rápidos, sin pasos complejos ni intermediarios.</span>
                    </li>
                    <li>
                      <Icon name="verified" />
                      <span>Mantenemos una experiencia clara para clientes y comercios.</span>
                    </li>
                  </ul>
                </>
              ) : (
                <>
                  <p className={`${modalPrefix}__lead`}>Comprar en Tu Cuadre es rápido y directo:</p>
                  <ul className={`${modalPrefix}__list`}>
                    <li>
                      <Icon name="search" />
                      <span>Explora tiendas o productos y agrega lo que necesites al carrito.</span>
                    </li>
                    <li>
                      <Icon name="shopping_cart" />
                      <span>Revisa tu pedido desde el botón flotante del carrito.</span>
                    </li>
                    <li>
                      <Icon name="chat" />
                      <span>Confirma tus datos y envía el pedido por WhatsApp a la tienda.</span>
                    </li>
                  </ul>
                  <p>El pago y la entrega se coordinan directamente con cada comercio.</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
