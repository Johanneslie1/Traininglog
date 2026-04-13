// This is a minimal development service worker
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.clients.claim();
});

// Minimal fetch handler
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
