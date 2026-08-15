/* MegaStore Wellness admin Web Push service worker */
const SW_VERSION = "admin-push-v10";

// Make every new version activate immediately instead of sitting in "waiting".
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

// Take control of already-open /admin pages as soon as this worker activates.
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {
    title: "New MegaStore Wellness Order",
    body: "A new order has been received.",
    url: "/admin/",
  };

  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (_) {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/admin/icon-192.png",
      badge: "/admin/icon-192.png",
      tag: "megastore-new-order",
      renotify: true,
      data: { url: data.url || "/admin/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(
    event.notification.data?.url || "/admin/",
    self.location.origin
  ).href;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if ("focus" in client) {
            client.navigate(target);
            return client.focus();
          }
        }
        return clients.openWindow(target);
      })
  );
});

// Keep a harmless reference so the deployed worker is visibly versioned.
void SW_VERSION;
