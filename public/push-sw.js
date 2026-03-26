self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {};
  const raw = event.data?.text?.() ?? "";
  console.log("[push-sw] raw payload:", raw);
  try {
    payload = JSON.parse(raw);
  } catch {
    payload = {
      title: "StrovaStore",
      body: raw,
      data: { url: "/catalog" },
    };
  }
  console.log("[push-sw] parsed payload:", payload);

  const title = payload.title || "Oferta nueva en StrovaStore";
  const targetUrl = payload.url || payload?.data?.url || "/catalog";
  const tag =
    payload.tag ||
    (payload.locationId != null
      ? `strova-promo-location-${payload.locationId}`
      : "strova-promo");
  const options = {
    body: payload.body || "Hay novedades en tus tiendas.",
    icon: payload.icon || "/images/icon-192x192.png",
    badge: payload.badge || "/images/icon-72x72.png",
    image: payload.image || payload.imageUrl || undefined,
    tag,
    renotify: true,
    requireInteraction: false,
    vibrate: [120, 40, 120],
    actions: [
      { action: "open_offer", title: "Ver oferta" },
      { action: "dismiss", title: "Cerrar" },
    ],
    data: {
      ...(payload.data || {}),
      url: targetUrl,
      locationId: payload.locationId ?? payload?.data?.locationId ?? null,
    },
  };
  console.log("[push-sw] showNotification:", { title, options });

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  if (event.action === "dismiss") {
    event.notification.close();
    return;
  }

  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/catalog";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          if (client.url.includes(targetUrl)) return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
      return undefined;
    }),
  );
});
