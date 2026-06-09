// ═══════════════════════════════════════════════════════════════════════════
// SERVICE WORKER — PWA Offline Support & Caching
// Millennium Falcon Command Center
// ═══════════════════════════════════════════════════════════════════════════

const CACHE_NAME = 'mfcc-v1.0.0';
const STATIC_CACHE = 'mfcc-static-v1.0.0';
const DYNAMIC_CACHE = 'mfcc-dynamic-v1.0.0';

// Assets to cache immediately on install
const STATIC_ASSETS = [
  './',
  './index.html',
  './css/main.css',
  './js/app.js',
  './js/pages/dashboard.js',
  './js/pages/tasks.js',
  './js/pages/areas.js',
  './js/pages/buildManual.js',
  './js/pages/setupCommand.js',
  './js/pages/eventDay.js',
  './js/pages/inventory.js',
  './js/pages/budget.js',
  './js/pages/purchases.js',
  './js/pages/stopwatch.js',
  './js/pages/qrCodes.js',
  './js/pages/meetings.js',
  './js/pages/milestones.js',
  './js/pages/risks.js',
  './js/pages/lessons.js',
  './js/pages/knowledge.js',
  './js/pages/reports.js',
  './js/pages/users.js',
  './js/pages/settings.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// External resources to cache
const EXTERNAL_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&family=Rajdhani:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap'
];

// ── INSTALL ───────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  console.log('[SW] Installing MFCC Service Worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static assets');
        // Cache what we can, skip failures
        return Promise.allSettled(
          STATIC_ASSETS.map(url =>
            cache.add(url).catch(err => console.warn('[SW] Failed to cache:', url, err))
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE ──────────────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  console.log('[SW] Activating MFCC Service Worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ── FETCH ─────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip Firebase requests — let them go to network
  if (url.hostname.includes('firebase') ||
      url.hostname.includes('firestore') ||
      url.hostname.includes('googleapis.com') && url.pathname.includes('firestore')) {
    return;
  }

  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') return;

  // QR code API — network only (dynamic)
  if (url.hostname === 'api.qrserver.com') {
    event.respondWith(
      fetch(request).catch(() => new Response('QR unavailable offline', { status: 503 }))
    );
    return;
  }

  // Google Fonts — cache then network
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then(cache =>
        cache.match(request).then(cached => {
          if (cached) return cached;
          return fetch(request).then(response => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          }).catch(() => cached || new Response('Font unavailable', { status: 503 }));
        })
      )
    );
    return;
  }

  // App shell and static assets — cache first, network fallback
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) {
        // Background update for static assets
        const fetchPromise = fetch(request).then(response => {
          if (response && response.ok) {
            caches.open(STATIC_CACHE).then(cache => cache.put(request, response.clone()));
          }
          return response;
        }).catch(() => {});
        return cached;
      }

      // Not in cache — fetch from network
      return fetch(request).then(response => {
        if (!response || !response.ok) return response;

        // Cache successful responses
        const responseClone = response.clone();
        caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, responseClone));
        return response;
      }).catch(() => {
        // Offline fallback for HTML requests
        if (request.headers.get('Accept')?.includes('text/html')) {
          return caches.match('./index.html');
        }
        return new Response('Offline — content not cached', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        });
      });
    })
  );
});

// ── BACKGROUND SYNC ───────────────────────────────────────────────────────
self.addEventListener('sync', event => {
  console.log('[SW] Background sync:', event.tag);
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Firebase handles its own offline sync — this is a placeholder
  console.log('[SW] Data sync triggered');
}

// ── PUSH NOTIFICATIONS ────────────────────────────────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  const options = {
    body: data.body || 'MFCC Notification',
    icon: './icons/icon-192.png',
    badge: './icons/icon-72.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    tag: data.tag || 'mfcc-notification',
    renotify: true
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'MFCC Alert', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      return clients.openWindow(event.notification.data?.url || '/');
    })
  );
});

// ── MESSAGE HANDLER ───────────────────────────────────────────────────────
self.addEventListener('message', event => {
  if (event.data?.action === 'skipWaiting') {
    self.skipWaiting();
  }
  if (event.data?.action === 'clearCache') {
    caches.keys().then(names => Promise.all(names.map(n => caches.delete(n))))
      .then(() => event.source?.postMessage({ action: 'cacheCleared' }));
  }
});
