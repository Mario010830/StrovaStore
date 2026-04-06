import { getApiUrl } from "@/lib/auth-api";
import { getSessionId } from "./sessionId";

export type MetricsEventType =
  | "catalog_view"
  | "product_view"
  | "product_favorited"
  | "add_to_cart"
  | "cart_abandoned"
  | "purchase_completed"
  | "search_performed";

export interface MetricsEventPayload {
  eventType: MetricsEventType;
  businessId: string;
  productId: string | null;
  sessionId: string;
  userId: string | null;
  source: string | null;
  searchTerm: string | null;
  cartId: string | null;
  orderId: string | null;
  timestamp: string;
}

function utcIsoNow(): string {
  return new Date().toISOString();
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
export function sendEvent(payload: MetricsEventPayload): void {
  if (typeof window === "undefined") return;

  void (async () => {
    try {
      await fetch(`${getApiUrl()}/metrics/event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
          ...authHeaders(),
        },
        body: JSON.stringify(payload),
      });
    } catch {
      // intentionally silent
    }
  })();
}

export function buildBaseMetricsFields(overrides: {
  eventType: MetricsEventType;
  businessId: string;
  productId?: string | null;
  source?: string | null;
  searchTerm?: string | null;
  cartId?: string | null;
  orderId?: string | null;
}): MetricsEventPayload {
  return {
    eventType: overrides.eventType,
    businessId: overrides.businessId,
    productId: overrides.productId ?? null,
    sessionId: getSessionId(),
    userId: null,
    source: overrides.source ?? null,
    searchTerm: overrides.searchTerm ?? null,
    cartId: overrides.cartId ?? null,
    orderId: overrides.orderId ?? null,
    timestamp: utcIsoNow(),
  };
}
