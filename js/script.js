const API_URL = "https://ginseng-plus-api.onrender.com";

function addIngredientsSection() {
  const productSection = document.querySelector(".product-section");
  if (!productSection || document.getElementById("ingredients")) return;

  const style = document.createElement("style");
  style.id = "ingredients-section-styles";
  style.textContent = `
    .ingredients-section{background:var(--cream);padding:90px 0;overflow:hidden}
    .ingredients-intro{max-width:720px;margin:0 auto 42px;text-align:center}
    .ingredients-intro .eyebrow{margin-bottom:12px}
    .ingredients-intro h2{font-size:clamp(2.2rem,4vw,3.4rem)}
    .ingredients-intro p:last-child{color:var(--muted);margin-top:16px}
    .ingredient-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;max-width:900px;margin:0 auto}
    .ingredient-card{display:flex;align-items:center;gap:17px;background:#fff;border:1px solid #efc68e;border-radius:18px;padding:16px 18px;min-height:92px;transition:transform .22s,box-shadow .22s,border-color .22s}
    .ingredient-card:hover{transform:translateY(-4px);border-color:#dca55c;box-shadow:0 14px 35px rgba(18,59,39,.10)}
    .ingredient-card:last-child{grid-column:1/-1;max-width:442px;width:100%;justify-self:center}
    .ingredient-icon{width:56px;height:56px;flex:0 0 56px;border-radius:50%;display:grid;place-items:center;background:#ffebc9;font-size:28px;line-height:1}
    .ingredient-card h3{font-family:"Playfair Display",serif;font-size:1.08rem;margin-bottom:2px;color:var(--text)}
    .ingredient-card p{font-size:.82rem;color:#8a8178;line-height:1.45}
    .ingredient-note{max-width:700px;margin:28px auto 0;text-align:center;background:#fff;border:1px solid var(--border);border-radius:14px;padding:13px 18px;color:var(--green-dark);font-size:.88rem;font-weight:700}
    .ingredient-note span{color:var(--green);margin-right:6px}
    @media(max-width:800px){
      .ingredients-section{padding:70px 0}
      .ingredient-grid{grid-template-columns:1fr;gap:12px}
      .ingredient-card:last-child{grid-column:auto;max-width:none}
      .ingredient-card{min-height:82px;padding:13px 14px;border-radius:15px}
      .ingredient-icon{width:50px;height:50px;flex-basis:50px;font-size:25px}
      .ingredient-card h3{font-size:1rem}
      .ingredient-card p{font-size:.77rem}
    }
  `;
  document.head.appendChild(style);

  const section = document.createElement("section");
  section.id = "ingredients";
  section.className = "ingredients-section";
  section.innerHTML = `
    <div class="container">
      <div class="ingredients-intro">
        <p class="eyebrow">THE FIVE TREASURES</p>
        <h2>What's inside your cup?</h2>
        <p>Each herb chosen for its 5,000-year track record. No fillers. No artificial flavours.</p>
      </div>
      <div class="ingredient-grid">
        <article class="ingredient-card">
          <div class="ingredient-icon" aria-hidden="true">🌿</div>
          <div><h3>Ginseng Root</h3><p>Core energy restorer — the king of herbs</p></div>
        </article>
        <article class="ingredient-card">
          <div class="ingredient-icon" aria-hidden="true">🔴</div>
          <div><h3>Wolfberry (Goji)</h3><p>Antioxidant powerhouse — kidney and liver tonic</p></div>
        </article>
        <article class="ingredient-card">
          <div class="ingredient-icon" aria-hidden="true">🌹</div>
          <div><h3>Red Dates</h3><p>Nourishes blood, strengthens immunity</p></div>
        </article>
        <article class="ingredient-card">
          <div class="ingredient-icon" aria-hidden="true">🍃</div>
          <div><h3>Mulberry Leaf</h3><p>Blood sugar balance and anti-aging</p></div>
        </article>
        <article class="ingredient-card">
          <div class="ingredient-icon" aria-hidden="true">🌾</div>
          <div><h3>Yellow Essence (Huang Jing)</h3><p>Lung health, respiratory support</p></div>
        </article>
      </div>
      <div class="ingredient-note"><span>✓</span>10g of whole herbs per bag — brews 2–3 potent cups.</div>
    </div>
  `;

  productSection.parentNode.insertBefore(section, productSection);
}

document.addEventListener("DOMContentLoaded", () => {
  addIngredientsSection();

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
