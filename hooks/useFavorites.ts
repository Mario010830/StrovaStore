"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  getFavoriteProductSnapshot,
  getFavoriteStoreSnapshot,
  subscribeFavorites,
  toggleFavoriteProduct,
  toggleFavoriteStore,
} from "@/lib/favorites";

export function useFavoriteStore(locationId: number) {
  const isFavorite = useSyncExternalStore(
    subscribeFavorites,
    () => getFavoriteStoreSnapshot(locationId),
    () => false,
  );

  const toggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFavoriteStore(locationId);
    },
    [locationId],
  );

  return { isFavorite, toggle };
}

export function useFavoriteProduct(locationId: number, productId: number) {
  const isFavorite = useSyncExternalStore(
    subscribeFavorites,
    () => getFavoriteProductSnapshot(locationId, productId),
    () => false,
  );

  const toggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFavoriteProduct(locationId, productId);
    },
    [locationId, productId],
  );

  return { isFavorite, toggle };
}
