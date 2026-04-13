// This is a minimal service worker that handles basic caching
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open('v3').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        '/offline.html'
      ]).catch(() => {
        // Silently fail cache operation in development
        return Promise.resolve();
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.filter(name => name !== 'v3')
            .map((cacheName) => caches.delete(cacheName))
        );
      })
    ])
  );
});

self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request).catch(() => new Response('Offline')));
    return;
  }

  // Development mode handling
  const isDev = event.request.url.includes('localhost') || 
                event.request.url.includes('127.0.0.1');
  
  // Skip caching for development URLs and certain patterns
  if (isDev || 
      event.request.url.includes('ws') ||
      event.request.url.includes('hot-update') ||
      event.request.url.includes('firebase') ||
      event.request.url.includes('sockjs-node')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => new Response('Offline'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached response
          return cachedResponse;
        }

        // Try network
        return fetch(event.request)
          .then(response => {
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            
            // Only cache successful responses from production
            if (!isDev) {
              const responseToCache = response.clone();
              caches.open('v3')
                .then(cache => cache.put(event.request, responseToCache))
                .catch(() => {
                  // Silently fail cache operations
                });
            }
            
            return response;
          })
          .catch(() => {
            // For navigation requests, return offline.html
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html')
                .then(response => response || new Response('Offline'));
            }
            
            return new Response('Offline');
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
