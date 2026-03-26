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
      const registration = await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as BufferSource,
      });

      const subJson = subscription.toJSON();
      const payload = {
        ...subJson,
        locationId,
      };
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) return false;

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
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      return await subscribe(locationId);
    }
    return false;
  };

  return { isSupported, subscribe, requestPermissionAndSubscribe };
}
