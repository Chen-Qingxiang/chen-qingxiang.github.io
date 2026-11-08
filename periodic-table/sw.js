/* Scope-limited PWA: public assets only. Never cache files picked by users. */
const VERSION = "2026-11-09-a";
const SHELL = "periodic-table-pwa-shell-" + VERSION;
const ROOT = new URL(self.registration.scope);
const CORE = ["index.html","style.css","xray.css","elements.js","xray.js","app.js","pwa-register.js","manifest.webmanifest","icons/icon-192.png","icons/icon-512.png","icons/apple-touch-icon.png","icons/icon.svg"];
const CORE_URLS = CORE.map(p => new URL(p,ROOT).href);
const CORE_SET = new Set(CORE_URLS);
const HOME = new URL('index.html',ROOT).href;

const EXTERNAL = ["https://raw.githubusercontent.com/tschoonj/xraylib/master/data/fluor_lines/BindingEnergies.dat","https://raw.githubusercontent.com/tschoonj/xraylib/master/data/fluor_lines/fluor_lines.dat","https://raw.githubusercontent.com/tschoonj/xraylib/master/data/CS_Photo.dat","https://raw.githubusercontent.com/tschoonj/xraylib/master/data/CS_Rayl.dat","https://raw.githubusercontent.com/tschoonj/xraylib/master/data/CS_Compt.dat","https://raw.githubusercontent.com/tschoonj/xraylib/master/data/atomicweight.dat","https://raw.githubusercontent.com/tschoonj/xraylib/master/data/densities.dat"];
const EXTERNAL_SET = new Set(EXTERNAL);
const EXT_CACHE = "periodic-table-pwa-external-v1";
async function networkFirst(request, cacheName, key=request) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok && (response.type==='basic' || response.type==='cors')) await cache.put(key,response.clone());
    return response;
  } catch(e) {
    const cached = await cache.match(key);
    if (cached) return cached;
    throw e;
  }
}
self.addEventListener('install',event => event.waitUntil((async () => {
  await (await caches.open(SHELL)).addAll(CORE_URLS);
  
  await self.skipWaiting();
})()));
self.addEventListener('activate',event => event.waitUntil((async () => {
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k.startsWith('periodic-table-pwa-shell-')&&k!==SHELL).map(k=>caches.delete(k)));
  await self.clients.claim();
})()));
self.addEventListener('fetch',event => {
  const request=event.request;
  if (request.method!=='GET') return;
  const url = new URL(request.url);
  if (EXTERNAL_SET.has(url.href)) {
    event.respondWith(networkFirst(request,EXT_CACHE));
    return;
  }
  if(url.origin!==ROOT.origin || !url.pathname.startsWith(ROOT.pathname))return;
  if(request.mode==='navigate') {
    if (url.pathname===ROOT.pathname || url.pathname===ROOT.pathname+'index.html') {
      const key = HOME;
      event.respondWith(networkFirst(request,SHELL,key));
    }
    return;
  }
  const canonical = new URL(url.href);canonical.search='';canonical.hash='';
  if(CORE_SET.has(canonical.href)){event.respondWith(networkFirst(request,SHELL,canonical.href));return;}
  
});
