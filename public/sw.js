// ─── Cache versioning — bump this whenever assets change ───────────────────────
const CACHE_VERSION = 'v2';
const STATIC_CACHE  = `money-mgr-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `money-mgr-dynamic-${CACHE_VERSION}`;

// Shell assets to pre-cache on install
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './offline.html',
  './manifest.json',
  './icon.png',
  './icon-192.png',
];

// ─── Install: cache shell ───────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(PRECACHE_ASSETS).catch(() => {
        // Some assets may not exist yet (e.g. icon-192.png), don't fail hard
      })
    )
  );
  self.skipWaiting(); // Activate new SW immediately
});

// ─── Activate: purge stale caches ──────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const validCaches = [STATIC_CACHE, DYNAMIC_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !validCaches.includes(key))
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch: Cache-first for static, Network-first for navigation ───────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests from same origin
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) {
    return;
  }

  const url = new URL(request.url);

  // Navigation requests → network first, fallback to cached index, then offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
          return res;
        })
        .catch(() =>
          caches.match('./index.html')
            .then((cached) => cached || caches.match('./offline.html'))
        )
    );
    return;
  }

  // JS/CSS assets with hashed names → cache-first (they never change)
  if (url.pathname.startsWith('/assets/') || url.pathname.match(/\.(js|css|woff2?)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          const clone = res.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          return res;
        });
      })
    );
    return;
  }

  // Everything else → stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((res) => {
          if (res.status === 200) {
            const clone = res.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return res;
        })
        .catch(() => cached); // Return cached if network fails

      return cached || networkFetch;
    })
  );
});

// ─── Message: Force skip waiting from app ──────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
