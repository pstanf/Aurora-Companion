const CACHE = 'aurora-companion-v76';
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

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(CORE_ASSETS))
      .then(() => caches.open(CACHE))
      .then(c => Promise.all(OPTIONAL_ASSETS.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Same-origin requests: serve from cache, refresh in the background.
// Cross-origin (e.g. the Google Sheet feed) is handled by the app itself.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fresh = fetch(e.request)
        .then(res => {
          if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => cached);
      return cached || fresh;
    })
  );
});
