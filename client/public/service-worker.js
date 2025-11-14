// Minimal service worker for PWA installation only
// Network-first strategy: always try network, cache only as offline fallback
// Cache name includes timestamp to ensure fresh caches on each deployment
const CACHE_NAME = 'restnvest-minimal-v1-' + Date.now();

// Install event - activate immediately
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker, cache:', CACHE_NAME);
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches and take control immediately
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  event.waitUntil(
    (async () => {
      // Delete all old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
      // Take control of all clients immediately
      await self.clients.claim();
      console.log('[SW] Service worker activated and claimed clients');
    })()
  );
});

// Fetch event - NETWORK FIRST, cache only as fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // NEVER cache API requests - always go to network
  if (url.pathname.startsWith('/api/')) {
    return; // Let browser handle it normally
  }

  // NEVER cache websocket or other non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // For everything else: NETWORK FIRST, cache as fallback
  event.respondWith(
    (async () => {
      try {
        // Always try network first
        const networkResponse = await fetch(request);
        
        // If successful, cache the response for offline fallback
        if (networkResponse && networkResponse.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          // Clone because response can only be used once
          cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
      } catch (error) {
        // Network failed - try cache as fallback
        console.log('[SW] Network failed, trying cache for:', url.pathname);
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
          console.log('[SW] Serving from cache:', url.pathname);
          return cachedResponse;
        }
        
        // No cache available - show error
        console.log('[SW] No cache available for:', url.pathname);
        throw error;
      }
    })()
  );
});
