self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = {
      title: "Tu Cuadre",
      body: event.data.text(),
      data: { url: "/catalog" },
    };
  }

  const title = payload.title || "Tu Cuadre";
  const options = {
    body: payload.body || "Hay novedades en tus tiendas.",
    icon: payload.icon || "/images/icon-192x192.png",
    badge: payload.badge || "/images/icon-72x72.png",
    data: payload.data || { url: "/catalog" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
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
