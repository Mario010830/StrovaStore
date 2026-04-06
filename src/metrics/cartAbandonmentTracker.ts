import { getApiUrl } from "@/lib/auth-api";
import { readPendingCartSnapshot } from "./pendingCart";
import { getSessionId } from "./sessionId";
import { sendEvent, type CatalogMetricsBatchRequest } from "./metricsClient";

let registered = false;

function sendCartAbandonedWithBeacon(locationId: string, _cartId: string): void {
  const payload: CatalogMetricsBatchRequest = {
    locationId,
    sessionId: getSessionId(),
    events: [{ eventType: "cart_abandoned" }],
  };

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    try {
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      const ok = navigator.sendBeacon(`${getApiUrl()}/public/metrics/events`, blob);
      if (ok) return;
    } catch {
      // fall through to fetch
    }
  }

  sendEvent(payload);
}

/**
 * Registers a single beforeunload listener to report cart_abandoned when pending cart data exists.
 */
export function registerCartAbandonmentTracker(): void {
  if (typeof window === "undefined" || registered) return;
  registered = true;

  window.addEventListener("beforeunload", () => {
    try {
      const pending = readPendingCartSnapshot();
      if (!pending || pending.productIds.length === 0) return;
      sendCartAbandonedWithBeacon(pending.locationId, pending.cartId);
    } catch {
      // ignore
    }
  });
}
