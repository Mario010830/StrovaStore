import type { CartItem, PublicCatalogItem } from "@/lib/dashboard-types";

type PromoLike = Pick<
  PublicCatalogItem,
  "hasActivePromotion" | "originalPrecio" | "promotionType" | "promotionValue"
>;

type CartPromoLike = Pick<
  CartItem,
  "hasActivePromotion" | "originalUnitPrice" | "promotionType" | "promotionValue"
>;

export function getPromotionBadgeLabel(item: PromoLike | CartPromoLike): string | null {
  if (!item.hasActivePromotion) return null;
  if (item.promotionType === "percentage" && typeof item.promotionValue === "number") {
    return `-${Math.round(item.promotionValue)}%`;
  }
  return "Oferta";
}

export function getOriginalPriceForDisplay(item: PromoLike): number | null {
  if (!item.hasActivePromotion) return null;
  if (typeof item.originalPrecio !== "number") return null;
  if (item.originalPrecio <= 0) return null;
  return item.originalPrecio;
}

export function getOriginalUnitPriceForDisplay(item: CartPromoLike): number | null {
  if (!item.hasActivePromotion) return null;
  if (typeof item.originalUnitPrice !== "number") return null;
  if (item.originalUnitPrice <= 0) return null;
  return item.originalUnitPrice;
}
