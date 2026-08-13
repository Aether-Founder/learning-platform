# Service Worker for Offline Support (Tauri Preparation)
# This file registers a service worker for PWA capabilities
# Prepared for future Tauri desktop app integration

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Basic caching strategy - can be enhanced for Tauri integration
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
