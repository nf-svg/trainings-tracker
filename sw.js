const CACHE_NAME = 'trainings-tracker-v2';

// Installation
self.addEventListener('install', event => {
  self.skipWaiting();
});

// Aktivierung: ALLE alten Caches löschen
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys.map(key => caches.delete(key)));
    })
  );
  self.clients.claim();
});

// Fetch: NETWORK-FIRST für HTML (Updates kommen sofort an),
// Cache nur als Offline-Fallback
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Firebase API-Calls immer direkt
  if (url.hostname.includes('firebase') || url.hostname.includes('google')) {
    return;
  }

  // HTML-Dokumente: Netzwerk zuerst, Cache als Fallback
  if (event.request.destination === 'document' || url.pathname.endsWith('.html') || url.pathname.endsWith('/')) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // Andere Dateien (Icons etc.): Cache-First ist okay
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
