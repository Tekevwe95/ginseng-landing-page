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

function startAutoRefresh() {
  stopAutoRefresh();
  refreshTimer = setInterval(loadOrders, AUTO_REFRESH_MS);
}
function stopAutoRefresh() {
  if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
}

function render(orders) {
  const counts = { new: 0, confirmed: 0, out_for_delivery: 0, delivered: 0 };
  allOrders.forEach((order) => { if (counts[order.status] !== undefined) counts[order.status]++; });
  $("newCount").textContent = counts.new;
  $("confirmedCount").textContent = counts.confirmed;
  $("deliveryCount").textContent = counts.out_for_delivery;
  $("deliveredCount").textContent = counts.delivered;
  $("orderList").innerHTML = orders.length ? orders.map((o) => `<article class="order"><div class="order-top"><div><h3>${escapeHtml(o.id)} — ${escapeHtml(o.name)}</h3><div class="meta">${escapeHtml(o.phone)}${o.whatsapp ? ` · WhatsApp: ${escapeHtml(o.whatsapp)}` : ""}<br>${escapeHtml(o.city)}, ${escapeHtml(o.state)}<br>${escapeHtml(o.address)}<br>${escapeHtml(o.package)} · <b>PAY ON DELIVERY</b>${o.created_at ? `<br>Ordered: ${escapeHtml(formatDate(o.created_at))}` : ""}</div></div><span class="status">${escapeHtml(label(o.status))}</span></div><div class="actions">${["new","confirmed","out_for_delivery","delivered","cancelled"].map((s) => `<button class="${s === "cancelled" ? "danger" : ""}" onclick="setStatus('${escapeHtml(o.id)}','${s}')">${label(s)}</button>`).join("")}</div></article>`).join("") : "<p>No matching orders.</p>";
}

function applyFilters() {
  const query = $("search").value.trim().toLowerCase();
  const status = $("statusFilter").value;
  const filtered = allOrders.filter((o) => {
    const haystack = [o.id, o.name, o.phone, o.city, o.state, o.address, o.package].join(" ").toLowerCase();
    return (!query || haystack.includes(query)) && (status === "all" || o.status === status);
  });
  render(filtered);
}

async function setStatus(id, status) {
  const response = await fetch(`${API}/api/admin/orders/${encodeURIComponent(id)}/status`, { method: "PATCH", headers: { "Content-Type": "application/json", "X-Admin-Token": token }, body: JSON.stringify({ status }) });
  if (!response.ok) { alert("Could not update order"); return; }
  await loadOrders();
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
