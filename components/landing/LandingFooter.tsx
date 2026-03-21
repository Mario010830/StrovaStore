"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/ui/Icon";

interface LandingFooterProps {
  businessUrl: string;
}

export function LandingFooter({ businessUrl }: LandingFooterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const expandScrollAnchorRef = useRef<number | null>(null);

  useEffect(() => {
    const EXPAND_TOLERANCE_PX = 2;
    const COLLAPSE_DELTA_PX = 96;

    const updateExpandedState = () => {
      const scrollTop = window.scrollY;
      const viewportBottom = scrollTop + window.innerHeight;
      const pageBottom = document.documentElement.scrollHeight;
      const atBottom = viewportBottom >= pageBottom - EXPAND_TOLERANCE_PX;

      setIsExpanded((prev) => {
        if (!prev && atBottom) {
          expandScrollAnchorRef.current = scrollTop;
          return true;
        }

        if (prev) {
          const anchor = expandScrollAnchorRef.current ?? scrollTop;
          const userScrolledUpEnough = scrollTop < anchor - COLLAPSE_DELTA_PX;
          if (userScrolledUpEnough) {
            expandScrollAnchorRef.current = null;
            return false;
          }
        }

        return prev;
      });
    };

    updateExpandedState();
    window.addEventListener("scroll", updateExpandedState, { passive: true });
    window.addEventListener("resize", updateExpandedState);
    return () => {
      window.removeEventListener("scroll", updateExpandedState);
      window.removeEventListener("resize", updateExpandedState);
    };
  }, []);

  return (
    <footer className={`landing-footer ${isExpanded ? "landing-footer--expanded" : ""}`}>
      <div className="landing-footer__inner landing-shell">
        <div className="landing-footer__compact">
          <Link href="/" className="landing-footer__brand">
            <span className="landing-nav__logo-box" style={{ width: 28, height: 28 }}>
              <Image
                src="/images/logo-claro-nobg.png"
                alt="StrovaStore"
                width={20}
                height={20}
              />
            </span>
            StrovaStore
          </Link>
          <p className="landing-footer__compact-text">Conectando comercios locales con su comunidad.</p>
        </div>

        <div id="landing-footer-panel" className="landing-footer__panel">
          <div className="landing-footer__links">
            <div className="landing-footer__col">
              <div className="landing-footer__col-title">Explorar</div>
              <Link href="/catalog">Tiendas</Link>
              <Link href="/catalog?tab=productos">Productos</Link>
              <Link href="/catalog?tab=productos">Categorías</Link>
              {/* TODO: crear filtro por categoría para deep-link real desde footer. */}
            </div>
            <div className="landing-footer__col">
              <div className="landing-footer__col-title">Negocios</div>
              <a href={businessUrl} target="_blank" rel="noopener noreferrer">
                Vender en Strova
              </a>
              <a href={businessUrl} target="_blank" rel="noopener noreferrer">
                Precios
              </a>
              <a href={businessUrl} target="_blank" rel="noopener noreferrer">
                Ayuda
              </a>
            </div>
            <div className="landing-footer__col">
              <div className="landing-footer__col-title">Legal</div>
              <Link href="#">Términos</Link>
              <Link href="#">Privacidad</Link>
              {/* TODO: reemplazar href="#" por rutas legales reales cuando existan. */}
            </div>
          </div>

          <div className="landing-footer__socials">
            <span>Seguinos</span>
            {/* TODO: agregar URLs reales de redes sociales. */}
            <a href="#" aria-label="Instagram"><Icon name="photo_camera" /></a>
            <a href="#" aria-label="Facebook"><Icon name="groups" /></a>
            <a href="#" aria-label="TikTok"><Icon name="play_circle" /></a>
            <a href="#" aria-label="YouTube"><Icon name="smart_display" /></a>
          </div>
        </div>

        <div className="landing-footer__divider" />
        <div className="landing-footer__bottom">
          <span>© 2026 StrovaStore. Powered by Strova.</span>
        </div>
      </div>
    </footer>
  );
}
