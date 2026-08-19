document.addEventListener('DOMContentLoaded', () => {
  const routine = document.getElementById('routine');
  const track = routine?.querySelector('.routine-steps');
  const cards = track ? Array.from(track.querySelectorAll('.routine-step')) : [];
  if (!track || cards.length < 2) return;

  const style = document.createElement('style');
  style.id = 'routine-carousel-styles';
  style.textContent = `
    .routine-carousel{display:block!important;position:relative;max-width:680px!important;height:560px;margin:0 auto!important;overflow:hidden;touch-action:pan-y;perspective:1200px}
    .routine-carousel .routine-number{display:none!important}
    .routine-carousel .routine-carousel-card{position:absolute;top:0;left:50%;width:100%;margin:0;opacity:0;visibility:hidden;transform:translate3d(115%,0,0) scale(.96);will-change:transform,opacity;box-shadow:0 16px 45px rgba(18,59,39,.10);transition:box-shadow .45s ease}
    .routine-carousel .routine-carousel-card.is-active{visibility:visible;opacity:1;transform:translate3d(-50%,0,0) scale(1);z-index:2}
    .routine-carousel .routine-carousel-card.is-active:hover{box-shadow:0 22px 55px rgba(18,59,39,.14)}
    .routine-carousel .routine-image{transform:scale(1.01);transition:transform .9s cubic-bezier(.22,.8,.24,1);overflow:hidden}
    .routine-carousel .routine-carousel-card.is-active:hover .routine-image{transform:scale(1.045)}
    .routine-carousel .routine-carousel-card.slide-in-right{visibility:visible;z-index:2;animation:routineCardIn .72s cubic-bezier(.22,.8,.24,1) forwards}
    .routine-carousel .routine-carousel-card.slide-out-left{visibility:visible;z-index:1;animation:routineCardOut .72s cubic-bezier(.65,.05,.36,1) forwards}
    @keyframes routineCardIn{from{opacity:0;transform:translate3d(105%,0,0) scale(.965)}to{opacity:1;transform:translate3d(-50%,0,0) scale(1)}}
    @keyframes routineCardOut{from{opacity:1;transform:translate3d(-50%,0,0) scale(1)}to{opacity:0;transform:translate3d(-155%,0,0) scale(.965)}}
    .routine-interactive{max-width:680px;margin:18px auto 0;display:grid;grid-template-columns:1fr;gap:10px}
    .routine-progress{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;width:100%}
    .routine-progress-dot{position:relative;border:0;background:transparent;padding:9px 4px 12px;color:var(--muted);font:inherit;font-size:.72rem;font-weight:800;letter-spacing:.08em;cursor:pointer;text-align:left;text-transform:uppercase}
    .routine-progress-dot::before{content:"";position:absolute;left:0;right:0;bottom:0;height:3px;border-radius:999px;background:#e3e5dc;transition:background .35s ease,transform .35s ease}
    .routine-progress-dot::after{content:"";position:absolute;left:0;bottom:0;width:0;height:3px;border-radius:999px;background:var(--green);transition:width .55s cubic-bezier(.22,.8,.24,1)}
    .routine-progress-dot.is-active{color:var(--green-dark)}
    .routine-progress-dot.is-active::after{width:100%}
    .routine-progress-dot:hover{color:var(--green-dark)}
    .routine-progress-dot:focus-visible{outline:2px solid var(--green);outline-offset:3px;border-radius:5px}
    .routine-controls{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:2px}
    .routine-control{border:0;background:transparent;color:var(--green-dark);padding:8px 0;font:inherit;font-weight:700;cursor:pointer;transition:transform .25s ease,opacity .25s ease}
    .routine-control:hover{transform:translateX(-3px)}
    .routine-next:hover{transform:translateX(3px)}
    .routine-control:focus-visible{outline:2px solid var(--green);outline-offset:4px;border-radius:4px}
    .routine-swipe-hint{text-align:center;color:var(--muted);font-size:.78rem;margin:2px 0 0;opacity:.8}
    .routine-carousel.reduced-motion .routine-carousel-card,.routine-carousel.reduced-motion .routine-image{animation:none!important;transition:none!important}
    @media(max-width:800px){.routine-carousel{max-width:520px!important;height:500px}.routine-carousel .routine-carousel-card{width:100%}.routine-interactive{max-width:520px}}
    @media(max-width:520px){.routine-carousel{height:470px}.routine-progress{gap:4px}.routine-progress-dot{font-size:.64rem;padding-bottom:10px}.routine-controls{font-size:.82rem}}
    @media(prefers-reduced-motion:reduce){.routine-carousel .routine-carousel-card,.routine-carousel .routine-image{animation:none!important;transition:none!important}}
  `;
  document.head.appendChild(style);

  const routineImages = ['assets/routine-01-drop.png','assets/routine-02-pour.png','assets/routine-03-steep.png'];
  const stages = ['DROP', 'POUR', 'STEEP & SIP'];
  track.classList.add('routine-carousel');
  cards.forEach((card,index)=>{card.classList.add('routine-carousel-card');card.setAttribute('aria-hidden',index===0?'false':'true');const image=card.querySelector('.routine-image');if(image&&routineImages[index]){image.style.backgroundImage=`url('${routineImages[index]}')`;image.style.backgroundSize='cover';image.style.backgroundPosition='center'}card.querySelector('.routine-number')?.remove()});
  const controls=document.createElement('div');controls.className='routine-interactive';controls.innerHTML=`<div class="routine-progress" aria-label="Brewing progress"></div><div class="routine-controls"><button type="button" class="routine-control routine-prev" aria-label="Previous brewing step">← Previous</button><button type="button" class="routine-control routine-next" aria-label="Next brewing step">Next →</button></div><p class="routine-swipe-hint">Swipe or scroll to move through your ritual</p>`;track.insertAdjacentElement('afterend',controls);
  const progress=controls.querySelector('.routine-progress');stages.forEach((stage,index)=>{const button=document.createElement('button');button.type='button';button.className='routine-progress-dot';button.dataset.index=index;button.textContent=stage;button.setAttribute('aria-label',`Show ${stage.toLowerCase()} step`);progress.appendChild(button)});
  let current=0,timer=null,paused=false,hasInteracted=false,touchStartX=0,touchStartY=0,wheelLock=false;
  const updateUI=()=>{progress.querySelectorAll('.routine-progress-dot').forEach((button,index)=>{button.classList.toggle('is-active',index===current);button.setAttribute('aria-current',index===current?'step':'false')})};
  const showCard=(nextIndex,direction=1)=>{const next=Math.max(0,Math.min(cards.length-1,nextIndex));const previous=current;if(next===previous)return;current=next;cards.forEach(card=>card.classList.remove('is-active','slide-in-right','slide-out-left'));cards[previous].setAttribute('aria-hidden','true');cards[current].setAttribute('aria-hidden','false');if(direction>=0){cards[previous].classList.add('slide-out-left');cards[current].classList.add('slide-in-right','is-active')}else{cards[current].style.transform='translate3d(-155%,0,0) scale(.965)';cards[current].style.visibility='visible';cards[current].style.opacity='0';cards[current].classList.add('is-active');requestAnimationFrame(()=>{cards[current].style.transition='transform .72s cubic-bezier(.22,.8,.24,1), opacity .72s ease';cards[previous].style.transition='transform .72s cubic-bezier(.65,.05,.36,1), opacity .72s ease';cards[current].style.transform='translate3d(-50%,0,0) scale(1)';cards[current].style.opacity='1';cards[previous].style.transform='translate3d(105%,0,0) scale(.965)';cards[previous].style.opacity='0'});window.setTimeout(()=>{cards[current].style.cssText='';cards[previous].style.cssText=''},760)}updateUI()};
  const stop=()=>{if(timer){clearInterval(timer);timer=null}};const start=()=>{if(timer||paused||hasInteracted||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;timer=setInterval(()=>{const next=current+1;showCard(next>=cards.length?0:next,1)},4800)};const interact=()=>{hasInteracted=true;stop()};
  controls.querySelector('.routine-prev').addEventListener('click',()=>{interact();showCard(current===0?cards.length-1:current-1,-1)});controls.querySelector('.routine-next').addEventListener('click',()=>{interact();if(current===cards.length-1){document.getElementById('order')?.scrollIntoView({behavior:'smooth',block:'start'});return}showCard(current+1,1)});progress.querySelectorAll('.routine-progress-dot').forEach(button=>button.addEventListener('click',()=>{const target=Number(button.dataset.index);if(target===current)return;interact();showCard(target,target>current?1:-1)}));
  track.addEventListener('touchstart',event=>{touchStartX=event.changedTouches[0].screenX;touchStartY=event.changedTouches[0].screenY},{passive:true});track.addEventListener('touchend',event=>{const deltaX=event.changedTouches[0].screenX-touchStartX,deltaY=event.changedTouches[0].screenY-touchStartY;if(Math.abs(deltaX)<45||Math.abs(deltaX)<Math.abs(deltaY))return;interact();if(deltaX<0)showCard(current+1>=cards.length?0:current+1,1);else showCard(current-1<0?cards.length-1:current-1,-1)},{passive:true});
  track.addEventListener('wheel',event=>{if(Math.abs(event.deltaY)<=Math.abs(event.deltaX)||wheelLock)return;const rect=track.getBoundingClientRect();const visible=rect.bottom>0&&rect.top<window.innerHeight;if(!visible)return;const direction=event.deltaY>0?1:-1,target=current+direction;if(target<0||target>=cards.length)return;event.preventDefault();interact();wheelLock=true;showCard(target,direction);setTimeout(()=>{wheelLock=false},760)},{passive:false});
  track.addEventListener('mousemove',event=>{const active=track.querySelector('.routine-carousel-card.is-active');const image=active?.querySelector('.routine-image');if(!image)return;const rect=track.getBoundingClientRect();const x=((event.clientX-rect.left)/rect.width-.5)*8,y=((event.clientY-rect.top)/rect.height-.5)*5;image.style.transform=`scale(1.045) translate(${x}px, ${y}px)`});track.addEventListener('mouseleave',()=>{track.querySelectorAll('.routine-image').forEach(image=>{image.style.transform=''})});track.addEventListener('mouseenter',()=>{paused=true;stop()});track.addEventListener('mouseleave',()=>{paused=false;start()});track.addEventListener('focusin',()=>{paused=true;stop()});track.addEventListener('focusout',()=>{if(!track.contains(document.activeElement)){paused=false;start()}});if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)track.classList.add('reduced-motion');updateUI();cards[0].classList.add('is-active');start();
});

// Customer testimonial supplied by the customer: shown as a WhatsApp-style verified feedback card.
document.addEventListener('DOMContentLoaded', () => {
  const reviews = document.querySelector('.reviews-grid');
  if (!reviews || reviews.dataset.testimonialAdded === 'true') return;
  reviews.dataset.testimonialAdded = 'true';
  const style = document.createElement('style');
  style.textContent = `
    .customer-testimonial{grid-column:1/-1;display:flex;justify-content:center;margin-top:4px}
    .customer-testimonial-card{width:min(100%,760px);background:#f0f7f2;border:1px solid #d8e7dc;border-radius:22px;padding:22px;box-shadow:0 14px 38px rgba(18,59,39,.08);position:relative;overflow:hidden}
    .customer-testimonial-card::before{content:"";position:absolute;inset:0 0 auto 0;height:4px;background:var(--green)}
    .testimonial-label{display:flex;align-items:center;gap:9px;margin-bottom:14px;color:var(--green-dark);font-size:.78rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
    .testimonial-label span{width:9px;height:9px;border-radius:50%;background:#20b858;display:inline-block}
    .whatsapp-bubble{max-width:88%;margin-left:auto;background:#d9fdd3;color:#18231b;border-radius:14px 4px 14px 14px;padding:15px 17px;box-shadow:0 2px 7px rgba(0,0,0,.06);font-size:1rem;line-height:1.5;position:relative}
    .whatsapp-meta{text-align:right;margin-top:7px;font-size:.7rem;color:#66736a}
    .whatsapp-meta strong{color:#1b8b5a;font-weight:800;margin-left:5px}
    .brand-reply{max-width:88%;margin-top:10px;background:#fff;border:1px solid #e2e8e3;color:#405047;border-radius:4px 14px 14px 14px;padding:13px 16px;font-size:.9rem;line-height:1.45}
    .testimonial-note{margin-top:14px;color:#748078;font-size:.72rem}
    @media(max-width:600px){.customer-testimonial-card{padding:17px;border-radius:18px}.whatsapp-bubble,.brand-reply{max-width:96%}}
  `;
  document.head.appendChild(style);
  const wrapper=document.createElement('div');wrapper.className='customer-testimonial';wrapper.innerHTML=`<article class="customer-testimonial-card"><div class="testimonial-label"><span></span>Customer feedback</div><div class="whatsapp-bubble">“I feel like myself more now. Highly recommended”<div class="whatsapp-meta">17:03 <strong>✓✓</strong></div></div><div class="brand-reply">Thank you for trusting us <span aria-label="verified">✅</span><div class="whatsapp-meta">17:04</div></div><p class="testimonial-note">Shared customer feedback via WhatsApp.</p></article>`;reviews.appendChild(wrapper);
});
