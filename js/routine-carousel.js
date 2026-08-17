document.addEventListener('DOMContentLoaded', () => {
  const routine = document.getElementById('routine');
  const track = routine?.querySelector('.routine-steps');
  const cards = track ? Array.from(track.querySelectorAll('.routine-step')) : [];
  if (!track || cards.length < 2) return;

  const style = document.createElement('style');
  style.id = 'routine-carousel-styles';
  style.textContent = `
    .routine-carousel{display:block!important;position:relative;max-width:680px!important;height:560px;margin:0 auto!important;overflow:hidden;touch-action:pan-y}
    .routine-carousel .routine-number{display:none!important}
    .routine-carousel .routine-carousel-card{position:absolute;top:0;left:50%;width:100%;margin:0;opacity:0;visibility:hidden;transform:translateX(100%);will-change:transform,opacity;box-shadow:0 12px 34px rgba(18,59,39,.09)}
    .routine-carousel .routine-carousel-card.is-active{visibility:visible;opacity:1;transform:translateX(-50%)}
    .routine-carousel .routine-carousel-card.slide-in-right{visibility:visible;animation:routineCardIn .72s cubic-bezier(.22,.8,.24,1) forwards}
    .routine-carousel .routine-carousel-card.slide-out-left{visibility:visible;animation:routineCardOut .72s cubic-bezier(.65,.05,.36,1) forwards}
    @keyframes routineCardIn{from{opacity:0;transform:translateX(105%)}to{opacity:1;transform:translateX(-50%)}}
    @keyframes routineCardOut{from{opacity:1;transform:translateX(-50%)}to{opacity:0;transform:translateX(-155%)}}
    .routine-interactive{max-width:680px;margin:20px auto 0;display:flex;align-items:center;justify-content:space-between;gap:14px}
    .routine-progress{display:flex;align-items:center;gap:7px;flex:1;justify-content:center}
    .routine-progress-dot{width:8px;height:8px;border-radius:50%;background:#d7d9cc;transition:all .25s ease}
    .routine-progress-dot.is-active{width:28px;border-radius:999px;background:var(--green)}
    .routine-control{border:1px solid #d9decf;background:#fff;color:var(--green-dark);border-radius:999px;padding:10px 16px;font:inherit;font-weight:700;cursor:pointer;transition:transform .2s,box-shadow .2s,border-color .2s}
    .routine-control:hover{transform:translateY(-2px);border-color:var(--green);box-shadow:0 8px 20px rgba(18,59,39,.08)}
    .routine-control:focus-visible{outline:3px solid rgba(18,59,39,.18);outline-offset:2px}
    .routine-next{min-width:116px;text-align:center}
    .routine-next.is-final{min-width:160px}
    .routine-swipe-hint{text-align:center;color:var(--muted);font-size:.8rem;margin-top:10px}
    .routine-carousel.reduced-motion .routine-carousel-card{transition:none!important;animation:none!important}
    @media(max-width:800px){
      .routine-carousel{max-width:520px!important;height:500px}
      .routine-carousel .routine-carousel-card{width:100%}
      .routine-interactive{max-width:520px}
      .routine-control{padding:9px 13px}
    }
    @media(max-width:520px){
      .routine-carousel{height:470px}
      .routine-interactive{gap:8px}
      .routine-next{min-width:94px;font-size:.86rem}
      .routine-control{padding:8px 11px;font-size:.82rem}
    }
    @media(prefers-reduced-motion:reduce){
      .routine-carousel .routine-carousel-card{animation:none!important;transition:none!important}
    }
  `;
  document.head.appendChild(style);

  const routineImages = [
    'assets/routine-01-drop.png',
    'assets/routine-02-pour.png',
    'assets/routine-03-steep.png'
  ];

  const stages = ['DROP', 'POUR', 'STEEP & SIP'];
  const descriptions = [
    'Place one 10g tea bag into your cup.',
    'Pour water at 90°C or above into the cup.',
    'Let the herbs infuse for 3–5 minutes, then enjoy your tea.'
  ];

  track.classList.add('routine-carousel');
  cards.forEach((card, index) => {
    card.classList.add('routine-carousel-card');
    card.setAttribute('aria-hidden', index === 0 ? 'false' : 'true');
    const image = card.querySelector('.routine-image');
    if (image && routineImages[index]) {
      image.style.backgroundImage = `url('${routineImages[index]}')`;
      image.style.backgroundSize = 'cover';
      image.style.backgroundPosition = 'center';
    }
    const number = card.querySelector('.routine-number');
    if (number) number.remove();
  });

  const controls = document.createElement('div');
  controls.className = 'routine-interactive';
  controls.innerHTML = `
    <button type="button" class="routine-control routine-prev" aria-label="Previous brewing step">←</button>
    <div class="routine-progress" aria-label="Brewing progress"></div>
    <button type="button" class="routine-control routine-next">Next →</button>
  `;
  track.insertAdjacentElement('afterend', controls);

  const progress = controls.querySelector('.routine-progress');
  stages.forEach((stage, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'routine-progress-dot';
    dot.setAttribute('aria-label', `Go to ${stage.toLowerCase()} step`);
    dot.dataset.index = index;
    progress.appendChild(dot);
  });

  const hint = document.createElement('p');
  hint.className = 'routine-swipe-hint';
  hint.textContent = 'Swipe left or right to move through your ritual';
  controls.insertAdjacentElement('afterend', hint);

  let current = 0;
  let timer = null;
  let paused = false;
  let touchStartX = 0;
  let touchStartY = 0;
  let hasInteracted = false;

  const updateUI = () => {
    progress.querySelectorAll('.routine-progress-dot').forEach((dot, index) => {
      dot.classList.toggle('is-active', index === current);
      dot.setAttribute('aria-current', index === current ? 'step' : 'false');
    });

    const next = controls.querySelector('.routine-next');
    next.textContent = current === cards.length - 1 ? 'Get Your Ginseng →' : 'Next →';
    next.classList.toggle('is-final', current === cards.length - 1);
    next.setAttribute('aria-label', current === cards.length - 1 ? 'Go to order section' : `Go to ${stages[Math.min(current + 1, cards.length - 1)]} step`);
  };

  const showCard = (nextIndex, direction = 1) => {
    const next = (nextIndex + cards.length) % cards.length;
    const previous = current;
    if (next === previous) return;

    current = next;
    cards.forEach((card, index) => {
      card.classList.remove('is-active', 'slide-in-right', 'slide-out-left');
      card.setAttribute('aria-hidden', index === current ? 'false' : 'true');
    });

    if (direction >= 0) {
      cards[previous].classList.add('slide-out-left');
      cards[current].classList.add('slide-in-right', 'is-active');
    } else {
      cards[current].style.transform = 'translateX(-155%)';
      cards[current].classList.add('is-active');
      requestAnimationFrame(() => {
        cards[current].style.transition = 'transform .72s cubic-bezier(.22,.8,.24,1), opacity .72s ease';
        cards[current].style.transform = 'translateX(-50%)';
        cards[previous].style.transition = 'transform .72s cubic-bezier(.65,.05,.36,1), opacity .72s ease';
        cards[previous].style.transform = 'translateX(105%)';
        cards[previous].style.opacity = '0';
      });
      window.setTimeout(() => {
        cards[current].style = '';
        cards[previous].style = '';
      }, 760);
    }

    updateUI();
  };

  const stop = () => {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  };

  const start = () => {
    if (timer || paused || hasInteracted || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    timer = window.setInterval(() => showCard(current + 1, 1), 4300);
  };

  const interact = () => {
    hasInteracted = true;
    stop();
  };

  controls.querySelector('.routine-prev').addEventListener('click', () => {
    interact();
    showCard(current - 1, -1);
  });

  controls.querySelector('.routine-next').addEventListener('click', () => {
    if (current === cards.length - 1) {
      document.getElementById('order')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    interact();
    showCard(current + 1, 1);
  });

  progress.querySelectorAll('.routine-progress-dot').forEach((dot) => {
    dot.addEventListener('click', () => {
      const target = Number(dot.dataset.index);
      if (target === current) return;
      interact();
      showCard(target, target > current ? 1 : -1);
    });
  });

  track.addEventListener('touchstart', (event) => {
    touchStartX = event.changedTouches[0].screenX;
    touchStartY = event.changedTouches[0].screenY;
  }, { passive: true });

  track.addEventListener('touchend', (event) => {
    const deltaX = event.changedTouches[0].screenX - touchStartX;
    const deltaY = event.changedTouches[0].screenY - touchStartY;
    if (Math.abs(deltaX) < 45 || Math.abs(deltaX) < Math.abs(deltaY)) return;
    interact();
    showCard(current + (deltaX < 0 ? 1 : -1), deltaX < 0 ? 1 : -1);
  }, { passive: true });

  track.addEventListener('mouseenter', () => { paused = true; stop(); });
  track.addEventListener('mouseleave', () => { paused = false; start(); });
  track.addEventListener('focusin', () => { paused = true; stop(); });
  track.addEventListener('focusout', () => {
    if (!track.contains(document.activeElement)) { paused = false; start(); }
  });

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    track.classList.add('reduced-motion');
  }

  updateUI();
  cards[0].classList.add('is-active');
  start();
});
