// This is a minimal service worker that handles basic caching
const CACHE_NAME = 'v4';
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './offline.html'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {
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
          cacheNames.filter(name => name !== CACHE_NAME)
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
  const requestUrl = new URL(event.request.url);
  const isAppShellRequest =
    event.request.mode === 'navigate' ||
    requestUrl.pathname.endsWith('/index.html') ||
    requestUrl.pathname.endsWith('/manifest.json');
  
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

  if (isAppShellRequest) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, responseToCache))
            .catch(() => {
              // Silently fail cache operations
            });

          return response;
        })
        .catch(() => {
          return caches.match(event.request)
            .then(response => response || caches.match('./index.html'))
            .then(response => response || new Response('Offline'));
        })
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
              caches.open(CACHE_NAME)
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
              return caches.match('./offline.html')
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
