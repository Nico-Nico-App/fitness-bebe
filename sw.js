/* Service worker : usage hors ligne.
   Pense à changer CACHE_VERSION à chaque mise à jour de l'app,
   pour que les téléphones récupèrent les nouveaux fichiers. */
const CACHE_VERSION = "v1";
const CACHE_NAME = "fitness-tracker-" + CACHE_VERSION;

const LOCAL_FILES = [
  "./",
  "index.html",
  "manifest.json",
  "css/style.css",
  "js/storage.js",
  "js/weights.js",
  "js/goals.js",
  "js/measurements.js",
  "js/workouts.js",
  "js/profile.js",
  "js/steps.js",
  "js/meals.js",
  "js/dashboard-charts.js",
  "js/export.js",
  "js/app.js",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png"
];

const CDN_FILES = [
  "https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      await cache.addAll(LOCAL_FILES);
      /* Les CDN sont ajoutés un par un : un échec ne bloque pas l'installation */
      await Promise.all(
        CDN_FILES.map(url =>
          fetch(url, { mode: "no-cors" })
            .then(response => cache.put(url, response))
            .catch(() => {})
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key.startsWith("fitness-tracker-") && key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;
  const isFont =
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com";
  const isCdn = CDN_FILES.includes(request.url);

  /* Fichiers de l'app : réseau d'abord (nouvelle version si en ligne), cache sinon */
  if (sameOrigin) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          caches.match(request, { ignoreSearch: true }).then(cached =>
            cached || (request.mode === "navigate" ? caches.match("index.html") : undefined)
          )
        )
    );
    return;
  }

  /* Bibliothèques et polices : cache d'abord */
  if (isCdn || isFont) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;

        return fetch(request).then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        });
      })
    );
  }
});
