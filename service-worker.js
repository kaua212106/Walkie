const CACHE = 'talkwave-v3.0.1';
const CORE = [
  './',
  './index.html',
  './manifest.json',
  './icone.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(CORE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);

    try {
      const response = await fetch(event.request);

      if (
        response &&
        response.status === 200 &&
        event.request.url.startsWith(self.location.origin)
      ) {
        cache.put(event.request, response.clone());
      }

      return response;
    } catch (error) {
      const cached = await cache.match(event.request, { ignoreSearch: true });
      if (cached) return cached;

      if (event.request.mode === 'navigate') {
        const index = await cache.match('./index.html');
        if (index) return index;
      }

      return new Response(
        'TalkWave offline. Abra o app ao menos uma vez online para concluir o cache.',
        {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        }
      );
    }
  })());
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      if (list.length) return list[0].focus();
      return clients.openWindow('./index.html');
    })
  );
});
