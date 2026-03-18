"use client";

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
        applicationServerKey: vapidKey,
      });

      const subJson = subscription.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...subJson,
          locationId,
        }),
      });

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
