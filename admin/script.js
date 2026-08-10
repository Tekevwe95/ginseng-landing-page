const API = "https://ginseng-plus-api.onrender.com";
let token = localStorage.getItem("ginseng_admin_token") || "";
const $ = (id) => document.getElementById(id);

function showDashboard() {
  $("login").classList.add("hidden");
  $("orders").classList.remove("hidden");
  loadOrders();
}

async function loadOrders() {
  const message = $("loginMessage");
  try {
    message.textContent = "Loading orders...";
    const response = await fetch(`${API}/api/admin/orders`, { headers: { "X-Admin-Token": token, Accept: "application/json" }, cache: "no-store" });
    let payload = null;
    try { payload = await response.json(); } catch (_) {}
    if (!response.ok) throw new Error(payload?.detail || `API error: ${response.status}`);
    render(payload);
    message.textContent = "";
  } catch (error) {
    message.textContent = error.message || "Unable to load orders.";
    $("orders").classList.add("hidden");
  }
}

function render(orders) {
  const counts = { new: 0, confirmed: 0, out_for_delivery: 0, delivered: 0 };
  orders.forEach((order) => { if (counts[order.status] !== undefined) counts[order.status]++; });
  $("newCount").textContent = counts.new;
  $("confirmedCount").textContent = counts.confirmed;
  $("deliveryCount").textContent = counts.out_for_delivery;
  $("deliveredCount").textContent = counts.delivered;
  $("orderList").innerHTML = orders.length ? orders.map((o) => `<article class="order"><div class="order-top"><div><h3>${escapeHtml(o.id)} — ${escapeHtml(o.name)}</h3><div class="meta">${escapeHtml(o.phone)}${o.whatsapp ? ` · WhatsApp: ${escapeHtml(o.whatsapp)}` : ""}<br>${escapeHtml(o.city)}, ${escapeHtml(o.state)}<br>${escapeHtml(o.address)}<br>${escapeHtml(o.package)} · <b>PAY ON DELIVERY</b></div></div><span class="status">${escapeHtml(o.status)}</span></div><div class="actions">${["new","confirmed","out_for_delivery","delivered","cancelled"].map((s) => `<button class="${s === "cancelled" ? "danger" : ""}" onclick="setStatus('${escapeHtml(o.id)}','${s}')">${s.replaceAll("_", " ")}</button>`).join("")}</div></article>`).join("") : "<p>No orders yet.</p>";
}

async function setStatus(id, status) {
  const response = await fetch(`${API}/api/admin/orders/${encodeURIComponent(id)}/status`, { method: "PATCH", headers: { "Content-Type": "application/json", "X-Admin-Token": token }, body: JSON.stringify({ status }) });
  if (!response.ok) { alert("Could not update order"); return; }
  loadOrders();
}

function escapeHtml(value) { return String(value ?? "").replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c])); }

$("loginBtn").onclick = () => { token = $("token").value.trim(); if (!token) return; localStorage.setItem("ginseng_admin_token", token); showDashboard(); };
$("refresh").onclick = loadOrders;
$("logout").onclick = () => { localStorage.removeItem("ginseng_admin_token"); token = ""; location.reload(); };
if (token) showDashboard();
