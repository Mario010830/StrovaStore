"use client";

import { useEffect, useState } from "react";

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    setIsIos(ios);

    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) return;

    if (ios) {
      setShowBanner(true);
      return;
    }

    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
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
            <img src="/images/logo-claro-nobg.png" alt="StrovaStore" width={32} height={32} />
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
