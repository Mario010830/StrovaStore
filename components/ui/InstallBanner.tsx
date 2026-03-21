"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function InstallBanner() {
  const isBrowser = typeof window !== "undefined";
  const dismissed =
    isBrowser && !!window.localStorage.getItem("pwa-install-dismissed");
  const isIos =
    isBrowser && /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
  const isInstalled =
    isBrowser && window.matchMedia("(display-mode: standalone)").matches;
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(
    !dismissed && isIos,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (dismissed || isIos) return;

    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [dismissed, isIos]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  if (!showBanner || isInstalled) return null;

  return (
    <div className="install-banner">
      {isIos ? (
        <>
          <span>
            Instalá StrovaStore: tocá
            <strong> Compartir </strong> →
            <strong> Agregar a inicio</strong>
          </span>
          <button type="button" onClick={handleDismiss} aria-label="Cerrar">
            ✕
          </button>
        </>
      ) : (
        <>
          <div className="install-banner__logo">
            <Image src="/images/logo-claro-nobg.png" alt="StrovaStore" width={32} height={32} />
          </div>
          <span>Instalá StrovaStore en tu dispositivo</span>
          <button type="button" onClick={handleInstall} className="install-banner__btn install-banner__btn--primary">
            Instalar
          </button>
          <button type="button" onClick={handleDismiss} className="install-banner__btn install-banner__btn--dismiss">
            Ahora no
          </button>
        </>
      )}
    </div>
  );
}
