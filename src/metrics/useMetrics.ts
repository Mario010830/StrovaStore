"use client";

import { useCallback } from "react";
import { buildBaseMetricsFields, sendEvent } from "./metricsClient";
import { detectSource } from "./sourceDetector";
import { clearPendingCartStorage, updatePendingCartAfterAdd } from "./pendingCart";

export function useMetrics() {
  const trackCatalogView = useCallback((businessId: string) => {
    sendEvent(
      buildBaseMetricsFields({
        eventType: "catalog_view",
        businessId,
        source: detectSource(),
      }),
    );
  }, []);

  const trackProductView = useCallback((businessId: string, productId: number | string) => {
    sendEvent(
      buildBaseMetricsFields({
        eventType: "product_view",
        businessId,
        productId: String(productId),
      }),
    );
  }, []);

  const trackFavorite = useCallback((businessId: string, productId: number | string) => {
    sendEvent(
      buildBaseMetricsFields({
        eventType: "product_favorited",
        businessId,
        productId: String(productId),
      }),
    );
  }, []);

  const trackAddToCart = useCallback(
    (businessId: string, productId: number | string, cartId?: string | null) => {
      const cid = updatePendingCartAfterAdd(businessId, productId, cartId);
      sendEvent(
        buildBaseMetricsFields({
          eventType: "add_to_cart",
          businessId,
          productId: String(productId),
          cartId: cid,
        }),
      );
    },
    [],
  );

  const trackPurchase = useCallback((businessId: string, orderId: string) => {
    clearPendingCartStorage();
    sendEvent(
      buildBaseMetricsFields({
        eventType: "purchase_completed",
        businessId,
        orderId,
        productId: null,
      }),
    );
  }, []);

  const trackSearch = useCallback((businessId: string, searchTerm: string) => {
    const q = searchTerm.trim();
    if (!q) return;
    sendEvent(
      buildBaseMetricsFields({
        eventType: "search_performed",
        businessId,
        searchTerm: q,
      }),
    );
  }, []);

  return {
    trackCatalogView,
    trackProductView,
    trackFavorite,
    trackAddToCart,
    trackPurchase,
    trackSearch,
  };
}
