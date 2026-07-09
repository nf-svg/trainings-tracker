const CACHE_NAME = 'trainings-tracker-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Installation: Dateien cachen
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Aktivierung: alten Cache löschen
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Cache-First für App-Dateien, Network-First für Firebase
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Firebase API-Calls immer über Netzwerk
  if (url.hostname.includes('firebase') || url.hostname.includes('google')) {
    event.respondWith(fetch(event.request).catch(() => new Response('', { status: 503 })));
    return;
  }

  // App-Dateien: Cache-First
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline-Fallback: index.html zurückgeben
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
