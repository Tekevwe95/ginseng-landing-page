const API="https://ginseng-plus-api.onrender.com";
window.addEventListener("DOMContentLoaded",()=>{
 const b=document.getElementById("notifications"); if(!b)return;
 b.addEventListener("click", async (event)=>{
  event.preventDefault(); event.stopImmediatePropagation();
  try{
   b.disabled=true; b.textContent="⏳ Enabling…";
   if(!window.isSecureContext) throw new Error("Notifications require HTTPS.");
   if(!("Notification" in window)||!("serviceWorker" in navigator)||!("PushManager" in window)) throw new Error("This browser does not support Web Push.");
   const p=await Notification.requestPermission();
   if(p!=="granted") throw new Error("Notification permission was not granted. Check Chrome site notification settings.");
   const reg=await navigator.serviceWorker.register("/admin/service-worker.js?v=7",{scope:"/admin/",updateViaCache:"none"});
   await navigator.serviceWorker.ready; await reg.update().catch(()=>{});
   const token=localStorage.getItem("ginseng_admin_token")||"";
   if(!token) throw new Error("Please sign in to the admin dashboard first.");
   const kr=await fetch(API+"/api/admin/push/public-key",{headers:{"X-Admin-Token":token,Accept:"application/json"},cache:"no-store"});
   const kp=await kr.json().catch(()=>null);
   if(!kr.ok) throw new Error(kp?.detail||`Server returned ${kr.status} for the push key.`);
   if(!kp?.publicKey) throw new Error("The server did not return a VAPID public key.");
   let sub=await reg.pushManager.getSubscription();
   if(!sub) sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:decodeKey(kp.publicKey)});
   const j=sub.toJSON();
   if(!j.endpoint||!j.keys?.p256dh||!j.keys?.auth) throw new Error("The browser returned an incomplete push subscription.");
   const sr=await fetch(API+"/api/admin/push/subscribe",{method:"POST",headers:{"Content-Type":"application/json","X-Admin-Token":token},body:JSON.stringify({endpoint:j.endpoint,p256dh:j.keys.p256dh,auth:j.keys.auth})});
   const sp=await sr.json().catch(()=>null);
   if(!sr.ok) throw new Error(sp?.detail||`Could not save subscription (${sr.status}).`);
   await reg.showNotification("Megastore Wellness",{body:"Browser notifications are now enabled.",icon:"/admin/icon-192.png",badge:"/admin/icon-192.png",tag:"notification-enabled"});
   b.textContent="🔔 Notifications enabled"; document.getElementById("testNotification")?.classList.remove("hidden"); b.disabled=false;
  }catch(e){console.error("Web Push setup failed:",e); alert("Notifications could not be enabled.\n\n"+(e?.message||e)); b.disabled=false; b.textContent="🔔 Enable notifications";}
 },true);
});
function decodeKey(s){const p="=".repeat((4-s.length%4)%4),r=atob((s+p).replace(/-/g,"+").replace(/_/g,"/"));return Uint8Array.from([...r],c=>c.charCodeAt(0));}
