/* Service worker EUREKA Connect — KEP Congo
   Stratégie « réseau d'abord » pour les fichiers de l'application :
   une nouvelle version publiée sur l'hébergement arrive immédiatement
   sur les téléphones ; le cache ne sert qu'en l'absence de réseau. */
const CACHE='eureka-connect-kep-v20';
const CORE=[
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/logo-connexion.png',
  './data/employees.json',
  './downloads/Personnel%20KEP%20CONGO.xlsx'
];

self.addEventListener('install', event=>{
  event.waitUntil(
    caches.open(CACHE).then(cache=>
      Promise.all(CORE.map(url=>cache.add(new Request(url,{cache:'reload'})).catch(()=>{})))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch', event=>{
  const req=event.request;
  if(req.method!=='GET') return;
  const sameOrigin=new URL(req.url).origin===self.location.origin;

  if(sameOrigin){
    // Réseau d'abord, cache en secours (hors ligne).
    event.respondWith(
      fetch(req,{cache:'no-cache'}).then(resp=>{
        if(resp && resp.ok){ const copy=resp.clone(); caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{}); }
        return resp;
      }).catch(()=>caches.match(req).then(cached=>{
        if(cached) return cached;
        if(req.mode==='navigate') return caches.match('./index.html');
        return new Response('',{status:504,statusText:'Offline'});
      }))
    );
    return;
  }

  // Ressources externes (polices, module Excel) : cache d'abord.
  event.respondWith(
    caches.match(req).then(cached=>cached || fetch(req).then(resp=>{
      const copy=resp.clone(); caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});
      return resp;
    }).catch(()=>new Response('',{status:504,statusText:'Offline'})))
  );
});
