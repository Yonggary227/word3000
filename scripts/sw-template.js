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
      // 예전 버전의 앱 파일만 지운다 (진도를 담은 'word3000-state'는 남긴다)
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('w3000-') && k !== CACHE).map((k) => caches.delete(k))))
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

// ---- 매시간 단어 알림 ----
// 알림 서버(push-worker)는 내용 없이 "종"만 울린다. 여기서 안 외운 단어 하나를 골라 보여준다.
self.addEventListener('push', (event) => {
  event.waitUntil(showWord());
});

async function showWord() {
  // words-mini.json: [id, 영어, 뜻] 목록 (build-web.mjs가 만든다)
  const wordsRes = (await caches.match(BASE + 'words-mini.json')) || (await fetch(BASE + 'words-mini.json'));
  const words = await wordsRes.json();
  let state = { done: [], misses: {} };
  try {
    const saved = await caches.match(BASE + '__state');
    if (saved) state = await saved.json();
  } catch (e) {}

  const done = new Set(state.done || []);
  const misses = state.misses || {};
  let pool = words.filter((w) => !done.has(w[0]));
  if (pool.length === 0) pool = words;

  // 많이 헤맨 단어일수록 더 자주 나오게: 기본 1 + 헤맨 횟수(최대 10)
  const weight = (w) => 1 + Math.min(misses[w[0]] || 0, 10);
  let r = Math.random() * pool.reduce((sum, w) => sum + weight(w), 0);
  let pick = pool[pool.length - 1];
  for (const w of pool) {
    r -= weight(w);
    if (r <= 0) {
      pick = w;
      break;
    }
  }

  await self.registration.showNotification(pick[1], {
    body: pick[2],
    tag: 'w3000-word', // 새 알림이 오면 이전 단어 알림을 바꿔치기해서 쌓이지 않게
    renotify: true,
    icon: BASE + 'icon-192.png',
    data: { id: pick[0] },
  });
}

// 알림을 누르면 그 단어 카드를 연다
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = BASE + '?word=' + event.notification.data.id;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const open = list.find((c) => new URL(c.url).pathname.startsWith(BASE));
      if (open) return open.navigate(url).then((c) => (c || open).focus());
      return self.clients.openWindow(url);
    }),
  );
});
