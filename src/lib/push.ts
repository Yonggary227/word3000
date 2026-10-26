// 웹앱 전용: 매시간 단어 알림 켜기·끄기, 그리고 알림이 고를 단어를 위해 진도를 넘겨두기
import { Platform } from 'react-native';

const WORKER = 'https://word3000-push.yonggal0227.workers.dev';
// push-worker/wrangler.toml의 VAPID_PUBLIC과 같아야 한다
const VAPID_PUBLIC = 'BM0To3rCGYea5fMa0oQq_UJosT3HaFOWaH6WivO-eojs1I3uxlVD6mvQusVxdGbIv3rVEZHv23K9eQogPcL0oEQ';
// 미리 그린 첫 화면(index.html)도 이 값을 읽어 켬/끔을 보여준다
const FLAG_KEY = 'w3000.notify';
// 서비스 워커가 알림 단어를 고를 때 읽는 진도 (sw-template.js와 같은 이름)
const STATE_CACHE = 'word3000-state';
const STATE_URL = '/word3000/__state';

export function pushSupported(): boolean {
  return (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    location.pathname.startsWith('/word3000')
  );
}

function setFlag(on: boolean) {
  try {
    localStorage.setItem(FLAG_KEY, on ? 'on' : 'off');
  } catch {}
}

export async function isPushOn(): Promise<boolean> {
  if (!pushSupported()) return false;
  const reg = await navigator.serviceWorker.getRegistration('/word3000/');
  const sub = await reg?.pushManager.getSubscription();
  const on = !!sub && Notification.permission === 'granted';
  setFlag(on);
  return on;
}

function keyBytes(b64url: string) {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function post(path: string, subscription: PushSubscription) {
  const res = await fetch(WORKER + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription }),
  });
  if (!res.ok) throw new Error(`알림 서버 응답 ${res.status}`);
}

// 켜기: 알림 허용 → 이 기기의 알림 주소 만들기 → 알림 서버에 맡기기 → 시험 알림 1개
export async function turnPushOn(): Promise<void> {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('denied');
  const reg = await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC) }));
  await post('/subscribe', sub);
  setFlag(true);
  await post('/test', sub).catch(() => {});
}

export async function turnPushOff(): Promise<void> {
  const reg = await navigator.serviceWorker.getRegistration('/word3000/');
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    await post('/unsubscribe', sub).catch(() => {});
    await sub.unsubscribe();
  }
  setFlag(false);
}

// 알림은 앱이 꺼져 있을 때 서비스 워커가 고르므로, 외운 단어·헤맨 횟수를 서비스 워커가 읽을 수 있는 곳에 둔다
export function shareStateWithWorker(done: Set<number>, misses: Record<number, number>) {
  if (Platform.OS !== 'web' || typeof caches === 'undefined') return;
  const body = JSON.stringify({ done: [...done], misses });
  caches
    .open(STATE_CACHE)
    .then((c) => c.put(STATE_URL, new Response(body, { headers: { 'Content-Type': 'application/json' } })))
    .catch(() => {});
}
