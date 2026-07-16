const CACHE_NAME = "soul-kaleidoscope-v2.8.0";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./layout-fix.css",
  "./case-manager.css",
  "./brand-theme.css",
  "./results-ui.css",
  "./assets/cosmic-background.webp",
  "./assets/sacred-geometry.webp",
  "./assets/icons/home.svg",
  "./assets/icons/calculator.svg",
  "./assets/icons/analysis.svg",
  "./assets/icons/cases.svg",
  "./assets/icons/report.svg",
  "./assets/icons/chevron-right.svg",
  "./report.html",
  "./report.css",
  "./report-brand.css",
  "./report-model.js",
  "./report.js",
  "./report-preview.js",
  "./lunar-data.js",
  "./core.js",
  "./profile-model.js",
  "./sngl-data.js",
  "./sngl-report.js",
  "./case-store.js",
  "./case-ui.js",
  "./kaleidoscope-model.js",
  "./results-ui.js",
  "./script.js",
  "./manifest.webmanifest",
  "./icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html")))
  );
});
