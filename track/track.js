const API = "https://ginseng-plus-api.onrender.com";
const form = document.getElementById("trackingForm");
const input = document.getElementById("orderId");
const message = document.getElementById("trackMessage");
const result = document.getElementById("trackResult");
const labels = { new: "Order received", confirmed: "Order confirmed", out_for_delivery: "Out for delivery", delivered: "Delivered", cancelled: "Cancelled" };
const stages = ["new", "confirmed", "out_for_delivery", "delivered"];
let trackedOrderId = "";
let refreshTimer = null;

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const id = input.value.trim().toUpperCase();
  if (!id) return;
  trackedOrderId = id;
  await checkOrder(true);
  startAutoRefresh();
});

async function checkOrder(showLoading = false) {
  if (!trackedOrderId) return;
  if (showLoading) {
    message.textContent = "Checking your order...";
    message.className = "";
    result.classList.add("hidden");
  }
  try {
    const response = await fetch(`${API}/api/orders/${encodeURIComponent(trackedOrderId)}`, { headers: { Accept: "application/json" }, cache: "no-store" });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.detail || "Order not found");
    render(payload);
    message.textContent = "";
  } catch (error) {
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
