const CACHE = 'aurora-companion-v91';
const CORE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './config.js',
  './audio.js',
  './journal-crypto.js',
  './app.js',
  './ui.js',
  './manifest.webmanifest',
  './aurora-logo.png',
  './hero-bg.svg',
  './aurora-emblem.png',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
  './apple-touch-icon.png'
];
const OPTIONAL_ASSETS = [
  './daily-meditations.js',
  './sounds/sound-bath.mp3',
  './sounds/meditation.mp3'
];
const STALE_WHILE_REVALIDATE = new Set([
  './index.html',
  './app.js',
  './ui.js',
  './styles.css',
  './config.js',
  './journal-crypto.js',
  './audio.js',
  './manifest.webmanifest'
]);

function isStaleWhileRevalidate(url){
  const path = url.pathname.replace(/\/$/, '/index.html');
  const rel = path.startsWith('/') ? '.' + path : './' + path;
  if(STALE_WHILE_REVALIDATE.has(rel)) return true;
  return url.pathname.endsWith('.html');
}

function staleWhileRevalidate(request){
  return caches.open(CACHE).then(cache =>
    cache.match(request).then(cached => {
      const network = fetch(request)
        .then(res => {
          if(res.ok) cache.put(request, res.clone());
          return res;
        })
        .catch(() => cached);
      if(cached){
        network.catch(() => {});
        return cached;
      }
      return network;
    })
  );
}

function cacheFirst(request){
  return caches.match(request).then(cached => {
    const fresh = fetch(request)
      .then(res => {
        if(res.ok) caches.open(CACHE).then(c => c.put(request, res.clone()));
        return res;
      })
      .catch(() => cached);
    return cached || fresh;
  });
}

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(CORE_ASSETS))
      .then(() => caches.open(CACHE))
      .then(c => Promise.all(OPTIONAL_ASSETS.map(u => c.add(u).catch(() => {}))))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => {
  if(e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// App shell: stale-while-revalidate — instant from cache, refresh in background. Images/audio: cache-first.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if(e.request.method !== 'GET' || url.origin !== location.origin) return;
  if(url.pathname.endsWith('/sw.js')) return;
  e.respondWith(isStaleWhileRevalidate(url) ? staleWhileRevalidate(e.request) : cacheFirst(e.request));
});
