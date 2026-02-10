// This is the service worker for Ansari PWA
// Using Workbox for robust caching and offline capabilities

importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

const CACHE_NAME = 'ansari-v2'; // Bumped version
const OFFLINE_FALLBACK_PAGE = './offline.html';

self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});


const ASSETS = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './data.js',
    './quran.js',
    './manifest.json',
    './app_logo.svg',
    OFFLINE_FALLBACK_PAGE
];

if (workbox) {
    console.log(`Workbox is loaded 🎉`);

    // Standard pre-caching
    self.addEventListener('install', (event) => {
        event.waitUntil(
            caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
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

    // Strategy: Network First for navigation, falling back to offline.html
    workbox.routing.registerRoute(
        ({ request }) => request.mode === 'navigate',
        new workbox.strategies.NetworkFirst({
            cacheName: CACHE_NAME,
            plugins: [
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 50,
                }),
            ],
        })
    );

    // Provide a fallback for failed navigations
    const offlineHandler = async (params) => {
        try {
            return await new workbox.strategies.NetworkFirst({
                cacheName: CACHE_NAME
            }).handle(params);
        } catch (error) {
            return caches.match(OFFLINE_FALLBACK_PAGE);
        }
    };

    workbox.routing.setCatchHandler(({ event }) => {
        if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_FALLBACK_PAGE);
        }
        return Response.error();
    });

    // Cache common styles, scripts, and fonts with StaleWhileRevalidate
    workbox.routing.registerRoute(
        ({ request }) => request.destination === 'style' || request.destination === 'script' || request.destination === 'worker',
        new workbox.strategies.StaleWhileRevalidate({
            cacheName: 'static-resources',
        })
    );

    workbox.routing.registerRoute(
        ({ request }) => request.destination === 'image',
        new workbox.strategies.CacheFirst({
            cacheName: 'images',
            plugins: [
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 60,
                    maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
                }),
            ],
        })
    );

} else {
    // Fallback for when workbox fails to load (offline fallback logic)
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
