/* ============================================================
   Bitcycling — API layer (client)
   ------------------------------------------------------------
   localStorage stays the source of truth for the offline demo.
   When a backend exists, set:  localStorage.setItem('bitcycling.api', '<base-url>')
   and (optionally)           :  localStorage.setItem('bitcycling.token', '<jwt>')
   The app then mirrors state to the server in the background
   (debounced PUT /me/state) and replays queued writes on 'online'.

   Contract: see docs/API.md
   ============================================================ */
const API = (() => {
  const BASE_KEY = 'bitcycling.api';
  const TOKEN_KEY = 'bitcycling.token';
  const QUEUE_KEY = 'bitcycling.queue.v1';

  const base = () => (localStorage.getItem(BASE_KEY) || '').replace(/\/+$/, '');
  const enabled = () => !!base();
  const token = () => localStorage.getItem(TOKEN_KEY) || '';

  async function request(method, path, body) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 8000);
    try {
      const res = await fetch(base() + path, {
        method,
        signal: ctl.signal,
        headers: Object.assign(
          { 'Content-Type': 'application/json' },
          token() ? { Authorization: 'Bearer ' + token() } : {}
        ),
        body: body === undefined ? undefined : JSON.stringify(body)
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const ct = res.headers.get('content-type') || '';
      return ct.includes('application/json') ? res.json() : null;
    } finally { clearTimeout(t); }
  }

  /* ---------- offline write queue ---------- */
  const queue = {
    read() { try { return JSON.parse(localStorage.getItem(QUEUE_KEY)) || []; } catch { return []; } },
    write(list) { try { localStorage.setItem(QUEUE_KEY, JSON.stringify(list.slice(-50))); } catch {} }
  };
  function enqueue(op) {
    if (!enabled()) return;
    const list = queue.read();
    // collapse repeated state writes: keep only the newest snapshot
    const same = list.findIndex(o => o.path === op.path && o.method === op.method);
    if (same >= 0) list.splice(same, 1);
    list.push({ op: op.op, method: op.method, path: op.path, body: op.body, ts: Date.now() });
    queue.write(list);
    flush();
  }
  async function flush() {
    if (!enabled() || !navigator.onLine) return;
    let list = queue.read();
    while (list.length) {
      const op = list[0];
      try { await request(op.method, op.path, op.body); }
      catch { break; }                       // still offline / server down: keep order
      list.shift(); queue.write(list);
    }
  }

  /* ---------- state mirroring (thin ledger client) ---------- */
  let timer = null;
  function sync(state) {
    if (!enabled()) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      // never ship demo identities to a real server by accident
      const body = Object.assign({}, state);
      if (body.user && body.user.email === 'alex@bitcycling.app') body.user = null;
      enqueue({ op: 'state', method: 'PUT', path: '/me/state', body: { rev: Date.now(), state: body } });
    }, 2500);
  }
  async function pull() {
    if (!enabled()) return null;
    try {
      const res = await request('GET', '/me/state');
      return res && res.state ? res.state : null;
    } catch { return null; }
  }

  /* ---------- endpoints ---------- */
  return {
    enabled, base, token,
    setEndpoint(url) {
      if (url) localStorage.setItem(BASE_KEY, url.replace(/\/+$/, ''));
      else localStorage.removeItem(BASE_KEY);
    },
    setToken(t) { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); },
    request, enqueue, flush, sync, pull,
    /* one call per domain event — backend records the ledger server-side */
    track(name, payload) {
      if (!enabled()) return;
      enqueue({ op: 'event', method: 'POST', path: '/events', body: { name: name, payload: payload || {}, ts: Date.now() } });
    },
    ping() { return enabled() ? request('GET', '/health').catch(() => null) : Promise.resolve(null); }
  };
})();

/* replay queued writes when connectivity returns */
window.addEventListener('online', () => API.flush());
