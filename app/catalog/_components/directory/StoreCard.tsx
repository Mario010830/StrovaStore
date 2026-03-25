"use client";

import { createElement, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { LayoutGrid, Store } from "lucide-react";
import type { PublicLocation } from "@/lib/dashboard-types";
import { toImageProxyUrl } from "@/lib/image";
import { getBusinessCategoryLucideIcon } from "@/utils/businessCategoryIcons";
import { formatDistanceForCard } from "@/app/catalog/lib/directory-filters";
import { buildLocationCatalogPath } from "@/lib/location-path";
import { useFavoriteStore } from "@/hooks/useFavorites";
import { CardFavoriteButton } from "@/components/ui/CardFavoriteButton";

export type StoreCardProps = {
  loc: PublicLocation;
  businessCategoryDisplay: string | null;
  distanceKm: number | null;
  zoneLabel?: string | null;
};

function StoreCardInner({ loc, businessCategoryDisplay, distanceKm, zoneLabel }: StoreCardProps) {
  const { isFavorite, toggle } = useFavoriteStore(loc.id);
  const hasHours = !!loc.businessHours;
  const showStatus = hasHours && loc.isOpenNow != null;
  const isOpen = loc.isOpenNow === true;
  const proxiedImageUrl = toImageProxyUrl(loc.photoUrl);
  const BizIcon = businessCategoryDisplay
    ? getBusinessCategoryLucideIcon(businessCategoryDisplay)
    : LayoutGrid;
  const distanceText = formatDistanceForCard(distanceKm);

  return (
    <div className="sp-card sp-card--store">
      <Link href={buildLocationCatalogPath(loc)} className="sp-card__link">
        <div className="sp-card__img-wrap">
          {proxiedImageUrl ? (
            <Image
              src={proxiedImageUrl}
              alt={loc.name}
              fill
              className="sp-card__img"
              sizes="(max-width: 599px) 160px, min(280px, 45vw)"
            />
          ) : (
            <div className="sp-card__img-placeholder">
              <Store className="sp-card__placeholder-icon" size={32} strokeWidth={1.5} aria-hidden />
            </div>
          )}
        </div>
        <div className="sp-card__body">
          <h3 className="sp-card__name sp-card__name--store">{loc.name}</h3>
          {businessCategoryDisplay ? (
            <div className="sp-card__directory-meta">
              {createElement(BizIcon, {
                className: "sp-card__biz-icon",
                size: 12,
                strokeWidth: 2,
                "aria-hidden": true,
              })}
              <span className="sp-card__biz-label">{businessCategoryDisplay}</span>
              {zoneLabel ? (
                <>
                  <span className="sp-card__meta-sep" aria-hidden>
                    ·
                  </span>
                  <span className="sp-card__zone-inline">{zoneLabel}</span>
                </>
              ) : null}
              {distanceText ? (
                <>
                  <span className="sp-card__meta-sep" aria-hidden>
                    ·
                  </span>
                  <span className="sp-card__distance-inline">{distanceText}</span>
                </>
              ) : null}
            </div>
          ) : (
            <>
              {zoneLabel ? <p className="sp-card__zone">{zoneLabel}</p> : null}
              {distanceText ? <p className="sp-card__distance">{distanceText}</p> : null}
            </>
          )}
          <div
            className={`sp-card__directory-bottom${showStatus ? "" : " sp-card__directory-bottom--solo"}`}
          >
            {showStatus ? (
              <span className="sp-card__status">
                <span
                  className={`sp-card__status-dot${isOpen ? " sp-card__status-dot--open" : " sp-card__status-dot--closed"}`}
                  aria-hidden
                />
                {isOpen ? "Abierto" : "Cerrado"}
              </span>
            ) : null}
            <span className="sp-card__cta-text">Ver tienda</span>
          </div>
        </div>
      </Link>
      <CardFavoriteButton
        isFavorite={isFavorite}
        onToggle={toggle}
        labelOn="Quitar tienda de favoritos"
        labelOff="Guardar tienda en favoritos"
        className="sp-card__fav"
      />
    </div>
  );
}

export const StoreCard = memo(StoreCardInner);
