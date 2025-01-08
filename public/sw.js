const CACHE_NAME = "tetris-v1";

const APP_STATIC_RESOURCES = [
  /* <INJECTED> */
];

self.addEventListener("install", (ev) => {
  ev.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      await cache.addAll(APP_STATIC_RESOURCES);
    })()
  );
});

self.addEventListener("activate", (ev) => {
  ev.waitUntil(
    (async () => {
      const names = await caches.keys();

      await Promise.all(
        names.map((name) => {
          return name !== CACHE_NAME ? caches.delete(name) : Promise.resolve();
        })
      );

      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (ev) => {
  if (ev.request.method !== "GET") return;

  ev.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(ev.request);

      return cachedResponse || fetch(ev.request);
    })()
  );
});
