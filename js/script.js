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
        <p>Your daily cup, made from nature.<br>Five whole herbs. Nothing unnecessary.</p>
      </div>
      <div class="ingredient-grid">
        <article class="ingredient-card"><div class="ingredient-icon" aria-hidden="true">🌿</div><div><h3>Ginseng Root</h3><p>Core energy restorer — the king of herbs</p></div></article>
        <article class="ingredient-card"><div class="ingredient-icon" aria-hidden="true">🔴</div><div><h3>Wolfberry (Goji)</h3><p>Antioxidant powerhouse — kidney and liver tonic</p></div></article>
        <article class="ingredient-card"><div class="ingredient-icon" aria-hidden="true">🌹</div><div><h3>Red Dates</h3><p>Nourishes blood, strengthens immunity</p></div></article>
        <article class="ingredient-card"><div class="ingredient-icon" aria-hidden="true">🍃</div><div><h3>Mulberry Leaf</h3><p>Blood sugar balance and anti-aging</p></div></article>
        <article class="ingredient-card"><div class="ingredient-icon" aria-hidden="true">🌾</div><div><h3>Yellow Essence (Huang Jing)</h3><p>Lung health, respiratory support</p></div></article>
      </div>
      <div class="ingredient-note"><span>✓</span>10g of whole herbs per bag — brews 2–3 potent cups.</div>
    </div>
  `;
  productSection.parentNode.insertBefore(section, productSection);
}

function addRoutineSection() {
  const productSection = document.querySelector(".product-section");
  if (!productSection || document.getElementById("routine")) return;

  const style = document.createElement("style");
  style.id = "routine-section-styles";
  style.textContent = `
    .routine-section{background:#fbf7ef;padding:88px 0;overflow:hidden}
    .routine-heading{max-width:820px;margin:0 auto 46px;text-align:center}
    .routine-heading .eyebrow{margin-bottom:12px}
    .routine-heading h2{font-size:clamp(2.25rem,4.5vw,3.7rem);margin-bottom:16px}
    .routine-heading p:last-child{color:var(--muted);font-size:1.05rem}
    .routine-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;max-width:1100px;margin:0 auto;position:relative}
    .routine-step{position:relative;background:#fff;border:1px solid #eadbbd;border-radius:22px;overflow:hidden;box-shadow:0 8px 28px rgba(18,59,39,.06)}
    .routine-number{position:absolute;z-index:2;top:-16px;left:50%;transform:translateX(-50%);width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:var(--green);color:#fff;font-weight:800;font-size:1.15rem;border:5px solid #fbf7ef}
    .routine-image{height:245px;width:100%;display:block;background-image:url('../assets/product.jpg');background-repeat:no-repeat;background-size:300% auto;background-color:#f4d8c5}
    .routine-image.drop{background-position:0% 72%}
    .routine-image.pour{background-position:50% 48%}
    .routine-image.steep{background-position:100% 42%}
    .routine-content{padding:22px 24px 26px}
    .routine-content h3{font-family:"Playfair Display",serif;font-size:1.7rem;color:var(--green-dark);margin-bottom:5px}
    .routine-content strong{display:block;font-size:1rem;margin-bottom:7px}
    .routine-content p{color:var(--muted);line-height:1.6;font-size:.92rem}
    .routine-meta{max-width:1100px;margin:28px auto 0;border:1px solid #d9decf;border-radius:18px;background:rgba(255,255,255,.55);padding:20px 24px;display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
    .routine-meta-item{display:flex;align-items:center;gap:13px;justify-content:center;text-align:left}
    .routine-meta-icon{width:46px;height:46px;border-radius:50%;background:#edf0dc;display:grid;place-items:center;font-size:22px;flex:0 0 46px}
    .routine-meta strong{display:block;color:var(--green-dark);font-size:1.05rem}
    .routine-meta span{display:block;color:var(--muted);font-size:.82rem;margin-top:2px}
    @media(max-width:800px){
      .routine-section{padding:68px 0}
      .routine-heading{margin-bottom:38px}
      .routine-steps{grid-template-columns:1fr;gap:16px;max-width:520px}
      .routine-number{top:12px;left:22px;transform:none;border-color:#fff}
      .routine-image{height:220px;background-size:300% auto}
      .routine-content{padding:20px 20px 23px}
      .routine-content h3{font-size:1.5rem}
      .routine-meta{grid-template-columns:1fr;gap:14px;max-width:520px;padding:18px}
      .routine-meta-item{justify-content:flex-start}
    }
  `;
  document.head.appendChild(style);

  const section = document.createElement("section");
  section.id = "routine";
  section.className = "routine-section";
  section.innerHTML = `
    <div class="container">
      <div class="routine-heading">
        <p class="eyebrow">YOUR DAILY RITUAL</p>
        <h2>Simple to brew. Easy to enjoy.</h2>
        <p>Just 3 simple steps to your perfect cup of Ginseng Five-Treasure Tea.</p>
      </div>
      <div class="routine-steps">
        <article class="routine-step">
          <span class="routine-number">01</span>
          <div class="routine-image drop" role="img" aria-label="Ginseng Five-Treasure Tea contents being placed into a cup"></div>
          <div class="routine-content"><h3>Drop</h3><strong>Take one sachet</strong><p>Place one 10g tea bag into your cup.</p></div>
        </article>
        <article class="routine-step">
          <span class="routine-number">02</span>
          <div class="routine-image pour" role="img" aria-label="Hot water being poured over Ginseng Five-Treasure Tea"></div>
          <div class="routine-content"><h3>Pour</h3><strong>Add hot water</strong><p>Pour water at 90°C or above into the cup.</p></div>
        </article>
        <article class="routine-step">
          <span class="routine-number">03</span>
          <div class="routine-image steep" role="img" aria-label="Ginseng Five-Treasure Tea steeping in a cup"></div>
          <div class="routine-content"><h3>Steep &amp; Sip</h3><strong>Wait 3–5 minutes</strong><p>Let the herbs infuse, then enjoy your tea.</p></div>
        </article>
      </div>
      <div class="routine-meta">
        <div class="routine-meta-item"><div class="routine-meta-icon">🌿</div><div><strong>One sachet. One cup.</strong><span>A simple herbal ritual.</span></div></div>
        <div class="routine-meta-item"><div class="routine-meta-icon">⚖️</div><div><strong>10g</strong><span>of whole herbs per bag</span></div></div>
        <div class="routine-meta-item"><div class="routine-meta-icon">☕</div><div><strong>Brews 2–3</strong><span>potent cups from each bag</span></div></div>
      </div>
    </div>
  `;
  productSection.parentNode.insertBefore(section, productSection);
}

document.addEventListener("DOMContentLoaded", () => {
  addIngredientsSection();
  addRoutineSection();

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
