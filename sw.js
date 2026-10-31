const CACHE="nexa-studio-v1";
const FILES=["./","./index.html","./styles.css","./app.js","./manifest.json"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
self.addEventListener("fetch",e=>{
 if(e.request.method!=="GET") return;
 e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request)));
});