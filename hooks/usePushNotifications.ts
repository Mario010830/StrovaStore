"use client";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputBuffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(outputBuffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const isSupported = () =>
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window;

  const subscribe = async (locationId?: number) => {
    if (!isSupported()) return false;

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      console.warn("NEXT_PUBLIC_VAPID_PUBLIC_KEY not set");
      return false;
    }

    try {
      // Ensure SW is registered in case auto-registration is delayed/missing.
      const existingReg = await navigator.serviceWorker.getRegistration();
      if (!existingReg) {
        await navigator.serviceWorker.register("/sw.js");
      }
      const registration = await navigator.serviceWorker.ready;

      const appServerKey = urlBase64ToUint8Array(vapidKey) as unknown as BufferSource;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: appServerKey,
        });
      }

      const subJson = subscription.toJSON();
      const payload = {
        ...subJson,
        locationId,
      };
      console.info("[push] sending subscription payload", {
        locationId,
        endpoint: subJson.endpoint,
      });
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errBody = await response.text().catch(() => "");
        console.error("[push] subscribe endpoint failed", response.status, errBody);
        return false;
      }
      const result = await response.json().catch(() => null);
      console.info("[push] subscribe endpoint response", result);

      if (typeof locationId === "number" && Number.isInteger(locationId) && locationId > 0) {
        try {
          const key = "push-location-ids";
          const current = JSON.parse(localStorage.getItem(key) ?? "[]") as unknown;
          const list = Array.isArray(current)
            ? current.filter((v): v is number => Number.isInteger(v) && v > 0)
            : [];
          if (!list.includes(locationId)) {
            list.push(locationId);
            localStorage.setItem(key, JSON.stringify(list));
          }
        } catch {
          // ignore localStorage errors
        }
      }

      return true;
    } catch (err) {
      console.error("Error al suscribirse a push:", err);
      return false;
    }
  };

  const requestPermissionAndSubscribe = async (locationId?: number) => {
    if (!isSupported()) {
      console.warn("[push] not supported in this browser/context");
      return false;
    }
    const permission = await Notification.requestPermission();
    console.info("[push] permission result:", permission);
    if (permission === "granted") {
      return await subscribe(locationId);
    }
    return false;
  };

  return { isSupported, subscribe, requestPermissionAndSubscribe };
}
