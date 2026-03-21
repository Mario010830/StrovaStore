"use client";

import { useEffect, useState } from "react";
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

  return (
    <>
      <nav className={navClassName}>
        <Link href="/" className={`${prefix}__brand`}>
          <span className={`${prefix}__logo-box`}>
            <Image
              src="/images/logo-claro-nobg.png"
              alt="StrovaStore"
              width={32}
              height={32}
              priority
            />
          </span>
          {isStore ? (
            <span className="store-nav__brand-label">StrovaStore</span>
          ) : (
            "StrovaStore"
          )}
        </Link>

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
            ¿Tenés un negocio?
          </a>
        </div>

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
                {activeInfoModal === "about" ? "Sobre StrovaStore" : "Cómo comprar en StrovaStore"}
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
                    StrovaStore conecta comercios locales con su comunidad para descubrir productos cercanos y pedir directo por WhatsApp.
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
                  <p className={`${modalPrefix}__lead`}>Comprar en StrovaStore es rápido y directo:</p>
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
