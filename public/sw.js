const CACHE_NAME = "tetris-v1";

const APP_STATIC_RESOURCES = [
  "/",
  "/index.html",
  "/favicon.ico",
  "/icon.svg",
  "/maskable-icon-512x512.png",
  "/pwa-64x64.png",
  "/pwa-192x192.png",
  "/pwa-512x512.png",
  "/apple-touch-icon-180x180.png",
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

// TODO: sync event https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation#handling_a_sync_event
// TODO: periodic sync event https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation#registering_a_periodic_sync_event

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
  console.log(ev);
  if (ev.request.method !== "GET") return;

  ev.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(ev.request);

      return cachedResponse || fetch(ev.request);
    })()
  );
});
