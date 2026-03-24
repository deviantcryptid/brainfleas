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
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[ServiceWorker] Caching app shell');
                return cache.addAll(FILES_TO_CACHE);
            })
    );
    self.skipWaiting();
});

/* ---------- Activate Event ---------- */
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(keyList.map(key => {
                if (key !== CACHE_NAME) {
                    console.log('[ServiceWorker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    self.clients.claim();
});

/* ---------- Fetch Event ---------- */
self.addEventListener('fetch', event => {
    // Try cache first, then network
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                return response || fetch(event.request);
            })
    );
});
