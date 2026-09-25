// Service worker: juega sin conexión. Sube la versión para forzar actualización.
const V='noname-f1-1';
const CORE=['./','index.html','manifest.webmanifest','js/config.js','js/meta.js','js/audio.js','js/engine.js','js/render.js','js/bosses.js','js/levels.js','js/net.js','js/ui.js','icons/icon-192.png','icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.pathname.includes('/rest/v1/'))return; // nunca cachear el ranking
  // red primero (para recibir actualizaciones), caché si no hay conexión
  e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();if(r.ok||r.type==='opaque')caches.open(V).then(c=>c.put(e.request,cp));return r;}).catch(()=>caches.match(e.request,{ignoreSearch:true})));
});
