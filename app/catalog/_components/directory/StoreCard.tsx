"use client";

import { createElement, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { LayoutGrid, Store } from "lucide-react";
import type { PublicLocation } from "@/lib/dashboard-types";
import { toImageProxyUrl } from "@/lib/image";
import { getBusinessCategoryLucideIcon } from "@/utils/businessCategoryIcons";

function formatDistanceKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

export type StoreCardProps = {
  loc: PublicLocation;
  businessCategoryDisplay: string | null;
  distanceKm: number | null;
  zoneLabel?: string | null;
};

function StoreCardInner({ loc, businessCategoryDisplay, distanceKm, zoneLabel }: StoreCardProps) {
  const hasHours = !!loc.businessHours;
  const showStatus = hasHours && loc.isOpenNow != null;
  const isOpen = loc.isOpenNow === true;
  const proxiedImageUrl = toImageProxyUrl(loc.photoUrl);
  const BizIcon = businessCategoryDisplay
    ? getBusinessCategoryLucideIcon(businessCategoryDisplay)
    : LayoutGrid;

  return (
    <Link href={`/catalog/${loc.id}`} className="dir-store-card">
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
          <div className="dir-store-card__biz">
            {createElement(BizIcon, {
              className: "dir-store-card__biz-icon",
              size: 12,
              strokeWidth: 2,
              "aria-hidden": true,
            })}
            <span className="dir-store-card__biz-label">{businessCategoryDisplay}</span>
          </div>
        ) : null}
        {zoneLabel ? <p className="dir-store-card__zone">{zoneLabel}</p> : null}
        {distanceKm != null ? (
          <p className="dir-store-card__distance">{formatDistanceKm(distanceKm)}</p>
        ) : null}
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
          <span className="dir-store-card__cta">Ver tienda →</span>
        </div>
      </div>
    </Link>
  );
}

export const StoreCard = memo(StoreCardInner);
