const CACHE_NAME = 'toetsweek-v1';
const urlsToCache = [
  '/',
  '/calendar',
  '/profile',
  '/analytics',
  '/manifest.json',
  '/locales/en.csv',
  '/locales/nl.csv',
  '/locales/fr.csv',
  '/locales/de.csv',
  '/locales/es.csv',
  '/locales/tr.csv',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)));
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
