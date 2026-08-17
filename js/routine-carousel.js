document.addEventListener('DOMContentLoaded', () => {
  const routine = document.getElementById('routine');
  const track = routine?.querySelector('.routine-steps');
  const cards = track ? Array.from(track.querySelectorAll('.routine-step')) : [];
  if (!track || cards.length < 2) return;

  const style = document.createElement('style');
  style.id = 'routine-carousel-styles';
  style.textContent = `
    .routine-carousel{display:block!important;position:relative;max-width:680px!important;height:470px;margin:0 auto!important;overflow:hidden}
    .routine-carousel .routine-carousel-card{position:absolute;top:0;left:50%;width:100%;margin:0;opacity:0;visibility:hidden;transform:translateX(100%);will-change:transform,opacity;box-shadow:0 12px 34px rgba(18,59,39,.09)}
    .routine-carousel .routine-carousel-card.is-active{visibility:visible;opacity:1;transform:translateX(-50%)}
    .routine-carousel .routine-carousel-card.slide-in-right{visibility:visible;animation:routineCardIn .72s cubic-bezier(.22,.8,.24,1) forwards}
    .routine-carousel .routine-carousel-card.slide-out-left{visibility:visible;animation:routineCardOut .72s cubic-bezier(.65,.05,.36,1) forwards}
    @keyframes routineCardIn{from{opacity:0;transform:translateX(105%)}to{opacity:1;transform:translateX(-50%)}}
    @keyframes routineCardOut{from{opacity:1;transform:translateX(-50%)}to{opacity:0;transform:translateX(-155%)}}
    .routine-carousel.reduced-motion .routine-carousel-card{transition:none!important;animation:none!important}
    @media(max-width:800px){
      .routine-carousel{max-width:520px!important;height:410px}
      .routine-carousel .routine-carousel-card{width:100%}
    }
    @media(prefers-reduced-motion:reduce){
      .routine-carousel .routine-carousel-card{animation:none!important;transition:none!important}
    }
  `;
  document.head.appendChild(style);

  // One fixed showcase position. Each card enters from the right and leaves
  // to the left, giving every step its own moment without moving the section.
  const routineImages = [
    'assets/routine-01-drop.png',
    'assets/routine-02-pour.png',
    'assets/routine-03-steep.png'
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

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    track.classList.add('reduced-motion');
    cards.forEach((card, index) => card.classList.toggle('is-active', index === 0));
    return;
  }

  showCard(0);
  start();
});
