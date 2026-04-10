"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

type Vista = "tiendas" | "productos";

export function CatalogMobileVistaMenu({ active }: { active: Vista }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div className="catalog-mob-vista-menu" ref={wrapRef}>
      <button
        type="button"
        className="catalog-mob-vista-menu__trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label={open ? "Cerrar menú de vistas" : "Elegir vista: tiendas o productos"}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="more_vert" />
      </button>
      {open ? (
        <div id={menuId} className="catalog-mob-vista-menu__popover" role="menu">
          <Link
            href="/catalog"
            role="menuitem"
            className={`catalog-mob-vista-menu__item${active === "tiendas" ? " catalog-mob-vista-menu__item--active" : ""}`}
            onClick={() => setOpen(false)}
          >
            Ver tiendas
          </Link>
          <Link
            href="/catalog?tab=productos"
            role="menuitem"
            className={`catalog-mob-vista-menu__item${active === "productos" ? " catalog-mob-vista-menu__item--active" : ""}`}
            onClick={() => setOpen(false)}
          >
            Ver productos
          </Link>
        </div>
      ) : null}
    </div>
  );
}
