self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));

      const clientsList = await clients.matchAll({
        includeUncontrolled: true,
        type: 'window',
      });

      for (const client of clientsList) {
        client.navigate(client.url);
      }

      await self.registration.unregister();
    })(),
  );
});

self.addEventListener('fetch', () => {
  return;
});
