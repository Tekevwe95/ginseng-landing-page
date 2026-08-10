const API = "https://ginseng-plus-api.onrender.com";

function initTracking() {
  const form = document.getElementById("trackingForm");
  const input = document.getElementById("orderId");
  const message = document.getElementById("trackMessage");
  const result = document.getElementById("trackResult");
  if (!form || !input || !message || !result) return;

  const labels = { new: "Order received", confirmed: "Order confirmed", out_for_delivery: "Out for delivery", delivered: "Delivered", cancelled: "Cancelled" };
  const stages = ["new", "confirmed", "out_for_delivery", "delivered"];
  let trackedOrderId = "";
  let refreshTimer = null;
  let controller = null;

  const normalizeId = (value) => value.replace(/[\s\u200B\u200C\u200D-]+/g, "").toUpperCase().replace(/^GP(?!-)/, "GP-");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    event.stopPropagation();
    trackedOrderId = normalizeId(input.value);
    input.value = trackedOrderId;
    if (!trackedOrderId) return;
    checkOrder(true);
    startAutoRefresh();
  });

  form.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  async function checkOrder(showLoading = false) {
    if (!trackedOrderId) return;
    if (controller) controller.abort();
    controller = new AbortController();
    if (showLoading) {
      message.textContent = "Checking your order...";
      message.className = "track-message";
      result.classList.add("hidden");
    }
    try {
      const response = await fetch(`${API}/api/orders/${encodeURIComponent(trackedOrderId)}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.detail || "Order not found");
      render(payload);
      message.textContent = "";
    } catch (error) {
      if (error.name === "AbortError") return;
      if (showLoading) {
        message.textContent = error.message || "We could not find that order.";
        message.className = "track-error";
      }
    }
  }

  function startAutoRefresh() {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(() => checkOrder(false), 15000);
  }

  function render(order) {
    const current = order.status;
    const currentIndex = stages.indexOf(current);
    const progress = current === "cancelled" ? "" : `<div class="progress">${stages.map((stage, index) => `<div class="step ${index <= currentIndex ? "active" : ""}" title="${labels[stage]}"></div>`).join("")}</div>`;
    result.innerHTML = `<div class="track-head"><div><p class="eyebrow" style="color:var(--green);margin:0">${escapeHtml(order.id)}</p><h2>${escapeHtml(labels[current] || current)}</h2></div><span class="status-badge">${escapeHtml(labels[current] || current)}</span></div>${progress}<div class="track-details"><span><strong>Package:</strong> ${escapeHtml(order.package)}</span><span><strong>Delivery:</strong> ${escapeHtml(order.city)}, ${escapeHtml(order.state)}</span><span><strong>Payment:</strong> Pay on delivery</span></div>`;
    result.classList.remove("hidden");
  }

  function escapeHtml(value) { return String(value ?? "").replace(/[&<>\"']/g, (char) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char])); }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initTracking);
else initTracking();
