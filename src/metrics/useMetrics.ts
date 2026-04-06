"use client";

import { useCallback } from "react";
import { buildBaseMetricsFields, sendEvent } from "./metricsClient";
import { detectSource } from "./sourceDetector";
import { updatePendingCartAfterAdd } from "./pendingCart";

function send(batch: ReturnType<typeof buildBaseMetricsFields>): void {
  if (batch) sendEvent(batch);
}

export function useMetrics() {
  const trackCatalogView = useCallback((locationId: string) => {
    send(
      buildBaseMetricsFields({
        eventType: "catalog_visit",
        locationId,
        source: detectSource(),
      }),
    );
  }, []);

  const trackProductView = useCallback((locationId: string, productId: number | string) => {
    send(
      buildBaseMetricsFields({
        eventType: "product_view",
        locationId,
        productId: String(productId),
      }),
    );
  }, []);

  const trackFavorite = useCallback((locationId: string, productId: number | string) => {
    send(
      buildBaseMetricsFields({
        eventType: "product_favorited",
        locationId,
        productId: String(productId),
      }),
    );
  }, []);

  const trackAddToCart = useCallback(
    (locationId: string, productId: number | string, cartId?: string | null) => {
      const cid = updatePendingCartAfterAdd(locationId, productId, cartId);
      send(
        buildBaseMetricsFields({
          eventType: "add_to_cart",
          locationId,
          productId: String(productId),
          cartId: cid,
        }),
      );
    },
    [],
  );

  const trackSearch = useCallback((locationId: string, searchTerm: string) => {
    const q = searchTerm.trim();
    if (!q) return;
    send(
      buildBaseMetricsFields({
        eventType: "catalog_search",
        locationId,
        searchTerm: q,
      }),
    );
  }, []);

  return {
    trackCatalogView,
    trackProductView,
    trackFavorite,
    trackAddToCart,
    trackSearch,
  };
}
