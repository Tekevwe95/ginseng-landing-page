document.addEventListener('DOMContentLoaded', () => {
  const routine = document.getElementById('routine');
  const track = routine?.querySelector('.routine-steps');
  const cards = track ? Array.from(track.querySelectorAll('.routine-step')) : [];
  if (!track || cards.length < 2) return;

  // Desktop: one fixed showcase position. Each card enters from the right,
  // crosses the position, then exits to the left before the next card enters.
  // Mobile uses the same one-card-at-a-time presentation.
  track.classList.add('routine-carousel');
  cards.forEach((card, index) => {
    card.classList.add('routine-carousel-card');
    card.setAttribute('aria-hidden', index === 0 ? 'false' : 'true');
  });

  let current = 0;
  let timer = null;
  let paused = false;

  const showCard = (next) => {
    const previous = current;
    current = (next + cards.length) % cards.length;

    cards.forEach((card, index) => {
      card.classList.remove('is-active', 'slide-in-right', 'slide-out-left', 'slide-in-left', 'slide-out-right');
      card.setAttribute('aria-hidden', index === current ? 'false' : 'true');
    });

    if (current === previous) {
      cards[current].classList.add('is-active');
      return;
    }

    cards[previous].classList.add('slide-out-left');
    cards[current].classList.add('slide-in-right', 'is-active');
  };

  const start = () => {
    if (timer || paused) return;
    timer = window.setInterval(() => showCard(current + 1), 4300);
  };

  const stop = () => {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  };

  track.addEventListener('mouseenter', () => { paused = true; stop(); });
  track.addEventListener('mouseleave', () => { paused = false; start(); });
  track.addEventListener('focusin', () => { paused = true; stop(); });
  track.addEventListener('focusout', () => {
    if (!track.contains(document.activeElement)) { paused = false; start(); }
  });

  // Respect reduced-motion preferences.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    track.classList.add('reduced-motion');
    cards.forEach((card, index) => card.classList.toggle('is-active', index === 0));
    return;
  }

  showCard(0);
  start();
});
