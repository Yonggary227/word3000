// 단어 3000 알림 서버 (Cloudflare Worker)
// - POST /subscribe   : 휴대폰 웹앱이 알림 받을 주소(구독 정보)를 맡긴다
// - POST /unsubscribe : 알림 끄기
// - 매시간(9시~22시, 한국 시간) 맡겨둔 주소로 "종"을 울린다. 내용 없는 알림이라
//   휴대폰의 웹앱(서비스 워커)이 깨어나 직접 단어를 골라 보여준다.

const ALLOWED_ORIGIN = 'https://yonggary227.github.io';
const MAX_SUBSCRIPTIONS = 20;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors() });
    if (request.method !== 'POST') return json({ ok: true, service: 'word3000-push' });
    if (request.headers.get('Origin') !== ALLOWED_ORIGIN) return json({ error: 'forbidden origin' }, 403);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'bad json' }, 400);
    }
    const sub = body?.subscription;
    if (!sub || typeof sub.endpoint !== 'string' || !sub.endpoint.startsWith('https://')) {
      return json({ error: 'bad subscription' }, 400);
    }
    const key = await keyFor(sub.endpoint);

    if (url.pathname === '/subscribe') {
      const list = await env.SUBS.list({ limit: MAX_SUBSCRIPTIONS + 1 });
      const exists = list.keys.some((k) => k.name === key);
      if (!exists && list.keys.length >= MAX_SUBSCRIPTIONS) return json({ error: 'too many subscriptions' }, 429);
      await env.SUBS.put(key, JSON.stringify({ endpoint: sub.endpoint }));
      return json({ ok: true });
    }
    if (url.pathname === '/unsubscribe') {
      await env.SUBS.delete(key);
      return json({ ok: true });
    }
    // 시험용: 지금 바로 이 기기에 한 번 울린다
    if (url.pathname === '/test') {
      const status = await sendPush(sub.endpoint, env);
      return json({ ok: status < 300, status });
    }
    return json({ error: 'not found' }, 404);
  },

  async scheduled(_event, env) {
    const list = await env.SUBS.list();
    await Promise.all(
      list.keys.map(async ({ name }) => {
        const saved = await env.SUBS.get(name, 'json');
        if (!saved) return;
        const status = await sendPush(saved.endpoint, env);
        // 404·410: 휴대폰 쪽에서 알림을 끄거나 앱을 지운 경우라 목록에서 뺀다
        if (status === 404 || status === 410) await env.SUBS.delete(name);
      }),
    );
  },
};

// 내용 없는 Web Push 보내기 (VAPID 서명만 필요하고 암호화는 필요 없다)
async function sendPush(endpoint, env) {
  const aud = new URL(endpoint).origin;
  const jwt = await vapidJwt(aud, env);
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `vapid t=${jwt}, k=${env.VAPID_PUBLIC}`,
      TTL: '1800',
      Urgency: 'normal',
      'Content-Length': '0',
    },
  });
  return res.status;
}

async function vapidJwt(aud, env) {
  const enc = (obj) => b64url(new TextEncoder().encode(JSON.stringify(obj)));
  const header = enc({ typ: 'JWT', alg: 'ES256' });
  const payload = enc({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: env.VAPID_SUBJECT });
  const key = await crypto.subtle.importKey(
    'jwk',
    JSON.parse(env.VAPID_PRIVATE_JWK),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );
  const data = new TextEncoder().encode(`${header}.${payload}`);
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, data);
  return `${header}.${payload}.${b64url(new Uint8Array(sig))}`;
}

function b64url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function keyFor(endpoint) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint));
  return b64url(new Uint8Array(hash));
}

function cors() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...cors() } });
}
