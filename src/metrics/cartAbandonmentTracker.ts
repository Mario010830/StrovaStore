import { getApiUrl } from "@/lib/auth-api";
import { readPendingCartSnapshot } from "./pendingCart";
import { buildBaseMetricsFields, sendEvent } from "./metricsClient";

let registered = false;

function sendCartAbandonedWithBeacon(businessId: string, cartId: string): void {
  const payload = buildBaseMetricsFields({
    eventType: "cart_abandoned",
    businessId,
    cartId,
  });

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    try {
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      const ok = navigator.sendBeacon(`${getApiUrl()}/metrics/event`, blob);
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
      sendCartAbandonedWithBeacon(pending.businessId, pending.cartId);
    } catch {
      // ignore
    }
  });
}
