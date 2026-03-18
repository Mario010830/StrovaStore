"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import {
  useGetPublicCatalogQuery,
  useGetPublicLocationsQuery,
} from "../../../_service/catalogApi";

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function ProductDetailPage() {
  const params = useParams();
  const locationId = Number(params.locationId);
  const productId = Number(params.productId);

  const { data: products, isLoading, isError } = useGetPublicCatalogQuery(locationId);
  const { data: locations } = useGetPublicLocationsQuery();
  const loc = locations?.find((l) => l.id === locationId) ?? null;
  const product = products?.find((p) => p.id === productId) ?? null;
  const otherProducts = (products ?? []).filter((p) => p.id !== productId).slice(0, 4);

  const waNumber = loc?.whatsAppContact?.replace(/\D/g, "") ?? "";
  const waHref = waNumber ? `https://wa.me/${waNumber}` : "#";

  const isElaborado = product?.tipo === "elaborado";
  const inStock = isElaborado || (product?.stockAtLocation ?? 0) > 0;

  if (isLoading) {
    return (
      <div className="pd-page">
        <div className="pd-container">
          <div className="pd-skel" />
        </div>
      </div>
    );
  }

  if (!product || isError) {
    return (
      <div className="pd-page">
        <div className="pd-container">
          <div className="store-empty">
            <div className="store-empty__icon"><Icon name="inventory_2" /></div>
            <p className="store-empty__text">Producto no encontrado</p>
            <Link href={`/catalog/${locationId}`} className="store-empty__btn">
              Volver al catálogo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const categoryLabel = product.categoryName || "Productos";

  return (
    <div className="pd-page">
      <div className="pd-container">
        <nav className="pd-breadcrumb" aria-label="Navegación">
          <Link href="/catalog">Inicio</Link>
          <Icon name="chevron_right" />
          <span>{categoryLabel}</span>
          <Icon name="chevron_right" />
          <span>{loc?.name ?? "Tienda"}</span>
        </nav>

        <div className="pd-main">
          <div className="pd-gallery">
            <div className="pd-gallery__main">
              {product.imagenUrl ? (
                <img src={product.imagenUrl} alt={product.name} />
              ) : (
                <div className="pd-gallery__placeholder">
                  <Icon name="inventory_2" />
                </div>
              )}
            </div>
            <div className="pd-gallery__thumbs">
              {product.imagenUrl && (
                <button type="button" className="pd-thumb pd-thumb--active">
                  <img src={product.imagenUrl} alt="" />
                </button>
              )}
              {[2, 3].map((i) => (
                <div key={i} className="pd-thumb pd-thumb--placeholder" />
              ))}
            </div>
          </div>

          <div className="pd-info">
            <span className="pd-stock-tag" data-stock={inStock ? "true" : undefined}>
              {inStock ? "STOCK DISPONIBLE" : "NO DISPONIBLE"}
            </span>
            <h1 className="pd-title">{product.name}</h1>
            <div className="pd-price-row">
              <span className="pd-price">${product.precio.toFixed(2)}</span>
              {/* Optional discount tag - hide if no discount in API */}
            </div>

            <div className="pd-divider" />

            <div className="pd-seller">
              <div className="pd-seller__avatar">{getInitials(loc?.name ?? "?")}</div>
              <div className="pd-seller__text">
                <span className="pd-seller__name">{loc?.name ?? "Tienda"}</span>
                <span className="pd-seller__location">
                  <Icon name="location_on" />
                  — km
                </span>
              </div>
              <Link href={`/catalog/${locationId}`} className="pd-seller__link">
                Ver Tienda
              </Link>
            </div>

            <div className="pd-desc-block">
              <h2 className="pd-desc-title">Descripción del producto</h2>
              <p className="pd-desc-text">
                {product.description || "Sin descripción."}
              </p>
            </div>

            <div className="pd-features">
              <span className="pd-feature">
                <Icon name="bolt" /> 20V Potencia
              </span>
              <span className="pd-feature">
                <Icon name="settings_backup_restore" /> Garantía 1 año
              </span>
              <span className="pd-feature">
                <Icon name="local_shipping" /> Envío local
              </span>
            </div>

            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="pd-wa-btn"
              aria-label="Pedir por WhatsApp"
            >
              <Icon name="chat" />
              Pedir por WhatsApp
            </a>
            <p className="pd-wa-hint">
              Al hacer clic, se abrirá un chat directo con el vendedor
            </p>
          </div>
        </div>

        <section className="pd-others">
          <div className="pd-others__head">
            <h2 className="pd-others__title">Otros productos de esta tienda</h2>
            <Link href={`/catalog/${locationId}`} className="pd-others__link">
              Ver catálogo completo
              <Icon name="arrow_forward" />
            </Link>
          </div>
          <div className="pd-others__grid">
            {otherProducts.map((item) => (
              <Link
                key={item.id}
                href={`/catalog/${locationId}/product/${item.id}`}
                className="pd-other-card"
              >
                <div className="pd-other-card__img">
                  {item.imagenUrl ? (
                    <img src={item.imagenUrl} alt={item.name} />
                  ) : (
                    <Icon name="inventory_2" />
                  )}
                </div>
                <span className="pd-other-card__name">{item.name}</span>
                <span className="pd-other-card__price">${item.precio.toFixed(2)}</span>
              </Link>
            ))}
          </div>
        </section>

        <footer className="pd-footer">
          <div className="pd-footer__inner">
            <div className="pd-footer__brand-wrap">
              <span className="pd-footer__logo">
                <Icon name="storefront" />
              </span>
              <span className="pd-footer__brand">StrovaStore</span>
            </div>
            <p className="pd-footer__tagline">Descubrí el comercio local de tu ciudad.</p>
            <div className="pd-footer__links">
              <Link href="/catalog?tab=tiendas">Tiendas</Link>
              <Link href="/catalog?tab=productos">Productos</Link>
              <span>Ayuda</span>
            </div>
            <div className="pd-footer__bottom">
              <span className="pd-footer__copy">© 2024 StrovaStore. Powered by Strova.</span>
              <div className="pd-footer__social">
                <span aria-hidden><Icon name="instagram" /></span>
                <span aria-hidden><Icon name="facebook" /></span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
