// This is the service worker for Ansari PWA
// Using Workbox for robust caching and offline capabilities

importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

const CACHE_NAME = 'ansari-v3'; // Bumped version
const OFFLINE_FALLBACK_PAGE = './offline.html';

self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});

// Assets to precache
const PRECACHE_ASSETS = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './data.js',
    './quran.js',
    './manifest.json',
    './app_logo.svg',
    './offline.html'
];

if (workbox) {
    console.log(`Workbox is loaded 🎉`);

    // Standard pre-caching
    self.addEventListener('install', (event) => {
        event.waitUntil(
            caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
        );
        self.skipWaiting();
    });

    self.addEventListener('activate', (event) => {
        event.waitUntil(
            caches.keys().then((keys) => {
                return Promise.all(
                    keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
                );
            })
        );
    });

    // 1. Navigation Route: Network First, fallback to offline.html
    workbox.routing.registerRoute(
        ({ request }) => request.mode === 'navigate',
        new workbox.strategies.NetworkFirst({
            cacheName: 'navigations',
            plugins: [
                {
                    handlerDidError: async () => {
                        return caches.match(OFFLINE_FALLBACK_PAGE);
                    },
                },
            ],
        })
    );

    // 2. CSS, JS, and Workers: Stale While Revalidate
    workbox.routing.registerRoute(
        ({ request }) =>
            request.destination === 'style' ||
            request.destination === 'script' ||
            request.destination === 'worker',
        new workbox.strategies.StaleWhileRevalidate({
            cacheName: 'static-resources',
        })
    );

    // 3. Images: Cache First
    workbox.routing.registerRoute(
        ({ request }) => request.destination === 'image',
        new workbox.strategies.CacheFirst({
            cacheName: 'images',
            plugins: [
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 60,
                    maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
                }),
                new workbox.cacheableResponse.CacheableResponsePlugin({
                    statuses: [0, 200],
                }),
            ],
        })
    );

    // 4. Google Fonts: Cache First
    // Cache the underlying font files with a cache-first strategy for 1 year.
    workbox.routing.registerRoute(
        ({ url }) => url.origin === 'https://fonts.gstatic.com',
        new workbox.strategies.CacheFirst({
            cacheName: 'google-fonts-webfonts',
            plugins: [
                new workbox.cacheableResponse.CacheableResponsePlugin({
                    statuses: [0, 200],
                }),
                new workbox.expiration.ExpirationPlugin({
                    maxAgeSeconds: 60 * 60 * 24 * 365,
                    maxEntries: 30,
                }),
            ],
        })
    );

    // Cache the stylesheets with a stale-while-revalidate strategy.
    workbox.routing.registerRoute(
        ({ url }) => url.origin === 'https://fonts.googleapis.com',
        new workbox.strategies.StaleWhileRevalidate({
            cacheName: 'google-fonts-stylesheets',
        })
    );

} else {
    // Basic Fallback for when workbox fails to load
    self.addEventListener('fetch', (event) => {
        if (event.request.mode === 'navigate') {
            event.respondWith(
                fetch(event.request).catch(() => caches.match(OFFLINE_FALLBACK_PAGE))
            );
        } else {
            event.respondWith(
                caches.match(event.request).then((response) => response || fetch(event.request))
            );
        }
    });
}
