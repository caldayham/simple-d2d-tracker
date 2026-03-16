// Minimal service worker for PWA installability
// No offline caching -- app requires network for upload
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
