(() => {
  const PUSH_API = "https://ginseng-plus-api.onrender.com";

  window.addEventListener("DOMContentLoaded", () => {
    const button = document.getElementById("notifications");
    if (!button) return;

    button.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      try {
        button.disabled = true;
        button.textContent = "⏳ Enabling…";

        if (!window.isSecureContext) throw new Error("Notifications require HTTPS.");
        if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
          throw new Error("This browser does not support Web Push.");
        }

        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          throw new Error("Notification permission was not granted. Check Chrome site notification settings.");
        }

        const registration = await navigator.serviceWorker.register("/admin/service-worker.js?v=8", {
          scope: "/admin/",
          updateViaCache: "none",
        });
        await navigator.serviceWorker.ready;
        await registration.update().catch(() => {});

        const token = localStorage.getItem("ginseng_admin_token") || "";
        if (!token) throw new Error("Please sign in to the admin dashboard first.");

        const keyResponse = await fetch(`${PUSH_API}/api/admin/push/public-key`, {
          headers: { "X-Admin-Token": token, Accept: "application/json" },
          cache: "no-store",
        });
        const keyPayload = await keyResponse.json().catch(() => null);
        if (!keyResponse.ok) throw new Error(keyPayload?.detail || `Server returned ${keyResponse.status} for the push key.`);
        if (!keyPayload?.publicKey) throw new Error("The server did not return a VAPID public key.");

        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: decodeKey(keyPayload.publicKey),
          });
        }

        const payload = subscription.toJSON();
        if (!payload.endpoint || !payload.keys?.p256dh || !payload.keys?.auth) {
          throw new Error("The browser returned an incomplete push subscription.");
        }

        const saveResponse = await fetch(`${PUSH_API}/api/admin/push/subscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Admin-Token": token },
          body: JSON.stringify({ endpoint: payload.endpoint, p256dh: payload.keys.p256dh, auth: payload.keys.auth }),
        });
        const savePayload = await saveResponse.json().catch(() => null);
        if (!saveResponse.ok) throw new Error(savePayload?.detail || `Could not save subscription (${saveResponse.status}).`);

        await registration.showNotification("Megastore Wellness", {
          body: "Browser notifications are now enabled.",
          icon: "/admin/icon-192.png",
          badge: "/admin/icon-192.png",
          tag: "notification-enabled",
        });

        button.textContent = "🔔 Notifications enabled";
        document.getElementById("testNotification")?.classList.remove("hidden");
        button.disabled = false;
      } catch (error) {
        console.error("Web Push setup failed:", error);
        alert("Notifications could not be enabled.\n\n" + (error?.message || error));
        button.disabled = false;
        button.textContent = "🔔 Enable notifications";
      }
    }, true);
  });

  function decodeKey(value) {
    const padding = "=".repeat((4 - (value.length % 4)) % 4);
    const raw = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from([...raw], (character) => character.charCodeAt(0));
  }
})();
