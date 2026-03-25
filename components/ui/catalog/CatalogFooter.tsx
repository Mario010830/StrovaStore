"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export function CatalogFooter() {
  return (
    <footer className="cx-footer" aria-label="Pie de página del catálogo">
      <div className="cx-footer__inner">
        <div className="cx-footer__brand">
          <span className="cx-footer__logo" aria-hidden>
            <Icon name="shopping_bag" />
          </span>
          <span className="cx-footer__name">StrovaStore</span>
        </div>

        <div className="cx-footer__cols">
          <div className="cx-footer__col">
            <div className="cx-footer__colTitle">Explorar</div>
            <Link href="/catalog">Tiendas</Link>
            <Link href="/catalog/productos">Productos</Link>
          </div>
          <div className="cx-footer__col">
            <div className="cx-footer__colTitle">Ayuda</div>
            <Link href="/catalog/productos">Envíos y devoluciones</Link>
            <Link href="/catalog/productos">Preguntas frecuentes</Link>
          </div>
        </div>

        <div className="cx-footer__bottom">
          <div className="cx-footer__legal">© {new Date().getFullYear()} StrovaStore</div>
          <div className="cx-footer__links">
            <Link href="/">Inicio</Link>
            <a href="#" onClick={(e) => e.preventDefault()}>
              Privacidad
            </a>
            <a href="#" onClick={(e) => e.preventDefault()}>
              Condiciones
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

