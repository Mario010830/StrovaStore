"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { skipToken } from "@reduxjs/toolkit/query";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import { getPublicCatalogGalleryProxyUrls } from "@/lib/catalog-gallery";
import { toImageProxyUrl } from "@/lib/image";
import { PriceText } from "@/components/ui/PriceText";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getRtkErrorInfo } from "@/lib/rtk-error";
import {
  QUERY_POLLING_OPTIONS,
  useGetPublicCatalogQuery,
  useGetPublicLocationsQuery,
} from "../../../_service/catalogApi";
import { getProductCardSubtitle } from "@/lib/catalog-display";
import { buildLocationCatalogPath, parseLocationRouteParam } from "@/lib/location-path";
import { getOriginalPriceForDisplay, getPromotionBadgeLabel } from "@/lib/catalog-promotion";

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
  const locationSlugParam = String(params.locationSlug ?? "");
  const locationId = useMemo(
    () => parseLocationRouteParam(locationSlugParam),
    [locationSlugParam],
  );
  const productId = Number(params.productId);

  const { data: products, isLoading, isError, error } = useGetPublicCatalogQuery(
    locationId != null ? locationId : skipToken,
    QUERY_POLLING_OPTIONS.storeCatalog,
  );
  const { data: locations } = useGetPublicLocationsQuery(undefined, QUERY_POLLING_OPTIONS.general);
  const loc =
    locationId != null ? (locations?.find((l) => l.id === locationId) ?? null) : null;

  const catalogBasePath = useMemo(() => {
    if (locationId == null) return "/catalog";
    if (loc) return buildLocationCatalogPath(loc);
    return `/catalog/${locationSlugParam}`;
  }, [locationId, loc, locationSlugParam]);
  const product = products?.find((p) => p.id === productId) ?? null;
  const otherProducts = (products ?? []).filter((p) => p.id !== productId).slice(0, 4);

  const waNumber = loc?.whatsAppContact?.replace(/\D/g, "") ?? "";
  const waHref = waNumber ? `https://wa.me/${waNumber}` : "#";

  const isElaborado = product?.tipo === "elaborado";
  const inStock = isElaborado || (product?.stockAtLocation ?? 0) > 0;

  const galleryUrls = useMemo(
    () => (product ? getPublicCatalogGalleryProxyUrls(product) : []),
    [product],
  );
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  useEffect(() => {
    setActiveImageIdx(0);
  }, [productId]);

  const errorInfo = getRtkErrorInfo(error);

  if (locationId == null) {
    return (
      <div className="pd-page">
        <div className="pd-container">
          <div className="store-empty">
            <div className="store-empty__icon"><Icon name="link_off" /></div>
            <p className="store-empty__text">Esta dirección no es válida.</p>
            <Link href="/catalog" className="store-empty__btn">
              Volver al directorio
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
            <Link href={catalogBasePath} className="store-empty__btn">
              Volver al catálogo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const categoryLabel = product.categoryName || "Productos";
  const mainImageUrl = galleryUrls[activeImageIdx] ?? null;
  const promoBadge = getPromotionBadgeLabel(product);
  const originalPrice = getOriginalPriceForDisplay(product);

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
              {mainImageUrl ? (
                <Image src={mainImageUrl} alt={product.name} width={720} height={720} priority />
              ) : (
                <div className="pd-gallery__placeholder">
                  <Icon name="inventory_2" />
                </div>
              )}
            </div>
            {galleryUrls.length > 1 ? (
              <div className="pd-gallery__thumbs" role="tablist" aria-label="Imágenes del producto">
                {galleryUrls.map((url, i) => (
                  <button
                    key={`${url}-${i}`}
                    type="button"
                    role="tab"
                    aria-selected={i === activeImageIdx}
                    className={`pd-thumb${i === activeImageIdx ? " pd-thumb--active" : ""}`}
                    onClick={() => setActiveImageIdx(i)}
                    aria-label={`Imagen ${i + 1} de ${galleryUrls.length}`}
                  >
                    <Image src={url} alt="" width={120} height={120} />
                  </button>
                ))}
              </div>
            ) : null}
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
              {promoBadge ? <span className="pd-promo-pill">{promoBadge}</span> : null}
              <PriceText value={product.precio} className="pd-price" />
              {originalPrice != null ? (
                <PriceText value={originalPrice} className="pd-price-old" />
              ) : null}
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
              <Link href={catalogBasePath} className="pd-seller__link">
                Ver Tienda
              </Link>
            </div>

            <div className="pd-desc-block">
              <h2 className="pd-desc-title">Descripción del producto</h2>
              <p className="pd-desc-text">
                {getProductCardSubtitle(product) ?? "Sin descripción."}
              </p>
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
            <Link href={catalogBasePath} className="pd-others__link">
              Ver catálogo completo
              <Icon name="arrow_forward" />
            </Link>
          </div>
          <div className="pd-others__grid">
            {otherProducts.map((item) => (
              (() => {
                const otherOriginalPrice = getOriginalPriceForDisplay(item);
                return (
                  <Link
                    key={item.id}
                    href={`${catalogBasePath}/product/${item.id}`}
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
                    <div className="pd-other-card__price-wrap">
                      <PriceText value={item.precio} className="pd-other-card__price" />
                      {otherOriginalPrice != null ? (
                        <PriceText
                          value={otherOriginalPrice}
                          className="pd-other-card__price-old"
                        />
                      ) : null}
                    </div>
                  </Link>
                );
              })()
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
