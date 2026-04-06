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

/**
 * Cuerpo alineado con CatalogMetricEventItemRequest (ASP.NET: Type → JSON "type", TrafficSource → "trafficSource").
 */
export interface CatalogMetricsEventItem {
  type: string;
  occurredAt?: string;
  catalogId?: number;
  productId?: number;
  trafficSource?: string;
  searchTerm?: string;
  durationSeconds?: number;
}

/**
 * Cuerpo alineado con CatalogMetricsBatchRequest (LocationId → JSON "locationId" numérico).
 */
export interface CatalogMetricsBatchRequest {
  locationId: number;
  sessionId: string;
  events: CatalogMetricsEventItem[];
}

function parsePositiveLocationId(locationId: string): number | null {
  const n = Number.parseInt(locationId.trim(), 10);
  return Number.isInteger(n) && n > 0 ? n : null;
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
 */
export function sendEvent(payload: CatalogMetricsBatchRequest): void {
  if (typeof window === "undefined") return;
  if (!Number.isInteger(payload.locationId) || payload.locationId <= 0) return;
  if (!payload.events?.length) return;

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
}): CatalogMetricsBatchRequest | null {
  const lid = parsePositiveLocationId(overrides.locationId);
  if (lid == null) return null;

  const item: CatalogMetricsEventItem = { type: overrides.eventType };
  if (overrides.productId != null && overrides.productId !== "") {
    const pid = Number(overrides.productId);
    if (Number.isInteger(pid) && pid > 0) {
      item.productId = pid;
    }
  }
  if (overrides.searchTerm != null && overrides.searchTerm !== "") {
    item.searchTerm = overrides.searchTerm;
  }
  if (overrides.source != null && overrides.source !== "") {
    item.trafficSource = overrides.source;
  }

  return {
    locationId: lid,
    sessionId: getSessionId(),
    events: [item],
  };
}
