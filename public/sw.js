/* Daarik service worker — install-only for Web Push, no offline page caching. */
const INSTALL_EVENT = "daarik.push";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    // A malformed payload still produces a generic, harmless notification.
  }

  const title = typeof payload.title === "string" ? payload.title : "Daarik";
  const body =
    typeof payload.body === "string" ? payload.body : "You have a new order";
  const target =
    typeof payload.url === "string" && payload.url.startsWith("/")
      ? payload.url
      : "/cook/orders";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/img/daarik-logo.png",
      tag:
        typeof payload.orderId === "string"
          ? `order-${payload.orderId}`
          : INSTALL_EVENT,
      data: { url: target },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/cook/orders";

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of windows) {
        if (new URL(client.url).origin === self.location.origin) {
          await client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })(),
  );
});
