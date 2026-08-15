self.addEventListener("push", (event) => {
  let data = { title: "New MegaStore Wellness Order", body: "A new order has been received.", url: "/admin/" };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch (_) {}
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: "/admin/icon-192.png",
    badge: "/admin/icon-192.png",
    tag: "megastore-new-order",
    renotify: true,
    data: { url: data.url || "/admin/" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/admin/", self.location.origin).href;
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    for (const client of list) {
      if ("focus" in client) { client.navigate(target); return client.focus(); }
    }
    return clients.openWindow(target);
  }));
});
