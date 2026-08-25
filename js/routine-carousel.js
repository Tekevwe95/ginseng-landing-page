document.addEventListener('DOMContentLoaded',()=>{
  const track=document.querySelector('#routine .routine-steps');
  const cards=track?[...track.querySelectorAll('.routine-step')]:[];
  if(!track||cards.length<2)return;

  const images=['assets/routine-01-drop.png','assets/routine-02-pour.png','assets/routine-03-steep.png'];
  const stages=['DROP','POUR','STEEP & SIP'];

  cards.forEach((card,i)=>{
    const image=card.querySelector('.routine-image');
    if(image){
      image.style.backgroundImage=`url('${images[i]}')`;
      image.style.backgroundSize='cover';
      image.style.backgroundPosition='center';
    }
  });

  const controls=document.createElement('div');
  controls.className='routine-interactive';
  controls.innerHTML='<div class="routine-progress" aria-label="Brewing progress"></div><div class="routine-controls"><button type="button" class="routine-control routine-prev">← Previous</button><button type="button" class="routine-control routine-next">Next →</button></div><p class="routine-swipe-hint">Swipe to move through the three steps</p>';
  track.after(controls);

  const progress=controls.querySelector('.routine-progress');
  stages.forEach((stage,i)=>{
    const button=document.createElement('button');
    button.type='button';
    button.className='routine-progress-dot';
    button.textContent=stage;
    button.dataset.index=i;
    progress.appendChild(button);
  });

  let current=0;
  let programmaticScroll=false;
  let programmaticTimer=null;
  const mobile=()=>matchMedia('(max-width:800px)').matches;
  const dots=[...progress.querySelectorAll('button')];
  const prev=controls.querySelector('.routine-prev');
  const next=controls.querySelector('.routine-next');

  function updateState(index){
    current=Math.max(0,Math.min(cards.length-1,index));
    dots.forEach((dot,i)=>dot.classList.toggle('is-active',i===current));
    prev.disabled=current===0;
    next.disabled=current===cards.length-1;
  }

  function cardScrollLeft(index){
    const card=cards[index];
    return card.offsetLeft-(track.clientWidth-card.offsetWidth)/2;
  }

  function goTo(index,behavior='smooth'){
    const target=Math.max(0,Math.min(cards.length-1,index));
    updateState(target);
    if(!mobile())return;

    programmaticScroll=true;
    clearTimeout(programmaticTimer);
    track.scrollTo({left:cardScrollLeft(target),top:0,behavior});
    programmaticTimer=setTimeout(()=>{programmaticScroll=false},behavior==='smooth'?500:50);
  }

  prev.addEventListener('click',()=>goTo(current-1));
  next.addEventListener('click',()=>goTo(current+1));
  dots.forEach(dot=>dot.addEventListener('click',()=>goTo(Number(dot.dataset.index))));

  let scrollEndTimer=null;
  track.addEventListener('scroll',()=>{
    if(!mobile()||programmaticScroll)return;
    clearTimeout(scrollEndTimer);
    scrollEndTimer=setTimeout(()=>{
      const center=track.scrollLeft+track.clientWidth/2;
      let nearest=0;
      let distance=Infinity;
      cards.forEach((card,i)=>{
        const cardCenter=card.offsetLeft+card.offsetWidth/2;
        const nextDistance=Math.abs(cardCenter-center);
        if(nextDistance<distance){distance=nextDistance;nearest=i}
      });
      updateState(nearest);
    },80);
  },{passive:true});

  addEventListener('resize',()=>updateState(Math.min(current,cards.length-1)));

  // Set the initial indicator state only. Do not call scrollIntoView here:
  // doing so can move the entire page back to the Daily Ritual section on mobile.
  updateState(0);
});