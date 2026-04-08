"use client";

import { useEffect, useRef, useState, type SVGProps } from "react";
import Link from "next/link";
import Image from "next/image";
import { SOCIAL_URLS } from "@/lib/runtime-config";

function SocialInstagram(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 1-2.881.001 1.44 1.44 0 0 1 2.881-.001z" />
    </svg>
  );
}

function SocialFacebook(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function SocialTikTok(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.17-3.63-5.46-.02-.5-.01-1.01-.02-1.51 1.75 1.01 3.88 1.57 5.98 1.48 1.11-.06 2.2-.4 3.1-1.06.84-.6 1.45-1.47 1.73-2.46.31-1.34.21-2.8-.36-4.05-.58-1.3-1.7-2.3-2.99-2.92-.48-.23-1-.4-1.54-.52V.02z" />
    </svg>
  );
}

function SocialYouTube(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

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
                src="/images/logocuadre.png"
                alt="Tu Cuadre"
                width={20}
                height={20}
              />
            </span>
            Tu Cuadre
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
            </div>
            <div className="landing-footer__col">
              <div className="landing-footer__col-title">Negocios</div>
              <a href={businessUrl} target="_blank" rel="noopener noreferrer">
                Vender en Tu Cuadre
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
              <Link href="/terms">Términos</Link>
              <Link href="/privacy">Privacidad</Link>
            </div>
          </div>

          {(SOCIAL_URLS.instagram || SOCIAL_URLS.facebook || SOCIAL_URLS.tiktok || SOCIAL_URLS.youtube) && (
            <div className="landing-footer__socials">
              <span>Síguenos</span>
              {SOCIAL_URLS.instagram && (
                <a href={SOCIAL_URLS.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="landing-footer__social-link">
                  <SocialInstagram className="landing-footer__social-icon" />
                </a>
              )}
              {SOCIAL_URLS.facebook && (
                <a href={SOCIAL_URLS.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="landing-footer__social-link">
                  <SocialFacebook className="landing-footer__social-icon" />
                </a>
              )}
              {SOCIAL_URLS.tiktok && (
                <a href={SOCIAL_URLS.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="landing-footer__social-link">
                  <SocialTikTok className="landing-footer__social-icon" />
                </a>
              )}
              {SOCIAL_URLS.youtube && (
                <a href={SOCIAL_URLS.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="landing-footer__social-link">
                  <SocialYouTube className="landing-footer__social-icon" />
                </a>
              )}
            </div>
          )}
        </div>

        <div className="landing-footer__divider" />
        <div className="landing-footer__bottom">
          <span>© 2026 Tu Cuadre.</span>
        </div>
      </div>
    </footer>
  );
}
