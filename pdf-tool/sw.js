/* Scope-limited PWA: public assets only. Never cache files picked by users. */
const VERSION = "2026-11-09-a";
const SHELL = "pdf-local-pwa-shell-" + VERSION;
const ROOT = new URL(self.registration.scope);
const CORE = ["index.html","styles.css","language.css","app.js","pwa-register.js","manifest.webmanifest","icons/icon-192.png","icons/icon-512.png","icons/apple-touch-icon.png","icons/icon.svg"];
const CORE_URLS = CORE.map(p => new URL(p,ROOT).href);
const CORE_SET = new Set(CORE_URLS);
const HOME = new URL('index.html',ROOT).href;

const EXTERNAL = ["https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js"];
const EXTERNAL_SET = new Set(EXTERNAL);
const EXT_CACHE = "pdf-local-pwa-external-v1";
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
  
    const ext = await caches.open(EXT_CACHE);
    await Promise.allSettled(EXTERNAL.map(async path => {
      const response = await fetch(path, {mode:'no-cors',credentials:'omit'});
      if (response.type==='opaque' || response.ok) await ext.put(path,response);
    }));
  await self.skipWaiting();
})()));
self.addEventListener('activate',event => event.waitUntil((async () => {
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k.startsWith('pdf-local-pwa-shell-')&&k!==SHELL).map(k=>caches.delete(k)));
  await self.clients.claim();
})()));
self.addEventListener('fetch',event => {
  const request=event.request;
  if (request.method!=='GET') return;
  const url = new URL(request.url);
  if (EXTERNAL_SET.has(url.href)) {
    event.respondWith((async()=>{const c=await caches.open(EXT_CACHE);try {const r=await fetch(request);if(r.ok||r.type==='opaque')await c.put(request,r.clone());return r;}catch(e){return await c.match(request)||Response.error();}})());
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
