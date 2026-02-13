self.addEventListener('install', (event) => {
    console.log('Service Worker: Installed');
});

self.addEventListener('fetch', (event) => {
    // Basic pass-through for now to satisfy PWA requirements
    event.respondWith(fetch(event.request));
});
