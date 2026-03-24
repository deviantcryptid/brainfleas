/* ---------- Cache Names ---------- */
const CACHE_NAME = 'brainfleas-cache-v1';

/* ---------- Files to Cache ---------- */
const FILES_TO_CACHE = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    './default-avatar.png'
];

/* ---------- Install Event ---------- */
self.addEventListener('install', event => {
    console.log('[ServiceWorker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[ServiceWorker] Caching app shell...');
                return cache.addAll(FILES_TO_CACHE);
            })
    );
    self.skipWaiting();
});

/* ---------- Activate Event ---------- */
self.addEventListener('activate', event => {
    console.log('[ServiceWorker] Activating...');
    event.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    if (key !== CACHE_NAME) {
                        console.log('[ServiceWorker] Removing old cache:', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

/* ---------- Fetch Event ---------- */
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    // Serve cached version
                    return cachedResponse;
                }
                // Fetch from network if not cached
                return fetch(event.request)
                    .then(networkResponse => {
                        // Optional: cache new requests dynamically if desired
                        return networkResponse;
                    })
                    .catch(() => {
                        // Optional: fallback page or image if fetch fails
                        console.warn('[ServiceWorker] Fetch failed for:', event.request.url);
                    });
            })
    );
});
