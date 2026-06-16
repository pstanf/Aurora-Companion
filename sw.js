const CACHE = 'aurora-companion-v81';
const CORE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './config.js',
  './audio.js',
  './journal-crypto.js',
  './app.js',
  './ui.js',
  './daily-meditations.js',
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
  './sounds/sound-bath.mp3',
  './sounds/meditation.mp3'
];
const NETWORK_FIRST = new Set([
  './index.html',
  './app.js',
  './ui.js',
  './styles.css',
  './config.js',
  './journal-crypto.js',
  './audio.js',
  './daily-meditations.js',
  './manifest.webmanifest'
]);

function isNetworkFirst(url){
  const path = url.pathname.replace(/\/$/, '/index.html');
  const rel = path.startsWith('/') ? '.' + path : './' + path;
  if(NETWORK_FIRST.has(rel)) return true;
  return url.pathname.endsWith('.html');
}

function networkFirst(request){
  return fetch(request)
    .then(res => {
      if(res.ok) caches.open(CACHE).then(c => c.put(request, res.clone()));
      return res;
    })
    .catch(() => caches.match(request));
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

// App shell: network-first so updates land quickly. Images/audio: cache-first for offline.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if(e.request.method !== 'GET' || url.origin !== location.origin) return;
  if(url.pathname.endsWith('/sw.js')) return;
  e.respondWith(isNetworkFirst(url) ? networkFirst(e.request) : cacheFirst(e.request));
});
