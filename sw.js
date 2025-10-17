// Service Worker for Partner Report - Caching and Offline Support
const CACHE_NAME = 'partner-report-v1';
const STATIC_CACHE = 'partner-report-static-v1';
const DATA_CACHE = 'partner-report-data-v1';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/data-manager.js',
  '/lazy-loader.js',
  '/virtual-scroll.js',
  '/clients.html',
  '/commissions.html',
  '/country-analysis.html',
  '/database.html',
  '/events.html',
  '/master-partner.html',
  '/client-funnel.html',
  '/tiers-badges.html',
  '/sitemap.html'
];

// Install event - cache static files
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Static files cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Failed to cache static files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DATA_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle data requests (database.json)
  if (url.pathname.endsWith('database.json')) {
    event.respondWith(handleDataRequest(request));
    return;
  }
  
  // Handle static file requests
  if (isStaticFile(request.url)) {
    event.respondWith(handleStaticRequest(request));
    return;
  }
  
  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }
  
  // Default: network first, cache fallback
  event.respondWith(
    fetch(request)
      .then(response => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(STATIC_CACHE)
            .then(cache => cache.put(request, responseClone));
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(request);
      })
  );
});

// Handle data requests with cache-first strategy
async function handleDataRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Check if cache is fresh (less than 5 minutes old)
      const cacheDate = cachedResponse.headers.get('sw-cache-date');
      if (cacheDate) {
        const age = Date.now() - parseInt(cacheDate);
        if (age < 5 * 60 * 1000) { // 5 minutes
          console.log('Serving fresh data from cache');
          return cachedResponse;
        }
      }
    }
    
    // Fetch from network
    console.log('Fetching data from network');
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the response with timestamp
      const responseClone = networkResponse.clone();
      const headers = new Headers(responseClone.headers);
      headers.set('sw-cache-date', Date.now().toString());
      
      const cachedResponse = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: headers
      });
      
      await caches.open(DATA_CACHE).then(cache => {
        cache.put(request, cachedResponse);
      });
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Data request failed:', error);
    
    // Fallback to cache even if stale
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('Serving stale data from cache');
      return cachedResponse;
    }
    
    // Return offline response
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'Data not available offline'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle static file requests with cache-first strategy
async function handleStaticRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fetch from network and cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      await caches.open(STATIC_CACHE).then(cache => {
        cache.put(request, responseClone);
      });
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Static request failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Handle navigation requests
async function handleNavigationRequest(request) {
  try {
    // Try network first for navigation
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      return networkResponse;
    }
  } catch (error) {
    console.log('Navigation request failed, trying cache');
  }
  
  // Fallback to cached version
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Fallback to index.html for SPA behavior
  const indexResponse = await caches.match('/index.html');
  if (indexResponse) {
    return indexResponse;
  }
  
  // Last resort: return offline page
  return new Response(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Offline - Partner Report</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .offline { color: #666; }
      </style>
    </head>
    <body>
      <div class="offline">
        <h1>You're Offline</h1>
        <p>The Partner Report is not available offline.</p>
        <p>Please check your internet connection and try again.</p>
      </div>
    </body>
    </html>
  `, {
    status: 200,
    headers: { 'Content-Type': 'text/html' }
  });
}

// Check if URL is a static file
function isStaticFile(url) {
  const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2'];
  return staticExtensions.some(ext => url.includes(ext));
}

// Background sync for data updates
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    console.log('Performing background sync');
    const response = await fetch('/database.json');
    if (response.ok) {
      const cache = await caches.open(DATA_CACHE);
      await cache.put('/database.json', response);
      console.log('Background sync completed');
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Handle messages from main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_DATA') {
    event.waitUntil(cacheData(event.data.url));
  }
});

async function cacheData(url) {
  try {
    const response = await fetch(url);
    if (response.ok) {
      const cache = await caches.open(DATA_CACHE);
      await cache.put(url, response);
      console.log('Data cached:', url);
    }
  } catch (error) {
    console.error('Failed to cache data:', error);
  }
}
