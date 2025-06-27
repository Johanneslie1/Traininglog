// This is a minimal service worker that handles basic caching
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Ensure new service worker activates immediately
  event.waitUntil(
    caches.open('v3').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json'
      ]).catch(error => {
        console.error('Cache addAll failed:', error);
        // Continue even if caching fails
        return Promise.resolve();
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  // Take control of all pages immediately
  event.waitUntil(Promise.all([
    clients.claim(),
    // Clear all caches
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    })
  ]));
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If both network and cache fail, return a simple offline page
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            return new Response('', {
              status: 408,
              statusText: 'Request timed out.'
            });
          });
      })
  );
});

// Handle messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
