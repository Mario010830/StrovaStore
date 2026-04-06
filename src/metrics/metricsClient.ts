import { getApiUrl } from "@/lib/auth-api";
import { getSessionId } from "./sessionId";

/** Valores alineados con el backend (catalog_visit, catalog_search, etc.). */
export type MetricsEventType =
  | "catalog_visit"
  | "product_view"
  | "product_favorited"
  | "add_to_cart"
  | "cart_abandoned"
  | "catalog_search";

export interface CatalogMetricsEventItem {
  eventType: string;
  productId?: string;
  searchTerm?: string;
  source?: string;
  orderId?: string;
  durationSeconds?: number;
}

export interface CatalogMetricsBatchRequest {
  locationId: string;
  sessionId: string;
  events: CatalogMetricsEventItem[];
}

function authHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};
  try {
    for (const key of ["access_token", "token", "auth_token", "jwt"]) {
      const token = window.localStorage.getItem(key)?.trim();
      if (token) return { Authorization: `Bearer ${token}` };
    }
  } catch {
    // ignore
  }
  return {};
}

/**
 * Fire-and-forget POST to the metrics API. Never throws; errors are swallowed.
 * Sin locationId no se envía (el backend resuelve organización desde la tienda).
 */
export function sendEvent(payload: CatalogMetricsBatchRequest): void {
  if (typeof window === "undefined") return;
  if (!payload.locationId?.trim()) return;

  void fetch(`${getApiUrl()}/public/metrics/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  }).catch(() => {
    // intentionally silent
  });
}

export function buildBaseMetricsFields(overrides: {
  eventType: MetricsEventType;
  /** ID numérico de la ubicación/tienda (Location), como string. */
  locationId: string;
  productId?: string | null;
  source?: string | null;
  searchTerm?: string | null;
  cartId?: string | null;
  orderId?: string | null;
}): CatalogMetricsBatchRequest {
  const item: CatalogMetricsEventItem = { eventType: overrides.eventType };
  if (overrides.productId != null && overrides.productId !== "") {
    item.productId = String(overrides.productId);
  }
  if (overrides.searchTerm != null && overrides.searchTerm !== "") {
    item.searchTerm = overrides.searchTerm;
  }
  if (overrides.source != null && overrides.source !== "") {
    item.source = overrides.source;
  }
  if (overrides.orderId != null && overrides.orderId !== "") {
    item.orderId = overrides.orderId;
  }

  return {
    locationId: overrides.locationId.trim(),
    sessionId: getSessionId(),
    events: [item],
  };
}
