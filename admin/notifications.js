(() => {
  const PUSH_API = "https://ginseng-plus-api.onrender.com";
  const SW_URL = "/admin/service-worker.js?v=9";
  const TIMEOUT_MS = 12000;

  window.addEventListener("DOMContentLoaded", () => {
    const button = document.getElementById("notifications");
    if (!button) return;

    // This is the only click handler that owns the notification button.
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();

      let stage = "starting";
      try {
        button.disabled = true;
        button.textContent = "⏳ Enabling…";

        if (!window.isSecureContext) throw new Error("Notifications require HTTPS.");
        if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
          throw new Error("This browser does not support Web Push.");
        }

        stage = "requesting notification permission";
        const permission = await withTimeout(
          Notification.requestPermission(),
          TIMEOUT_MS,
          "The browser did not finish the notification permission request. Check Chrome site notification settings."
        );
        if (permission !== "granted") {
          throw new Error("Notification permission was not granted. Check Chrome site notification settings.");
        }

        stage = "registering service worker";
        let registration = await withTimeout(
          navigator.serviceWorker.register(SW_URL, {
            scope: "/admin/",
            updateViaCache: "none",
          }),
          TIMEOUT_MS,
          "The service worker could not be registered."
        );

        stage = "activating service worker";
        if (!registration.active) {
          await waitForActive(registration, TIMEOUT_MS);
        }
        if (!registration.active) {
          throw new Error("The admin service worker did not become active. Open /admin/service-worker.js in Chrome to check that the file is loading.");
        }

        // Do not use navigator.serviceWorker.ready without a timeout: if the worker
        // fails to activate, that promise can remain pending indefinitely.
        await withTimeout(
          navigator.serviceWorker.ready,
          TIMEOUT_MS,
          "The service worker did not become ready."
        );

        stage = "checking admin login";
        const token = localStorage.getItem("ginseng_admin_token") || "";
        if (!token) throw new Error("Please sign in to the admin dashboard first.");

        stage = "getting push key";
        const keyResponse = await fetchWithTimeout(`${PUSH_API}/api/admin/push/public-key`, {
          headers: { "X-Admin-Token": token, Accept: "application/json" },
          cache: "no-store",
        });
        const keyPayload = await keyResponse.json().catch(() => null);
        if (!keyResponse.ok) {
          throw new Error(keyPayload?.detail || `Server returned ${keyResponse.status} for the push key.`);
        }
        if (!keyPayload?.publicKey) throw new Error("The server did not return a VAPID public key.");

        stage = "creating browser subscription";
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          subscription = await withTimeout(
            registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: decodeKey(keyPayload.publicKey),
            }),
            TIMEOUT_MS,
            "Chrome did not finish creating the push subscription."
          );
        }

        const payload = subscription.toJSON();
        if (!payload.endpoint || !payload.keys?.p256dh || !payload.keys?.auth) {
          throw new Error("The browser returned an incomplete push subscription.");
        }

        stage = "saving subscription";
        const saveResponse = await fetchWithTimeout(`${PUSH_API}/api/admin/push/subscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Admin-Token": token },
          body: JSON.stringify({
            endpoint: payload.endpoint,
            p256dh: payload.keys.p256dh,
            auth: payload.keys.auth,
          }),
        });
        const savePayload = await saveResponse.json().catch(() => null);
        if (!saveResponse.ok) {
          throw new Error(savePayload?.detail || `Could not save subscription (${saveResponse.status}).`);
        }

        stage = "showing confirmation";
        await withTimeout(
          registration.showNotification("Megastore Wellness", {
            body: "Browser notifications are now enabled.",
            icon: "/admin/icon-192.png",
            badge: "/admin/icon-192.png",
            tag: "notification-enabled",
            data: { url: "/admin/" },
          }),
          TIMEOUT_MS,
          "The browser saved the subscription but could not display the confirmation notification."
        );

        button.textContent = "🔔 Notifications enabled";
        button.disabled = false;
        document.getElementById("testNotification")?.classList.remove("hidden");
      } catch (error) {
        console.error("Web Push setup failed at:", stage, error);
        alert(`Notifications could not be enabled.\n\nStep: ${stage}\n${error?.message || error}`);
        button.disabled = false;
        button.textContent = "🔔 Enable notifications";
      }
    }, { capture: true });
  });

  async function waitForActive(registration, timeout) {
    if (registration.active) return registration;

    await new Promise((resolve, reject) => {
      const worker = registration.installing || registration.waiting;
      if (!worker) {
        reject(new Error("No installing or waiting service worker was found."));
        return;
      }

      const timer = setTimeout(() => {
        worker.removeEventListener("statechange", onStateChange);
        reject(new Error("The service worker is still installing after the timeout."));
      }, timeout);

      function onStateChange() {
        if (worker.state === "activated") {
          clearTimeout(timer);
          worker.removeEventListener("statechange", onStateChange);
          resolve();
        } else if (worker.state === "redundant") {
          clearTimeout(timer);
          worker.removeEventListener("statechange", onStateChange);
          reject(new Error("The service worker became redundant instead of activating."));
        }
      }

      worker.addEventListener("statechange", onStateChange);
    });

    return registration;
  }

  async function fetchWithTimeout(url, options) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } catch (error) {
      if (error?.name === "AbortError") throw new Error(`The server request timed out after ${TIMEOUT_MS / 1000} seconds.`);
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  function withTimeout(promise, timeout, message) {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error(message)), timeout)),
    ]);
  }

  function decodeKey(value) {
    const padding = "=".repeat((4 - (value.length % 4)) % 4);
    const raw = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from([...raw], (character) => character.charCodeAt(0));
  }
})();
