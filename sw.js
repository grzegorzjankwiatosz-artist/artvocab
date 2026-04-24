const CACHE_NAME = 'artvocab-v2';

// instalacja
self.addEventListener('install', event => {
  self.skipWaiting(); // od razu aktywuj nową wersję
});

// aktywacja
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// fetch
self.addEventListener('fetch', event => {
  const req = event.request;

  // HTML → network first (zawsze świeże)
  if (req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(req));
    return;
  }

  // reszta → cache first
  event.respondWith(cacheFirst(req));
});

// NETWORK FIRST (dla HTML)
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const fresh = await fetch(request);
    cache.put(request, fresh.clone());
    return fresh;
  } catch {
    const cached = await cache.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

// CACHE FIRST (dla plików)
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  const fresh = await fetch(request);
  cache.put(request, fresh.clone());
  return fresh;
}

// komunikacja z aplikacją
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
