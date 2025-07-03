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
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  // Skip Firebase-related requests
  if (event.request.url.includes('firestore.googleapis.com') || 
      event.request.url.includes('firebase')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // If we have a cached response, use it but update cache in background
        if (cachedResponse) {
          // Clone the cached response since we'll use it multiple times
          const responseToReturn = cachedResponse.clone();
          
          // Update cache in background
          fetch(event.request)
            .then(response => {
              if (!response.ok) return;
              const responseToCache = response.clone();
              caches.open('v3')
                .then(cache => cache.put(event.request, responseToCache))
                .catch(err => console.warn('Background cache update failed:', err));
            })
            .catch(err => console.warn('Background fetch failed:', err));
          
          return responseToReturn;
        }

        // No cache hit, try network
        return fetch(event.request)
          .then(response => {
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            
            // Clone the response since we'll use it twice
            const responseToReturn = response.clone();
            
            // Cache the response
            caches.open('v3')
              .then(cache => cache.put(event.request, response))
              .catch(err => console.warn('Caching failed:', err));
            
            return responseToReturn;
          })
          .catch(() => {
            // For navigation requests, try to return offline.html
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html')
                .then(response => {
                  if (response) return response;
                  return new Response('Offline - Service Unavailable', {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: { 'Content-Type': 'text/plain' }
                  });
                });
            }
            
            // For other requests, return a simple offline response
            return new Response('Offline - Service Unavailable', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
      .catch(err => {
        console.error('Service Worker fetch handler error:', err);
        return new Response('Service Worker Error', {
          status: 500,
          statusText: 'Internal Server Error',
          headers: { 'Content-Type': 'text/plain' }
        });
      }));
});

// Handle messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
