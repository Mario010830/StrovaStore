"use client";

import { PriceText } from "./PriceText";

export type PromoInfo = {
  hasActivePromotion: boolean;
  promotionType?: "percentage" | "fixed" | null;
  promotionValue?: number | null;
  promotionId?: number | null;
  originalPrice: number;
  currentPrice: number;
};

function getPromoBadgeLabel(item: PromoInfo): string | null {
  if (!item.hasActivePromotion) return null;
  if (
    item.promotionType === "percentage" &&
    typeof item.promotionValue === "number"
  ) {
    return `${Math.round(item.promotionValue)}%`;
  }
  return "Oferta";
}

export function PromoBadge({ item }: { item: PromoInfo }) {
  const label = getPromoBadgeLabel(item);
  if (!label) return null;

  return (
    <div className="promo-badge-wrap">
      <span className="promo-badge">{label}</span>
      <div className="promo-prices">
        <PriceText
          value={item.originalPrice}
          className="promo-price-old"
        />
        <PriceText value={item.currentPrice} className="promo-price" />
      </div>
    </div>
  );
}
