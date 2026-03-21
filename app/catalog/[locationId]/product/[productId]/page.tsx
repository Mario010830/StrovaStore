"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import { toImageProxyUrl } from "@/lib/image";
import { PriceText } from "@/components/ui/PriceText";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getRtkErrorInfo } from "@/lib/rtk-error";
import {
  QUERY_POLLING_OPTIONS,
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

  const { data: products, isLoading, isError, error } = useGetPublicCatalogQuery(
    locationId,
    QUERY_POLLING_OPTIONS.storeCatalog,
  );
  const { data: locations } = useGetPublicLocationsQuery(undefined, QUERY_POLLING_OPTIONS.general);
  const loc = locations?.find((l) => l.id === locationId) ?? null;
  const product = products?.find((p) => p.id === productId) ?? null;
  const otherProducts = (products ?? []).filter((p) => p.id !== productId).slice(0, 4);

  const waNumber = loc?.whatsAppContact?.replace(/\D/g, "") ?? "";
  const waHref = waNumber ? `https://wa.me/${waNumber}` : "#";

  const isElaborado = product?.tipo === "elaborado";
  const inStock = isElaborado || (product?.stockAtLocation ?? 0) > 0;

  const productImageUrl = toImageProxyUrl(product?.imagenUrl);
  const errorInfo = getRtkErrorInfo(error);

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
            <p className="store-empty__text">
              {isError ? `${errorInfo.title}: ${errorInfo.message}` : "Producto no encontrado"}
            </p>
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
              {productImageUrl ? (
                <Image src={productImageUrl} alt={product.name} width={720} height={720} />
              ) : (
                <div className="pd-gallery__placeholder">
                  <Icon name="inventory_2" />
                </div>
              )}
            </div>
            <div className="pd-gallery__thumbs">
              {productImageUrl && (
                <button type="button" className="pd-thumb pd-thumb--active">
                  <Image src={productImageUrl} alt="" width={120} height={120} />
                </button>
              )}
              {[2, 3].map((i) => (
                <div key={i} className="pd-thumb pd-thumb--placeholder" />
              ))}
            </div>
          </div>

          <div className="pd-info">
            <StatusBadge
              label={inStock ? "STOCK DISPONIBLE" : "NO DISPONIBLE"}
              className="pd-stock-tag"
              active={inStock}
              dataStock={inStock}
            />
            <h1 className="pd-title">{product.name}</h1>
            <div className="pd-price-row">
              <PriceText value={product.precio} className="pd-price" />
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
                  {item.imagenUrl ? (() => {
                    const proxiedUrl = toImageProxyUrl(item.imagenUrl);
                    return proxiedUrl ? <Image src={proxiedUrl} alt={item.name} width={240} height={160} /> : <Icon name="inventory_2" />;
                  })() : (
                    <Icon name="inventory_2" />
                  )}
                </div>
                <span className="pd-other-card__name">{item.name}</span>
                <PriceText value={item.precio} className="pd-other-card__price" />
              </Link>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
