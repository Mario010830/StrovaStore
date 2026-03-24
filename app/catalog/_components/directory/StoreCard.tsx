"use client";

import { createElement, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { LayoutGrid, Store } from "lucide-react";
import type { PublicLocation } from "@/lib/dashboard-types";
import { toImageProxyUrl } from "@/lib/image";
import { getBusinessCategoryLucideIcon } from "@/utils/businessCategoryIcons";
import { formatDistanceForCard } from "@/app/catalog/lib/directory-filters";
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
    <div className="dir-store-card">
      <Link href={`/catalog/${loc.id}`} className="dir-store-card__link">
      <div className="dir-store-card__media">
        {proxiedImageUrl ? (
          <Image
            src={proxiedImageUrl}
            alt={loc.name}
            fill
            className="dir-store-card__img"
            sizes="(max-width: 599px) 160px, min(280px, 45vw)"
          />
        ) : (
          <div className="dir-store-card__placeholder">
            <Store className="dir-store-card__placeholder-icon" size={32} strokeWidth={1.5} aria-hidden />
          </div>
        )}
      </div>
      <div className="dir-store-card__body">
        <h3 className="dir-store-card__name">{loc.name}</h3>
        {businessCategoryDisplay ? (
          <div className="dir-store-card__meta">
            {createElement(BizIcon, {
              className: "dir-store-card__biz-icon",
              size: 12,
              strokeWidth: 2,
              "aria-hidden": true,
            })}
            <span className="dir-store-card__biz-label">{businessCategoryDisplay}</span>
            {zoneLabel ? (
              <>
                <span className="dir-store-card__meta-sep" aria-hidden>
                  ·
                </span>
                <span className="dir-store-card__zone-inline">{zoneLabel}</span>
              </>
            ) : null}
            {distanceText ? (
              <>
                <span className="dir-store-card__meta-sep" aria-hidden>
                  ·
                </span>
                <span className="dir-store-card__distance-inline">{distanceText}</span>
              </>
            ) : null}
          </div>
        ) : (
          <>
            {zoneLabel ? <p className="dir-store-card__zone">{zoneLabel}</p> : null}
            {distanceText ? <p className="dir-store-card__distance">{distanceText}</p> : null}
          </>
        )}
        <div
          className={`dir-store-card__bottom${showStatus ? "" : " dir-store-card__bottom--solo"}`}
        >
          {showStatus ? (
            <span className="dir-store-card__status">
              <span
                className={`dir-store-card__dot${isOpen ? " dir-store-card__dot--open" : " dir-store-card__dot--closed"}`}
                aria-hidden
              />
              {isOpen ? "Abierto" : "Cerrado"}
            </span>
          ) : null}
          <span className="dir-store-card__cta">Ver tienda</span>
        </div>
      </div>
      </Link>
      <CardFavoriteButton
        isFavorite={isFavorite}
        onToggle={toggle}
        labelOn="Quitar tienda de favoritos"
        labelOff="Guardar tienda en favoritos"
        className="dir-store-card__fav"
      />
    </div>
  );
}

export const StoreCard = memo(StoreCardInner);
