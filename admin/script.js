const API = "https://ginseng-plus-api.onrender.com";
let token = localStorage.getItem("ginseng_admin_token") || "";
let allOrders = [];
let refreshTimer = null;
const AUTO_REFRESH_MS = 15000;
const $ = (id) => document.getElementById(id);

function showDashboard() {
  $("login").classList.add("hidden");
  $("orders").classList.remove("hidden");
  loadOrders();
  startAutoRefresh();
}

async function loadOrders() {
  const message = $("loginMessage");
  if (!token) return;
  try {
    message.textContent = "Updating orders...";
    const response = await fetch(`${API}/api/admin/orders`, { headers: { "X-Admin-Token": token, Accept: "application/json" }, cache: "no-store" });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.detail || `API error: ${response.status}`);
    allOrders = Array.isArray(payload) ? payload : [];
    applyFilters();
    message.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
  } catch (error) {
    message.textContent = error.message || "Unable to load orders.";
    if (error.message?.includes("Invalid admin token")) stopAutoRefresh();
  }
}

function startAutoRefresh() { stopAutoRefresh(); refreshTimer = setInterval(loadOrders, AUTO_REFRESH_MS); }
function stopAutoRefresh() { if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; } }

function render(orders) {
  const counts = { new: 0, confirmed: 0, out_for_delivery: 0, delivered: 0 };
  allOrders.forEach((order) => { if (counts[order.status] !== undefined) counts[order.status]++; });
  $("newCount").textContent = counts.new;
  $("confirmedCount").textContent = counts.confirmed;
  $("deliveryCount").textContent = counts.out_for_delivery;
  $("deliveredCount").textContent = counts.delivered;
  $("orderList").innerHTML = orders.length ? orders.map((o) => `<article class="order"><div class="order-top"><div><h3><button class="order-link" onclick="openOrder('${escapeHtml(o.id)}')">${escapeHtml(o.id)}</button> — ${escapeHtml(o.name)}</h3><div class="meta">${escapeHtml(o.phone)}${o.whatsapp ? ` · WhatsApp: ${escapeHtml(o.whatsapp)}` : ""}<br>${escapeHtml(o.city)}, ${escapeHtml(o.state)}<br>${escapeHtml(o.address)}<br>${escapeHtml(o.package)} · <b>PAY ON DELIVERY</b>${o.created_at ? `<br>Ordered: ${escapeHtml(formatDate(o.created_at))}` : ""}</div></div><span class="status">${escapeHtml(label(o.status))}</span></div><div class="actions"><button onclick="openOrder('${escapeHtml(o.id)}')">View details</button>${["new","confirmed","out_for_delivery","delivered","cancelled"].map((s) => `<button class="${s === "cancelled" ? "danger" : ""}" onclick="setStatus('${escapeHtml(o.id)}','${s}')">${label(s)}</button>`).join("")}</div></article>`).join("") : "<p>No matching orders.</p>";
}

function applyFilters() {
  const query = $("search").value.trim().toLowerCase();
  const status = $("statusFilter").value;
  const filtered = allOrders.filter((o) => {
    const haystack = [o.id, o.name, o.phone, o.whatsapp, o.city, o.state, o.address, o.package].join(" ").toLowerCase();
    return (!query || haystack.includes(query)) && (status === "all" || o.status === status);
  });
  render(filtered);
}

async function openOrder(id) {
  const order = allOrders.find((item) => item.id === id);
  if (!order) return;
  let history = [];
  try {
    const response = await fetch(`${API}/api/admin/orders/${encodeURIComponent(id)}/history`, { headers: { "X-Admin-Token": token, Accept: "application/json" }, cache: "no-store" });
    if (response.ok) history = await response.json();
  } catch (_) {}
  const modal = document.getElementById("orderModal") || createModal();
  $("modalTitle").textContent = `${order.id} — ${order.name}`;
  $("modalBody").innerHTML = `<div class="detail-grid"><div><strong>Phone</strong><span>${escapeHtml(order.phone)}</span></div><div><strong>WhatsApp</strong><span>${escapeHtml(order.whatsapp || "Not provided")}</span></div><div><strong>Package</strong><span>${escapeHtml(order.package)}</span></div><div><strong>Payment</strong><span>Pay on delivery</span></div><div><strong>State</strong><span>${escapeHtml(order.state)}</span></div><div><strong>City</strong><span>${escapeHtml(order.city)}</span></div><div class="wide"><strong>Address</strong><span>${escapeHtml(order.address)}</span></div><div class="wide"><strong>Ordered</strong><span>${escapeHtml(formatDate(order.created_at))}</span></div></div><h3>Status history</h3><div class="history">${history.length ? history.map((item) => `<div class="history-row"><span class="history-dot"></span><div><strong>${escapeHtml(label(item.status))}</strong><small>${escapeHtml(formatDate(item.changed_at))}</small></div></div>`).join("") : "<p>No status history available.</p>"}</div>`;
  modal.classList.remove("hidden");
}

function createModal() {
  const modal = document.createElement("div");
  modal.id = "orderModal";
  modal.className = "modal hidden";
  modal.innerHTML = `<div class="modal-backdrop" onclick="closeOrder()"></div><section class="modal-card" role="dialog" aria-modal="true"><button class="modal-close" onclick="closeOrder()" aria-label="Close">×</button><h2 id="modalTitle"></h2><div id="modalBody"></div></section>`;
  document.body.appendChild(modal);
  return modal;
}
function closeOrder() { $("orderModal")?.classList.add("hidden"); }

async function setStatus(id, status) {
  if (status === "cancelled" && !confirm(`Cancel order ${id}? This action should only be used when the customer has cancelled or the order cannot be fulfilled.`)) return;
  const response = await fetch(`${API}/api/admin/orders/${encodeURIComponent(id)}/status`, { method: "PATCH", headers: { "Content-Type": "application/json", "X-Admin-Token": token }, body: JSON.stringify({ status }) });
  if (!response.ok) { alert("Could not update order"); return; }
  await loadOrders();
  if ($("orderModal") && !$('orderModal').classList.contains("hidden")) openOrder(id);
}

function label(status) { return ({ new: "New", confirmed: "Confirmed", out_for_delivery: "Out for delivery", delivered: "Delivered", cancelled: "Cancelled" }[status] || status); }
function formatDate(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleString(); }
function escapeHtml(value) { return String(value ?? "").replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c])); }

$("loginBtn").onclick = () => { token = $("token").value.trim(); if (!token) return; localStorage.setItem("ginseng_admin_token", token); showDashboard(); };
$("refresh").onclick = loadOrders;
$("search").oninput = applyFilters;
$("statusFilter").onchange = applyFilters;
$("logout").onclick = () => { stopAutoRefresh(); localStorage.removeItem("ginseng_admin_token"); token = ""; location.reload(); };
if (token) showDashboard();
