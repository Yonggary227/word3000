// 오프라인용 서비스 워커. build-web.mjs가 VERSION과 FILES를 채워 dist/sw.js로 만든다.
const VERSION = '__VERSION__';
const FILES = __FILES__;
const BASE = '/word3000/';
const CACHE = 'w3000-' + VERSION;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(FILES.map((f) => BASE + f)))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  // 화면 이동(/word3000/study 등)은 모두 같은 index.html로 연다
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match(BASE + 'index.html').then((cached) => cached || fetch(req)),
    );
    return;
  }

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cached) => cached || fetch(req)),
  );
});
