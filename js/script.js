const API_URL = "https://ginseng-plus-api.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  const packageButtons = document.querySelectorAll(".package");
  const packageSelect = document.getElementById("package");
  const orderSection = document.getElementById("order");
  const form = document.getElementById("orderForm");
  const confirmation = document.getElementById("confirmation");
  const message = document.getElementById("formMessage");
  const summary = document.getElementById("orderSummary");
  const citySelect = document.getElementById("city");
  const otherCity = document.getElementById("otherCity");

  if (!form || !packageSelect || !message) return;

  packageButtons.forEach((button) => {
    button.addEventListener("click", () => {
      packageSelect.value = button.dataset.package || "";
      orderSection?.scrollIntoView({ behavior: "smooth" });
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.textContent = "Submitting your order...";
    message.className = "form-status";

    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;

    const data = Object.fromEntries(new FormData(form).entries());

    // Keep the backend contract unchanged: it expects the actual location in
    // `city`. When the customer uses the manual fallback, move `other_city`
    // into `city` before sending the existing order payload.
    if (data.city === "__other__") {
      data.city = String(data.other_city || "").trim();
    }
    delete data.other_city;

    try {
      const response = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });

      let payload = null;
      try { payload = await response.json(); } catch (_) {}

      if (!response.ok) {
        const detail = payload?.detail || `Server returned ${response.status}`;
        throw new Error(detail);
      }

      summary.innerHTML = `<div class="summary"><strong>Order ${escapeHtml(payload.id)}</strong><span>${escapeHtml(payload.package)}</span><span>Customer: ${escapeHtml(payload.name)}</span><span>Phone: ${escapeHtml(payload.phone)}</span><span>Delivery: ${escapeHtml(payload.city)}, ${escapeHtml(payload.state)}</span><span class="payment-line">Payment: <strong>PAY ON DELIVERY</strong></span></div>`;
      message.textContent = "";
      form.reset();
      if (citySelect) {
        citySelect.innerHTML = '<option value="">Select your state first</option>';
        citySelect.disabled = true;
      }
      if (otherCity) otherCity.required = false;
      document.getElementById("otherCityWrap")?.classList.add("is-hidden");
      confirmation?.classList.remove("hidden");
      confirmation?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.error("Order submission failed:", error);
      message.textContent = `Order could not be submitted: ${error.message || "Please check your internet connection and try again."}`;
      message.className = "form-status form-error";
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
});

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>\"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}
