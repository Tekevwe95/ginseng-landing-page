function checkoutUrl(packageName){return `checkout.html?package=${encodeURIComponent(packageName)}`}
function track(eventName,details={}){window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:eventName,...details})}
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.package[data-package]').forEach(button=>button.addEventListener('click',()=>{const packageName=button.dataset.package||'';track('package_selected',{package:packageName});window.location.href=checkoutUrl(packageName)}));
  document.getElementById('claimOffer')?.addEventListener('click',()=>{const packageName='3 Packs + 1 Free — ₦59,900';track('special_offer_selected',{package:packageName});window.location.href=checkoutUrl(packageName)});
  document.querySelectorAll('[data-track]').forEach(element=>element.addEventListener('click',()=>track('cta_clicked',{cta:element.dataset.track})));
  const bar=document.getElementById('mobilePurchaseBar'),packages=document.getElementById('packages');
  if(bar&&packages&&'IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{bar.classList.toggle('is-hidden',entries[0].isIntersecting)},{threshold:.08});observer.observe(packages)}
});