/* ============================================================
   Bitcycling — app logic (PWA prototype)
   ride / earn · GPS · BTCYC · market · events
   ============================================================ */
(() => {
'use strict';

/* ---------- helpers ---------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const KEY = 'bitcycling.v1';
const BTCYC_EUR = 0.8;
const LIMIT_SPEED = 40;
const DAILY_KM = 100;
const KM_PER_BTCYC = 20;

const nf = (n, d = 2) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const money = n => `${nf(n * BTCYC_EUR)} €`;
const pad = n => String(n).padStart(2, '0');
const fmtTime = s => {
  s = Math.max(0, Math.round(s));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`;
};
const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const ago = ts => {
  const d = Date.now() - ts, h = d / 36e5;
  if (h < 1) return `${Math.max(1, Math.round(d / 6e4))} min ago`;
  if (h < 24) return `${Math.round(h)} hour${Math.round(h) === 1 ? '' : 's'} ago`;
  const days = Math.round(h / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
};
const initials = (a = '', b = '') => ((a[0] || 'B') + (b[0] || '')).toUpperCase();

/* ---------- SVG icon set (Lucide-style, 24×24, stroke) ---------- */
const ICONS = {
  bike: '<circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>',
  bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  ticket: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><path d="M13 5v2M13 11v2M13 17v2"/>',
  smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01M15 9h.01"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M6 15h4"/>',
  phone: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
  laptop: '<path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9"/><path d="M2 16h20l-1 2.5a1 1 0 0 1-.9.5H3.9a1 1 0 0 1-.9-.5z"/>',
  wallet: '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M9.5 8h4a2 2 0 0 1 0 4h-4h4a2 2 0 0 1 0 4h-4"/><path d="M11.5 6v11M14 6v1.5M14 16.5V18"/>',
  chart: '<path d="M3 3v17h18"/><path d="M7 16v-4M12 16V7M17 16v-6"/>',
  timer: '<path d="M10 2h4"/><path d="M12 14v-4"/><circle cx="12" cy="14" r="8"/>',
  medal: '<path d="M7.2 15 2.7 7.1a2 2 0 0 1 .1-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.1a2 2 0 0 1 .1 2.2L16.8 15"/><path d="m11 12 4.5-3.8"/><circle cx="12" cy="14.5" r="5.5"/>',
  qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14h1M14 20h3M20 17v4"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.6V17c0 .6-.5 1-1 1.2C7.9 18.8 7 20.2 7 22"/><path d="M14 14.6V17c0 .6.5 1 1 1.2 1.1.5 2 2 2 3.8"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  store: '<path d="M4 4h16l1 5a3 3 0 0 1-5.3 2.6A3 3 0 0 1 12 12a3 3 0 0 1-3.7-.4A3 3 0 0 1 3 9z"/><path d="M5 12v8h14v-8"/><path d="M9 20v-5h4v5"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
  megaphone: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  ban: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9l-3.8 3.8z"/>',
  glasses: '<circle cx="6" cy="14" r="4"/><circle cx="18" cy="14" r="4"/><path d="M10 14a2 2 0 0 1 4 0"/><path d="M2.5 9 5 4h14l2.5 5"/>',
  shirt: '<path d="M20.4 3.5 16 2a4 4 0 0 1-8 0L3.6 3.5a2 2 0 0 0-1.3 2.2l.6 3.5a1 1 0 0 0 1 .8H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.1a1 1 0 0 0 1-.8l.6-3.5a2 2 0 0 0-1.3-2.2z"/>',
  hand: '<path d="M18 11V6a2 2 0 0 0-4 0"/><path d="M14 10V4a2 2 0 0 0-4 0v2"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.3l-3.6-3.6a2 2 0 0 1 2.8-2.8L7 15"/>',
  wheel: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v6M12 15v6M3 12h6M15 12h6M5.6 5.6l4.3 4.3M14.1 14.1l4.3 4.3M18.4 5.6l-4.3 4.3M9.9 14.1l-4.3 4.3"/>',
  bottle: '<path d="M8 2h8v3l1 3v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V8l1-3z"/><path d="M7 12h10"/><path d="M8 5h8"/>',
  zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  package: '<path d="M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/><path d="m7.5 4.3 9 5.1"/>',
  light: '<path d="M18 6c0 2-2 2-2 4v10a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V10c0-2-2-2-2-4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z"/><path d="M6 6h12"/><path d="M12 12h.01"/>',
  navigation: '<polygon points="3 11 22 2 13 21 11 13 3 11"/>',
  helmet: '<path d="M3 17v-2a9 9 0 0 1 18 0v2"/><path d="M2 17h20v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z"/><path d="M12 6.5V3"/><path d="M8 8.5 12 5l4 3.5"/>',
  crown: '<path d="m2 6 4.5 4.5L12 4l5.5 6.5L22 6l-2 12H4L2 6z"/><path d="M4 20h16"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5C2 10.8 3.5 12.5 5 14l7 7z"/>',
  share: '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="m16 6-4-4-4 4"/><path d="M12 2v13"/>',
  arrowDownLeft: '<path d="M17 7 7 17"/><path d="M17 17H7V7"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 5.5 12 8c0-2.5 2-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  bellOff: '<path d="M8.7 3A6 6 0 0 1 18 8c0 2.4.4 4.3.9 5.6"/><path d="M17 17H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/><path d="m2 2 20 20"/>',
  compass: '<circle cx="12" cy="12" r="10"/><polygon points="16.2 7.8 14.1 14.1 7.8 16.2 9.9 9.9 16.2 7.8"/>',
  notebook: '<path d="M2 6h4M2 10h4M2 14h4M2 18h4"/><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M15 2v20"/><path d="M18 7h1M18 12h1M18 17h1"/>',
  map: '<polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21 3 6"/><path d="M9 3v15M15 6v15"/>',
  mountain: '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  money: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>'
};
/* icon counterpart of emojis stored in old records (backward compatibility) */
const EMOJI_ICONS = {
  '⛑️': 'helmet', '⛑': 'helmet', '🔒': 'lock', '🔧': 'wrench', '🕶️': 'glasses', '🕶': 'glasses',
  '🧥': 'shirt', '🧤': 'hand', '👕': 'shirt', '🚲': 'bike', '🚴': 'bike', '🚴‍♀️': 'bike', '🛞': 'wheel',
  '🥤': 'bottle', '🍫': 'zap', '🥛': 'package', '🔦': 'light', '📟': 'navigation', '📱': 'phone',
  '💻': 'laptop', '🔔': 'bell', '🔕': 'bellOff', '⛔': 'ban', '🏅': 'medal', '🎁': 'gift',
  '🎯': 'target', '🛣️': 'route', '🛣': 'route', '🏔️': 'mountain', '🏔': 'mountain', '🌍': 'globe',
  '🪙': 'coin', '💰': 'money', '🔳': 'qr', '🔥': 'flame', '🏁': 'flag', '🤝': 'users',
  '🗺️': 'map', '🗺': 'map', '🧭': 'compass', '🗒️': 'notebook', '🗒': 'notebook', '💬': 'chat',
  '♥': 'heart', '♥️': 'heart', '↗': 'share', '↗️': 'share', '↙️': 'arrowDownLeft', '↙': 'arrowDownLeft',
  '👑': 'crown', '🥇': 'trophy', '🥈': 'medal', '🥉': 'medal', '🏆': 'trophy', '🏬': 'store',
  '📷': 'camera', '📣': 'megaphone', '🔐': 'lock', '🛡️': 'shield', '🛡': 'shield', '🅿️': 'wallet',
  '💳': 'card'
};
/* icon generator: if the name is unknown the text itself is returned (works with old emoji data) */
const ico = (name, cls = '') => {
  if (name == null) return '';
  const key = ICONS[name] ? name : EMOJI_ICONS[String(name).replace(/\uFE0F/g, '')];
  const p = key && ICONS[key];
  if (!p) return String(name);
  return `<svg class="ico${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
};
/* fills the data-ico slots in static HTML once */
function hydrateIcons(root) {
  (root || document).querySelectorAll('[data-ico]:not([data-ico-done])').forEach(el => {
    el.dataset.icoDone = '1';
    el.insertAdjacentHTML('afterbegin', ico(el.dataset.ico));
  });
}

/* ---------- theme ---------- */
const sysTheme = () => (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
function applyTheme() {
  const t = (S.settings && S.settings.theme) || sysTheme();
  document.documentElement.dataset.theme = t;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = t === 'dark' ? '#0B1412' : '#059669';
  const themeSlot = $('#themeIco');
  if (themeSlot) themeSlot.innerHTML = ico(t === 'dark' ? 'sun' : 'moon');
  $$('#themeSeg button').forEach(b => b.classList.toggle('is-on', b.dataset.themeSet === t));
  retileMap(t);
}
function setTheme(t) {
  S.settings.theme = t; save(); applyTheme();
}

/* ---------- in-page counter animation ---------- */
function setNum(el, val, fmt = v => nf(v)) {
  if (!el) return;
  const to = Number(val);
  const from = Number(el.dataset.n ?? to);
  el.dataset.n = to;
  if (Math.abs(to - from) < 0.005) { el.textContent = fmt(to); return; }
  const t0 = performance.now(), dur = 650;
  const step = t => {
    const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt(from + (to - from) * e);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const pulse = el => { if (!el) return; el.classList.remove('is-pulse'); void el.offsetWidth; el.classList.add('is-pulse'); };

/* ---------- empty state illustration ---------- */
const emptyIll = (e, t, h) => `<div class="empty-ill"><span>${ico(e)}</span><b>${t}</b><small>${h}</small></div>`;

/* ---------- state ---------- */
const defaults = () => ({
  user: null,
  balance: 0, earned: 0, spent: 0,
  todayKm: 0, todayEligibleKm: 0, creditedToday: 0, todayEarn: 0, todayQr: 0,
  totalKm: 0, totalMinutes: 0, qrCount: 0,
  ride: { km: 0, eligible: 0, seconds: 0, over: false, episode: false, source: 'sim', mult: 1, points: [], accM: 0, heading: null },
  ledger: [], orders: [], rides: [], violations: [],
  rideActive: false,
  walletId: null,
  festJoined: false, shared: false, strikesWarned: false,
  settings: { notify: true, dataShare: false, twoFA: true, theme: 'light' },
  lastDay: dayKey(),
  /* v2 fields */
  likes: {}, comments: {}, friends: [], badges: [], notifs: [],
  streak: 1, rideDays: [], invited: false, suspended: false,
  transferredToday: 0, lastTransferDay: dayKey(),
  inviteCode: null, sessions: null,
  /* quests & levels */
  questsDone: {}, todaySocial: 0
});

let S = load();

/* ---------- wallet ---------- */
function makeWalletId() {
  const p = () => Math.random().toString(16).slice(2, 6).toUpperCase().padEnd(4, '7');
  return `BCYC-${p()}-${p()}`;
}
function ensureWallet() {
  if (!S.walletId) { S.walletId = makeWalletId(); save(); }
  return S.walletId;
}

/* sample wallets in the address book (demo data) */
const CONTACTS = [
  { name: 'Ella Kara',     handle: '@ellak',  id: 'BCYC-7A21-9F04', c: '#059669' },
  { name: 'Max Reed',    handle: '@maxr', id: 'BCYC-3C88-1B57', c: '#2563EB' },
  { name: 'Sara Demir',   handle: '@sarad', id: 'BCYC-9E40-6D12', c: '#DB2777' },
  { name: 'Chris West',    handle: '@chrisw',  id: 'BCYC-5B73-4A29', c: '#D97706' },
  { name: 'Zoe Arda',   handle: '@zoea',id: 'BCYC-2D96-8C31', c: '#7C3AED' },
  { name: 'Kevin Grant',  handle: '@keving', id: 'BCYC-6F15-7E64', c: '#0891B2' }
];
const contactByName = n => CONTACTS.find(c => c.name === n);

function defaultSessions() {
  const now = Date.now();
  return [
    { id: 's1', dev: 'This device · Browser', loc: 'Istanbul', ts: now - 12e4, current: true },
    { id: 's2', dev: 'Windows · Chrome', loc: 'Izmir', ts: now - 5 * 36e5, current: false },
    { id: 's3', dev: 'Android · Chrome', loc: 'Ankara', ts: now - 3 * 864e5, current: false }
  ];
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    const st = Object.assign(defaults(), JSON.parse(raw));
    st.ride = Object.assign(defaults().ride, st.ride || {});
    st.settings = Object.assign(defaults().settings, st.settings || {});
    st.rideActive = false;                 // pause the ride on reopen
    if (st.user && !st.walletId) st.walletId = makeWalletId();
    if (st.lastDay !== dayKey()) {          // reset the daily counters
      st.lastDay = dayKey();
      st.todayKm = 0; st.todayEligibleKm = 0; st.creditedToday = 0; st.todayEarn = 0; st.todayQr = 0;
      st.todaySocial = 0;
      st.violations = []; st.strikesWarned = false;
    }
    if (st.lastTransferDay !== dayKey()) { st.lastTransferDay = dayKey(); st.transferredToday = 0; }
    if (!st.sessions) st.sessions = defaultSessions();
    if (st.violations && st.violations.length >= 3) st.suspended = true;
    return st;
  } catch { return defaults(); }
}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };

/* ---------- data ---------- */
const PRODUCTS = [
  { id: 'p1', name: 'Vento Aero Racing Helmet', store: 'Vento Helmets', cat: 'accessories', btc: 14, icon: 'helmet', stock: 12, ship: '2–4 days' },
  { id: 'p2', name: 'Titanium Lock 90cm', store: 'LockForge', cat: 'accessories', btc: 8, icon: 'lock', stock: 40, ship: '1–3 days' },
  { id: 'p3', name: 'Mini Air Pump', store: 'TrailWorks', cat: 'accessories', btc: 6, icon: 'wrench', stock: 25, ship: '1–3 days' },
  { id: 'p4', name: 'Aero Sports Sunglasses', store: 'Vento Helmets', cat: 'accessories', btc: 11, icon: 'glasses', stock: 18, ship: '2–4 days' },
  { id: 'p5', name: 'Windproof Jacket', store: 'PedalWear', cat: 'apparel', btc: 22, icon: 'shirt', stock: 9, ship: '3–5 days' },
  { id: 'p6', name: 'Gel-Pad Cycling Gloves', store: 'PedalWear', cat: 'apparel', btc: 7, icon: 'hand', stock: 33, ship: '1–3 days' },
  { id: 'p7', name: 'Breathable Cycling Jersey', store: 'PedalWear', cat: 'apparel', btc: 9, icon: 'shirt', stock: 27, ship: '2–4 days' },
  { id: 'p8', name: 'Electric City Bike', store: 'NovaCycle', cat: 'bike', btc: 480, icon: 'bike', stock: 3, ship: '5–8 days' },
  { id: 'p9', name: 'Carbon Road Bike', store: 'NovaCycle', cat: 'bike', btc: 320, icon: 'bike', stock: 5, ship: '5–8 days' },
  { id: 'p10', name: 'Disc Wheelset', store: 'TrailWorks', cat: 'bike', btc: 95, icon: 'wheel', stock: 11, ship: '3–5 days' },
  { id: 'p11', name: 'Electrolyte Water Bottle', store: 'FuelLab', cat: 'nutrition', btc: 5, icon: 'bottle', stock: 60, ship: '1–2 days' },
  { id: 'p12', name: 'Energy Gel · 12-pack', store: 'FuelLab', cat: 'nutrition', btc: 6, icon: 'zap', stock: 48, ship: '1–2 days' },
  { id: 'p13', name: 'Whey Protein 1kg', store: 'FuelLab', cat: 'nutrition', btc: 18, icon: 'package', stock: 15, ship: '2–3 days' },
  { id: 'p14', name: 'Front+Rear Light Set', store: 'LumenRide', cat: 'technology', btc: 9, icon: 'light', stock: 36, ship: '1–3 days' },
  { id: 'p15', name: 'GPS Bike Computer', store: 'LumenRide', cat: 'technology', btc: 38, icon: 'navigation', stock: 7, ship: '2–4 days' },
  { id: 'p16', name: 'Charging Phone Mount', store: 'LumenRide', cat: 'technology', btc: 5, icon: 'phone', stock: 52, ship: '1–3 days' }
];

const BOARD = [
  { n: 'Ella Kara', km: 312.4, c: '#059669' },
  { n: 'Max Reed', km: 288.1, c: '#2563EB' },
  { n: 'Sara Demir', km: 245.9, c: '#DB2777' },
  { n: 'Chris West', km: 210.2, c: '#D97706' },
  { n: 'Zoe Arda', km: 176.5, c: '#7C3AED' },
  { n: 'Bruno Stone', km: 142.8, c: '#0891B2' },
  { n: 'Amy Turan', km: 118.3, c: '#EA580C' },
  { n: 'Kevin Grant', km: 96.7, c: '#16A34A' },
  { n: 'Dana Cruz', km: 78.4, c: '#4F46E5' },
  { n: 'Eva Polat', km: 64.1, c: '#BE185D' }
];

const FEED = [
  { n: 'Ella Kara', h: '2 hours ago', c: '#059669', t: 'Rode 24 km on the Downtown–Harbor line today. 1 BTCYC hit my account — my goal is to fill today’s 100 km limit! 🚴‍♀️', l: 42, cm: 8 },
  { n: 'Max Reed', h: '5 hours ago', c: '#2563EB', t: 'Bike Fest registration done ✅ 42 km on the Riverside route, prize pool 15 BTCYC. Everyone riding the route, see you there.', l: 76, cm: 21 },
  { n: 'Sara Demir', h: 'yesterday', c: '#DB2777', t: 'Scanned the QR board at the Waterfront, got a 3 BTCYC bonus and traded for my helmet in the market. The system really works. ⛑️', l: 118, cm: 34 }
];

/* ---------- toast ---------- */
function toast(msg, kind = '') {
  const t = document.createElement('div');
  t.className = `toast ${kind}`;
  t.textContent = msg;
  $('#toastRoot').appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 320); }, 2600);
}
function confetti(n = 26) {
  const colors = ['#10B981', '#F59E0B', '#2563EB', '#EC4899', '#34D399'];
  for (let i = 0; i < n; i++) {
    const c = document.createElement('i');
    c.className = 'confetti';
    c.style.left = Math.random() * 100 + '%';
    c.style.background = colors[i % colors.length];
    c.style.animationDuration = (1.6 + Math.random() * 1.4) + 's';
    c.style.animationDelay = (Math.random() * .4) + 's';
    $('#phone').appendChild(c);
    setTimeout(() => c.remove(), 3400);
  }
}

/* ---------- notification center ---------- */
function notify(text, icon = 'bell') {
  S.notifs.unshift({ id: Date.now() + Math.random(), ts: Date.now(), text, icon, read: false });
  if (S.notifs.length > 30) S.notifs.length = 30;
  save(); renderNotifDot();
}
function renderNotifDot() {
  const unread = (S.notifs || []).filter(n => !n.read).length;
  const dot = $('#notifDot'); if (dot) dot.style.display = unread ? '' : 'none';
}
function openNotifs() {
  if (!S.notifs.length) {
    openModal(`<h3>Notifications</h3><p class="lead">Earnings, transfers and security alerts are collected here.</p>
      ${emptyIll('bellOff', 'No notifications yet', 'Go for a ride, scan a QR code or send a transfer — news lands here.')}`);
    return;
  }
  S.notifs.forEach(n => n.read = true); save(); renderNotifDot();
  openModal(`
    <h3>Notifications</h3>
    <p class="lead">${S.notifs.length} notifications · only counted as read when you open them.</p>
    <div class="list-card">
      ${S.notifs.map(n => `
        <div class="notif-row">
          <span class="list-ico ${n.icon === 'ban' ? 'red' : n.icon === 'medal' || n.icon === 'gift' ? 'gold' : 'green'}">${ico(n.icon)}</span>
          <div class="list-body"><b>${n.text}</b><small>${ago(n.ts)}</small></div>
        </div>`).join('')}
    </div>
    <button class="btn btn-soft btn-lg" data-modal-close style="width:100%;margin-top:14px">Close</button>`);
}

/* ---------- badges ---------- */
const BADGES = [
  { id: 'first',   ico: 'bike',     n: 'First pedal',   d: 'Finish your first ride',        ok: () => S.rides.length >= 1 },
  { id: 'km50',    ico: 'route',    n: '50 km',       d: '50 km pedaled in total',       ok: () => S.totalKm >= 50 },
  { id: 'km250',   ico: 'mountain', n: '250 km',      d: '250 km in total',            ok: () => S.totalKm >= 250 },
  { id: 'km1000',  ico: 'globe',    n: '1,000 km',    d: 'Legendary distance',            ok: () => S.totalKm >= 1000 },
  { id: 'earn1',   ico: 'coin',     n: 'First BTCYC',   d: 'Your first earning',             ok: () => S.earned >= 1 },
  { id: 'earn25',  ico: 'money',    n: '25 BTCYC',    d: 'Fill your wallet',           ok: () => S.earned >= 25 },
  { id: 'qr10',    ico: 'qr',       n: 'QR hunter',   d: 'Scan 10 codes',              ok: () => S.qrCount >= 10 },
  { id: 'streak7', ico: 'flame',    n: '7-day streak',  d: 'Ride 7 days in a row',       ok: () => (S.streak || 0) >= 7 },
  { id: 'fest',    ico: 'flag',     n: 'Bike Fest',   d: 'Register for the Fest',     ok: () => !!S.festJoined },
  { id: 'social',  ico: 'users',    n: 'Social',      d: 'Add a friend',         ok: () => (S.friends || []).length >= 1 },
  { id: 'quest5',  ico: 'target',   n: 'Quester',     d: 'Complete 5 quests',          ok: () => Object.keys(S.questsDone || {}).length >= 5 }
];
function checkBadges(silent) {
  let fresh = false;
  BADGES.forEach(b => {
    if (S.badges.includes(b.id)) return;
    if (!b.ok()) return;
    S.badges.push(b.id); fresh = true;
    if (!silent) {
      confetti(16);
      toast(`New badge: ${b.n}`, 'good');
      notify(`You earned a badge: ${b.n}`, 'medal');
    }
  });
  if (fresh) save();
  return fresh;
}

/* ---------- quests & levels (XP) ---------- */
const weekKey = (d = new Date()) => {
  const x = new Date(d); x.setHours(12, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));   // Monday of the week
  return dayKey(x);
};
const questKey = q => q.id + '|' + (q.type === 'daily' ? dayKey() : weekKey());
const questClaimed = q => !!(S.questsDone || {})[questKey(q)];

const QUESTS = [
  { id: 'd_km',   ico: 'bike',   t: 'Pedal 10 km',  sub: 'Daily quest',  type: 'daily',  target: 10,  unit: 'km',     reward: 0.5, prog: () => S.todayKm },
  { id: 'd_qr',   ico: 'qr',     t: 'Scan 1 QR code',     sub: 'Daily quest',  type: 'daily',  target: 1,   unit: 'code',    reward: 0.3, prog: () => S.todayQr },
  { id: 'd_soc',  ico: 'chat',   t: 'Interact in the feed', sub: 'Daily quest', type: 'daily',  target: 1,   unit: 'interaction', reward: 0.2, prog: () => S.todaySocial || 0 },
  { id: 'w_km',   ico: 'route',  t: 'Ride 50 km',           sub: 'Weekly quest', type: 'weekly', target: 50,  unit: 'km',     reward: 2,   prog: () => last7().total },
  { id: 'w_ride', ico: 'flag',   t: 'Complete 3 rides',     sub: 'Weekly quest', type: 'weekly', target: 3,   unit: 'rides',  reward: 1.5, prog: () => S.rides.filter(r => Date.now() - r.ts < 7 * 864e5).length }
];

const LEVELS = [
  [0, 'Rookie'], [100, 'Pedaler'], [250, 'City Rider'], [500, 'Route Master'],
  [1000, 'Tour Legend'], [1600, 'Summit Rider'], [2400, 'Legendary Rider'], [3500, 'Bitcycling Ambassador']
];
/* XP is derived from: km + QR + rides + badges + completed quests */
const xpTotal = () =>
  Math.round(S.totalKm) + S.qrCount * 10 + S.rides.length * 20 +
  S.badges.length * 25 + Object.keys(S.questsDone || {}).length * 30;

function levelInfo() {
  const xp = xpTotal();
  let i = 0;
  for (let k = 0; k < LEVELS.length; k++) if (xp >= LEVELS[k][0]) i = k;
  const cur = LEVELS[i], next = LEVELS[i + 1] || null;
  const pct = next ? Math.min(100, ((xp - cur[0]) / (next[0] - cur[0])) * 100) : 100;
  return { xp, idx: i + 1, name: cur[1], next, pct };
}

function renderQuests() {
  const el = $('#questList'); if (!el) return;
  el.innerHTML = QUESTS.map(q => {
    const p = Math.max(0, q.prog());
    const done = questClaimed(q);
    const ready = !done && p >= q.target;
    const pct = Math.min(100, (p / q.target) * 100);
    const shown = q.unit === 'km' ? nf(p, 1) : p;
    const target = q.unit === 'km' ? nf(q.target, 0) : q.target;
    return `
    <div class="quest-row ${done ? 'is-done' : ''}">
      <span class="quest-ico">${ico(q.ico)}</span>
      <div class="quest-body">
        <b>${q.t}<span class="quest-tag ${q.type === 'weekly' ? 'w' : ''}">${q.type === 'daily' ? 'daily' : 'weekly'}</span></b>
        <span class="q-sub">${done ? 'Completed · reward claimed' : `${shown} / ${target} ${q.unit}`} · reward ${nf(q.reward)} BTCYC</span>
        <div class="q-bar"><i style="width:${pct}%"></i></div>
      </div>
      <button class="q-claim ${done ? 'done' : ready ? 'ready' : ''}" data-claim="${q.id}" ${ready ? '' : 'disabled'}>${done ? '✓' : ready ? 'Claim' : '…'}</button>
    </div>`;
  }).join('');
  const claimed = QUESTS.filter(questClaimed).length;
  $('#questCount').textContent = `${claimed}/${QUESTS.length}`;

  /* level card */
  const L = levelInfo();
  $('#levelCard').innerHTML = `
    <div class="level-top">
      <span class="level-orb">${L.idx}</span>
      <div class="level-info">
        <b>${L.name}</b>
        <small>Level ${L.idx} · ${L.xp} XP${L.next ? ` · next ${L.next[0]} XP` : ' · max level'}</small>
      </div>
      <span class="level-xp">${L.xp} XP</span>
    </div>
    <div class="level-bar"><i style="width:${L.pct}%"></i></div>
    ${L.next
      ? `<div class="level-note"><span>Next: ${L.next[1]}</span><span>${L.next[0] - L.xp} XP left</span></div>`
      : `<div class="level-note"><span>You’re at the top</span><span>Max level</span></div>`}`;
  const pill = $('#levelPill');
  if (pill) pill.textContent = `★ Lv.${L.idx} ${L.name}`;
}

function claimQuest(id) {
  const q = QUESTS.find(x => x.id === id); if (!q) return;
  if (questClaimed(q)) return toast('You already claimed this quest reward.');
  if (q.prog() < q.target) return toast('Quest not completed yet.', 'bad');
  S.questsDone = S.questsDone || {};
  S.questsDone[questKey(q)] = Date.now();
  save();
  addBalance(q.reward, 'bonus', `Quest reward · ${q.t}`);
  confetti(22);
  toast(`Quest complete! +${nf(q.reward)} BTCYC · +30 XP`, 'good');
  notify(`Quest reward: ${q.t} · +${nf(q.reward)} BTCYC`, 'target');
  checkBadges();
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-claim]');
  if (b) claimQuest(b.dataset.claim);
});

/* ---------- modal ---------- */
function openModal(html) {
  $('#modalBody').innerHTML = html;
  $('#modalRoot').hidden = false;
}
const closeModal = () => {
  $('#modalRoot').hidden = true; $('#modalBody').innerHTML = '';
  stopCam();
  if (window.__hmap) { try { window.__hmap.remove(); } catch {} window.__hmap = null; }
};
document.addEventListener('click', e => { if (e.target.closest('[data-modal-close]')) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* ---------- balance ---------- */
function addBalance(amount, kind, note, extra = {}) {
  S.balance = +(S.balance + amount).toFixed(4);
  if (amount > 0) { S.earned = +(S.earned + amount).toFixed(4); if (kind !== 'spend') S.todayEarn = +(S.todayEarn + amount).toFixed(4); }
  else S.spent = +(S.spent + Math.abs(amount)).toFixed(4);
  S.ledger.unshift(Object.assign({ id: Date.now() + Math.random(), ts: Date.now(), kind, amount, note }, extra));
  if (S.ledger.length > 60) S.ledger.length = 60;
  save(); renderAll();
  pulse($('#chipBalance')); pulse($('#heroBalance'));
  if (amount > 0 && (kind === 'earn' || kind === 'bonus' || kind === 'receive'))
    notify(`+${nf(amount)} BTCYC · ${note}`, kind === 'bonus' ? 'gift' : kind === 'receive' ? 'arrowDownLeft' : 'bike');
}

/* ---------- navigation ---------- */
function nav(view) {
  $$('.view').forEach(v => v.classList.toggle('is-active', v.dataset.view === view));
  $$('.tab').forEach(t => t.classList.toggle('is-on', t.dataset.nav === view));
  $('#views').scrollTop = 0;
  renderAll();
  if (view === 'ride') focusRideMap();
}
document.addEventListener('click', e => {
  const el = e.target.closest('[data-nav]');
  if (el) nav(el.dataset.nav);
});

/* ============================================================
   AUTH
   ============================================================ */
function showPane(name) {
  $$('.auth-pane').forEach(p => p.classList.toggle('is-active', p.dataset.pane === name));
  $('#authScreen').scrollTop = 0;
}
document.addEventListener('click', e => {
  const go = e.target.closest('[data-auth-go]');
  if (go) {
    const to = go.dataset.authGo;
    if (to === 'demo') { seedDemo(); enterApp(); return; }
    showPane(to);
  }
  if (e.target.closest('[data-auth-back]')) showPane('welcome');
});

/* OTP fields */
function wireOtp(row) {
  const ins = $$('input', row);
  ins.forEach((inp, i) => {
    inp.addEventListener('input', () => {
      inp.value = inp.value.replace(/\D/g, '').slice(0, 1);
      if (inp.value && ins[i + 1]) ins[i + 1].focus();
    });
    inp.addEventListener('keydown', e => { if (e.key === 'Backspace' && !inp.value && ins[i - 1]) ins[i - 1].focus(); });
    inp.addEventListener('paste', e => {
      const v = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
      if (!v) return;
      e.preventDefault();
      v.split('').forEach((ch, k) => { if (ins[k]) ins[k].value = ch; });
      ins[Math.min(v.length, 6) - 1].focus();
    });
  });
}
wireOtp($('#otpRow'));
wireOtp($('#otpRow2'));
const otpValue = row => $$('input', row).map(i => i.value).join('');

/* sign-up steps */
let step = 1, selfieData = null;
const stepperItems = () => $$('#signupStepper li');
function setStep(n) {
  step = n;
  $$('.signup-step').forEach(s => s.classList.toggle('is-active', +s.dataset.step === n));
  stepperItems().forEach((li, i) => {
    li.classList.toggle('is-on', i === n - 1);
    li.classList.toggle('is-done', i < n - 1);
    if (i < n - 1) li.querySelector('span').textContent = '✓';
    else li.querySelector('span').textContent = String(i + 1);
  });
  $('#signupNext').textContent = n === 4 ? 'Complete payment · 1 €' : 'Continue';
}
function readSelfie(file, preview) {
  if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    selfieData = r.result;
    preview.innerHTML = `<img src="${selfieData}" alt="Selfie" />`;
  };
  r.readAsDataURL(file);
}
$('#selfieCam').addEventListener('change', e => readSelfie(e.target.files[0], $('#selfiePreview')));
$('#selfieFile').addEventListener('change', e => readSelfie(e.target.files[0], $('#selfiePreview')));

$('#signupNext').addEventListener('click', () => {
  if (step === 1) {
    const n = $('#suName').value.trim(), s = $('#suSurname').value.trim(),
          m = $('#suEmail').value.trim(), p = $('#suPhone').value.trim();
    if (!n || !s) return toast('First and last name are required.', 'bad');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(m)) return toast('Enter a valid email address.', 'bad');
    if (p.replace(/\D/g, '').length < 10) return toast('Enter a valid phone number.', 'bad');
    return setStep(2);
  }
  if (step === 2) {
    if (!selfieData) return toast('You need to upload a selfie to continue.', 'bad');
    return setStep(3);
  }
  if (step === 3) {
    if (otpValue($('#otpRow')) !== '240519') return toast('Incorrect 2FA code. Demo code: 240519', 'bad');
    return setStep(4);
  }
  const day = new Date();
  S.user = {
    name: $('#suName').value.trim(), surname: $('#suSurname').value.trim(),
    email: $('#suEmail').value.trim(), phone: $('#suPhone').value.trim(),
    selfie: selfieData, twoFA: true, paid: true,
    since: `${day.getDate()}.${day.getMonth() + 1}.${day.getFullYear()}`
  };
  S = Object.assign(defaults(), { user: S.user, lastDay: dayKey() });
  S.settings.twoFA = true;
  save();
  confetti(40);
  toast('Welcome! Access unlocked — 1 BTCYC sign-up gift credited.', 'good');
  addBalance(1, 'bonus', 'Sign-up gift');
  enterApp();
});

/* login */
$('#loginBtn').addEventListener('click', () => {
  const email = $('#liEmail').value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return toast('Enter a valid email address.', 'bad');
  if (otpValue($('#otpRow2')) !== '240519') return toast('Incorrect 2FA code. Demo code: 240519', 'bad');
  if (!S.user) { seedDemo(); S.user.email = email; save(); }
  enterApp();
});

function enterApp() {
  $('#authScreen').style.display = 'none';
  $('#appScreen').hidden = false;
  applyTheme();
  nav('home');
}
function logout() {
  stopRide(false);
  $('#appScreen').hidden = true;
  $('#authScreen').style.display = '';
  showPane('welcome');
  setStep(1);
  updateSuspension();
}

/* ---------- demo data ---------- */
const MAP_CENTER = [40.9682, 29.0262];          // Bosphorus, Istanbul
function genPath(n, lat0, lon0, heading) {
  const pts = [[+lat0.toFixed(6), +lon0.toFixed(6)]];
  let h = heading;
  for (let i = 1; i < n; i++) {
    h += (Math.random() - .5) * .7;
    const last = pts[pts.length - 1];
    pts.push([+(last[0] + Math.cos(h) * .0006).toFixed(6), +(last[1] + Math.sin(h) * .0008).toFixed(6)]);
  }
  return pts;
}
function seedDemo() {
  const now = Date.now(), H = 36e5, D = 864e5;
  const keepTheme = S.settings && S.settings.theme;
  S = defaults();
  S.settings.theme = keepTheme || 'light';
  S.user = {
    name: 'Alex', surname: 'Morgan', email: 'alex@bitcycling.app',
    phone: '+90 532 111 22 33', selfie: null, twoFA: true, paid: true, since: '1.3.2026'
  };
  S.balance = 13.75; S.earned = 22.5; S.spent = 8.75;
  S.walletId = 'BCYC-4F18-2A77';
  S.inviteCode = 'ALEX7';
  S.todayKm = 12.4; S.todayEligibleKm = 12.4; S.creditedToday = 0;
  S.todayEarn = 3; S.todayQr = 1; S.todaySocial = 1;
  S.questsDone = { ['d_soc|' + dayKey()]: Date.now() - 4 * 36e5 };
  S.totalKm = 62.4; S.totalMinutes = 1420; S.qrCount = 6;
  S.streak = 3;
  S.rideDays = [dayKey(new Date(now - 2 * D)), dayKey(new Date(now - D)), dayKey()];
  S.ride = Object.assign(defaults().ride, { source: 'sim', mult: 1 });
  S.ledger = [
    { id: 1, ts: now - 2 * H, kind: 'bonus', amount: 3, note: 'QR bonus · Istanbul Downtown' },
    { id: 2, ts: now - 2 * D, kind: 'receive', amount: 1.5, note: 'Incoming transfer · Max Reed', from: '@maxr' },
    { id: 3, ts: now - 26 * H, kind: 'earn', amount: 1, note: 'Ride credit · 20 km', km: 20 },
    { id: 4, ts: now - 3 * D, kind: 'spend', amount: -6.25, note: 'Trade · Energy Gel 12-pack' },
    { id: 5, ts: now - 4 * D, kind: 'earn', amount: 1, note: 'Ride credit · 20 km', km: 20 },
    { id: 6, ts: now - 5 * D, kind: 'send', amount: -2.5, note: 'Transfer → Sara Demir', to: '@sarad', trx: 'TRX-8842' },
    { id: 7, ts: now - 6 * D, kind: 'bonus', amount: 5, note: 'Bike Fest volunteer bonus' },
    { id: 8, ts: now - 8 * D, kind: 'bonus', amount: 2, note: 'QR bonus · Izmir Waterfront' },
    { id: 9, ts: now - 11 * D, kind: 'bonus', amount: 8, note: 'Contest prize · longest distance' }
  ].sort((a, b) => b.ts - a.ts);
  S.orders = [
    { id: 'BC-2041', name: 'Energy Gel · 12-pack', store: 'FuelLab', btc: 6.25, icon: 'zap', status: 'Shipped', ts: now - 3 * D }
  ];
  S.rides = [
    { ts: now - 26 * H, km: 21.2, min: 74, avg: 17.2, points: genPath(58, 40.9682, 29.0262, 1.1) },
    { ts: now - 3 * D, km: 14.6, min: 52, avg: 16.8, points: genPath(44, 40.9801, 29.0410, 2.4) },
    { ts: now - 5 * D, km: 18.9, min: 66, avg: 17.2, points: genPath(52, 40.9560, 29.0120, .4) },
    { ts: now - 7 * D, km: 7.7, min: 26, avg: 17.8, points: genPath(26, 40.9900, 29.0600, 3.3) }
  ];
  S.violations = [];
  S.sessions = defaultSessions();
  S.friends = ['@ellak'];
  S.likes = { 0: true };
  S.comments = {
    0: [{ n: 'Max Reed', t: 'Amazing — 100 km goal complete 💪', ts: now - 54e5 }],
    1: [{ n: 'Sara Demir', t: 'I’m joining the Riverside route too!', ts: now - 3 * H }],
    2: [{ n: 'Zoe Arda', t: 'Is the Waterfront QR code still valid?', ts: now - 20 * H }]
  };
  S.notifs = [
    { id: 1, ts: now - 18e5, text: '+1.50 BTCYC · Incoming transfer · Max Reed', icon: 'arrowDownLeft', read: false },
    { id: 2, ts: now - 3 * H, text: 'Ride credit · 20 km posted to your account', icon: 'bike', read: true },
    { id: 3, ts: now - 2 * D, text: 'You made the top 10 in the monthly ranking', icon: 'trophy', read: true }
  ];
  S.settings = { notify: true, dataShare: false, twoFA: true, theme: S.settings.theme };
  checkBadges(true);
  save();
}

/* ============================================================
   MAP (Leaflet · OpenStreetMap/CARTO)
   ============================================================ */
let lmap = null, tiles = null, routeLine = null, riderDot = null;
/* Keyless OSM tile, darkened with a CSS filter in dark theme */
const tileUrl = () => 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const tileOpt = () => ({ maxZoom: 19, attribution: '© OpenStreetMap contributors' });
const mapAvailable = () => typeof L !== 'undefined' && !window.__leafletFailed;
const lastPoint = () => { const p = S.ride.points; return p && p.length ? p[p.length - 1] : null; };
/* show a shimmer skeleton until the tiles load */
function mapSkeleton(box, layer) {
  if (!box || !layer) return;
  box.classList.add('is-loading');
  const done = () => box.classList.remove('is-loading');
  layer.on('load', done);
  layer.on('tileerror', done);
  setTimeout(done, 6000);
}

function ensureMap() {
  if (!mapAvailable()) return false;
  if (lmap) return true;
  try {
    lmap = L.map('lmap', { zoomControl: false, scrollWheelZoom: false, attributionControl: true })
      .setView(MAP_CENTER, 14);
    lmap.attributionControl.setPrefix('');
    tiles = L.tileLayer(tileUrl(), tileOpt()).addTo(lmap);
    mapSkeleton($('#lmap'), tiles);
    routeLine = L.polyline(S.ride.points || [], { color: '#059669', weight: 6, opacity: .95, lineJoin: 'round', lineCap: 'round' }).addTo(lmap);
    riderDot = L.circleMarker(lastPoint() || MAP_CENTER, { radius: 7, color: '#fff', weight: 3, fillColor: '#10B981', fillOpacity: 1 }).addTo(lmap);
    $('#rideMap').classList.add('has-leaflet');
    setTimeout(() => { if (lmap) lmap.invalidateSize(); }, 80);
    return true;
  } catch { lmap = null; return false; }
}
function retileMap(t) {
  if (!lmap || !tiles) return;
  try { lmap.removeLayer(tiles); tiles = L.tileLayer(tileUrl(), tileOpt()).addTo(lmap); } catch {}
}
function focusRideMap() {
  if (!ensureMap()) return;
  setTimeout(() => { if (lmap) { lmap.invalidateSize(); syncMap(); } }, 90);
}
function syncMap() {
  if (!lmap) return;
  try {
    routeLine.setLatLngs(S.ride.points || []);
    const l = lastPoint(); if (l) riderDot.setLatLng(l);
  } catch {}
}
function mapPan(lat, lon) {
  if (!lmap || !S.rideActive) return;
  try { lmap.panTo([lat, lon], { animate: true, duration: .7 }); riderDot.setLatLng([lat, lon]); } catch {}
}
/* route recording */
function pushPoint(lat, lon) {
  const r = ride();
  r.points = r.points || [];
  const last = r.points[r.points.length - 1];
  if (last && haversine(last[0], last[1], lat, lon) * 1000 < 35) return;
  r.points.push([+lat.toFixed(6), +lon.toFixed(6)]);
  if (r.points.length > 300) r.points.shift();
  mapPan(lat, lon);
}
function simPoint(r, km) {
  r.accM = (r.accM || 0) + km * 1000;
  if (!r.points || !r.points.length) {
    r.points = [[MAP_CENTER[0], MAP_CENTER[1]]];
    if (r.heading == null) r.heading = Math.random() * Math.PI * 2;
  }
  let guard = 0;
  while (r.accM >= 55 && guard++ < 14) {
    r.accM -= 55;
    if (r.heading == null) r.heading = Math.random() * Math.PI * 2;
    r.heading += (Math.random() - .5) * .8;
    const last = r.points[r.points.length - 1] || [MAP_CENTER[0], MAP_CENTER[1]];
    const dLat = last[0] - MAP_CENTER[0], dLon = last[1] - MAP_CENTER[1];
    if (Math.hypot(dLat, dLon) > .015) r.heading = Math.atan2(-dLon, -dLat) + (Math.random() - .5) * .6;
    const nlat = last[0] + Math.cos(r.heading) * .0005;
    const nlon = last[1] + Math.sin(r.heading) * .0007;
    r.points.push([+nlat.toFixed(6), +nlon.toFixed(6)]);
    if (r.points.length > 300) r.points.shift();
    mapPan(nlat, nlon);
  }
}

/* ============================================================
   RIDE ENGINE
   ============================================================ */
let timer = null, watchId = null, speedTarget = 18, overTicks = 0;
const ride = () => S.ride;

function startRide() {
  const r = ride();
  if (S.suspended) return toast('Account suspended — rides cannot start.', 'bad');
  if (r.source === 'gps') {
    if (!navigator.geolocation) { toast('This device has no GPS.', 'bad'); return; }
    toast('Requesting GPS permission…');
    navigator.geolocation.watchPosition(onGps, onGpsErr, { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 });
    watchId = 'pending';
  }
  S.rideActive = true;
  r.km = r.km || 0; r.seconds = r.seconds || 0;
  clearInterval(timer);
  timer = setInterval(tick, 1000);
  $('#rideToggle').textContent = 'Ride in progress · Pause';
  $('#rideFinish').disabled = false;
  $('#rideStatusPill').textContent = 'Riding';
  toast('Ride started — start pedaling!', 'good');
}
function pauseRide() {
  clearInterval(timer); timer = null;
  if (watchId && watchId !== 'pending') { navigator.geolocation.clearWatch(watchId); watchId = null; }
  S.rideActive = false;
  $('#rideToggle').textContent = 'Resume ride';
  $('#rideStatusPill').textContent = 'Paused';
  save();
}
function stopRide(confirm = true) {
  const r = ride();
  if (confirm && r.km > 0.01) { finishRide(); return; }
  clearInterval(timer); timer = null;
  if (watchId && watchId !== 'pending') { navigator.geolocation.clearWatch(watchId); watchId = null; }
  S.rideActive = false;
  $('#rideToggle').textContent = r.km > 0 ? 'Start new ride' : 'Start ride';
  $('#rideStatusPill').textContent = 'Ready';
  save();
}

function onGps(pos) {
  const r = ride();
  const c = pos.coords;
  const spd = (c.speed != null && c.speed >= 0) ? c.speed * 3.6 : Math.min(LIMIT_SPEED - 2, 16);
  r.gpsSpeed = spd;
  if (r.lastLat != null) {
    const d = haversine(r.lastLat, r.lastLon, c.latitude, c.longitude);
    if (d < 0.6) accumulate(d, spd, 1);
  }
  r.lastLat = c.latitude; r.lastLon = c.longitude;
  pushPoint(c.latitude, c.longitude);
  $('#gpsPill').textContent = '● GPS active';
}
function onGpsErr() {
  if (watchId === 'pending') {
    watchId = null;
    ride().source = 'sim';
    syncSourceUI();
    toast('GPS permission denied — switched back to simulation.', 'bad');
    if (S.rideActive) { clearInterval(timer); timer = setInterval(tick, 1000); }
  }
}
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371, toR = d => d * Math.PI / 180;
  const dLat = toR(lat2 - lat1), dLon = toR(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function tick() {
  const r = ride();
  if (r.source === 'gps') {           // real-time clock flow
    r.seconds += 1;
    renderRide();
    return;
  }
  // speed behavior: normally below the limit, rarely spikes above it
  if (r.source === 'sim') {
    if (overTicks > 0) overTicks--;
    else if (Math.random() < 0.035) overTicks = 3;
    if (overTicks > 0) {
      speedTarget = LIMIT_SPEED + 2 + Math.random() * 7;
    } else {
      speedTarget += (Math.random() - .5) * 5;
      speedTarget = Math.max(11, Math.min(37, speedTarget));
    }
    const km = speedTarget * ((1000 * r.mult) / 3600000);
    accumulate(km, speedTarget, r.mult);
  }
}

function accumulate(km, speed, secStep) {
  const r = ride();
  const over = speed > LIMIT_SPEED;
  const limitReached = Math.min(S.todayEligibleKm, DAILY_KM) >= DAILY_KM;

  r.km = +(r.km + km).toFixed(4);
  r.seconds += secStep;
  S.totalKm = +(S.totalKm + km).toFixed(4);
  S.todayKm = +(S.todayKm + km).toFixed(4);
  if (r.source === 'sim' && S.rideActive) simPoint(r, km);

  const eligible = !over && !limitReached;
  if (eligible) {
    r.eligible = +(r.eligible + km).toFixed(4);
    S.todayEligibleKm = +(S.todayEligibleKm + km).toFixed(4);
  }

  // over-limit violation tracking
  if (over && !r.episode) {
    r.episode = true;
    S.violations.unshift({ ts: Date.now(), speed: Math.round(speed) });
    S.violations = S.violations.slice(0, 10);
    const v = S.violations.length;
    notify(`Speed limit violation recorded · ${Math.round(speed)} km/h (${v}/3)`, 'ban');
    if (v >= 3) {
      S.suspended = true; S.strikesWarned = true;
      save(); pauseRide(); updateSuspension();
      toast('Account suspended due to repeated violations.', 'bad');
    } else if (v === 2 && !S.strikesWarned) {
      S.strikesWarned = true;
      openModal(`
        <h3>Final violation warning</h3>
        <p class="lead">Riding above 40 km/h does not count toward BTCYC. One more violation permanently suspends the account.</p>
        <div class="balance-warn">Recorded violations: 2 / 3 — final warning.</div>
        <button class="btn btn-primary btn-lg" data-modal-close>Got it, I’ll stay under the limit</button>`);
    }
    toast(`Limit exceeded: ${Math.round(speed)} km/h — this segment earns no BTCYC.`, 'bad');
  }
  if (!over && r.episode) r.episode = false;
  if (over) r.over = true;

  // credit check (every 20 km = 1 BTCYC, 100 km per day)
  const credits = Math.floor(Math.min(S.todayEligibleKm, DAILY_KM) / KM_PER_BTCYC);
  if (credits > S.creditedToday) {
    const gain = credits - S.creditedToday;
    S.creditedToday = credits;
    addBalance(gain, 'earn', `Ride credit · ${gain * KM_PER_BTCYC} km`);
    confetti(22);
    toast(`+${gain} BTCYC earned!`, 'good');
    if (Math.min(S.todayEligibleKm, DAILY_KM) >= DAILY_KM) toast('Daily 100 km limit reached. Again tomorrow!', 'good');
  }
  save();
  renderRide();
}

/* ride controls */
$('#rideToggle').addEventListener('click', () => { S.rideActive ? pauseRide() : startRide(); });$('#rideFinish').addEventListener('click', () => stopRide(true));

$('#sourceSeg').addEventListener('click', e => {
  const b = e.target.closest('[data-source]'); if (!b) return;
  if (S.rideActive) return toast('Pause the ride to change the source.', 'bad');
  ride().source = b.dataset.source;
  syncSourceUI();
});
$('#speedSeg').addEventListener('click', e => {
  const b = e.target.closest('[data-mult]'); if (!b) return;
  ride().mult = +b.dataset.mult;
  $$('#speedSeg button').forEach(x => x.classList.toggle('is-on', x === b));
  save();
});
function syncSourceUI() {
  const gps = ride().source === 'gps';
  $$('#sourceSeg button').forEach(x => x.classList.toggle('is-on', x.dataset.source === ride().source));
  $('#speedSeg').style.display = gps ? 'none' : '';
  $('#gpsPill').textContent = gps ? '● GPS waiting' : '● Simulation';
  $('#sourceHint').textContent = gps
    ? 'Real GPS: distance and speed are calculated from your device location; the portion below 40 km/h counts.'
    : 'Simulation speeds up time; speed values are validated in real time against the 40 km/h limit.';
}

/* ---------- daily streak ---------- */
function currentStreak() {
  const days = new Set(S.rideDays || []);
  let d = Date.now();
  if (!days.has(dayKey(new Date(d)))) d -= 864e5;   // if today wasn't ridden the chain continues from yesterday
  let n = 0;
  while (days.has(dayKey(new Date(d)))) { n++; d -= 864e5; }
  return n;
}
function bumpRideStreak() {
  const today = dayKey();
  S.rideDays = S.rideDays || [];
  if (!S.rideDays.includes(today)) { S.rideDays.push(today); S.rideDays = S.rideDays.slice(-40); }
  S.streak = currentStreak();
  S.lastRideDay = today;
}

function finishRide() {
  const r = ride();
  const km = r.km, min = r.seconds / 60;
  if (km > 0.01) {
    S.rides.unshift({
      ts: Date.now(), km: +km.toFixed(2), min: Math.round(min),
      avg: +(km / (r.seconds / 3600 || 1)).toFixed(1),
      points: (r.points || []).slice(-300)
    });
    S.totalMinutes = Math.round(S.totalMinutes + min);
    S.rides = S.rides.slice(0, 25);
    S.rides.forEach((x, i) => { if (i > 7 && x.points && x.points.length > 60) x.points = x.points.filter((_, k) => k % 3 === 0); });
    bumpRideStreak();
  }
  S.ride = Object.assign(defaults().ride, { source: r.source, mult: r.mult });
  clearInterval(timer); timer = null;
  if (watchId && watchId !== 'pending') { navigator.geolocation.clearWatch(watchId); watchId = null; }
  S.rideActive = false;
  $('#rideToggle').textContent = 'Start ride';
  $('#rideFinish').disabled = true;
  $('#rideStatusPill').textContent = 'Completed';
  save(); renderAll();
  if (km > 0.01) { notify(`Ride completed · ${nf(km, 1)} km · ${fmtTime(r.seconds)}`, 'map'); checkBadges(); }

  const avg = r.seconds ? (km / (r.seconds / 3600)) : 0;
  openModal(`
    <h3>Ride completed</h3>
    <p class="lead">${r.over ? 'Calculated excluding the over-limit segment.' : 'Clean ride — the entire distance counted.'}</p>
    <div class="summary-grid">
      <div><b>${nf(km)}</b><small>km</small></div>
      <div><b>${fmtTime(r.seconds)}</b><small>time</small></div>
      <div><b>${nf(avg, 1)}</b><small>km/h avg.</small></div>
      <div><b>${nf(r.eligible)}</b><small>eligible km</small></div>
      <div><b>${S.todayEarn}</b><small>today BTCYC</small></div>
      <div><b>${nf(Math.min(S.todayEligibleKm, DAILY_KM), 1)}</b><small>daily / 100 km</small></div>
    </div>
    ${r.over ? `<div class="balance-warn">This ride exceeded 40 km/h and the excess did not convert to BTCYC. Repeated violations suspend your account.</div>` : ''}
    <button class="btn btn-primary btn-lg" data-modal-close style="width:100%">Great, close</button>`);
  if (!r.over) confetti(30);
}

/* ============================================================
   MARKET
   ============================================================ */
let filterCat = 'all', filterQ = '';
function renderMarket() {
  const list = PRODUCTS.filter(p =>
    (filterCat === 'all' || p.cat === filterCat) &&
    (!filterQ || (p.name + ' ' + p.store).toLowerCase().includes(filterQ))
  );
  $('#marketCount').textContent = `${list.length} products`;
  $('#productGrid').innerHTML = list.length ? list.map(p => `
    <article class="product" data-product="${p.id}" data-cat="${p.cat}">
      <div class="p-img"><span class="p-store">${p.store}</span>${ico(p.icon)}</div>
      <div class="p-body">
        <span class="p-name">${p.name}</span>
        <span class="p-price"><span class="coin">₿</span>${nf(p.btc)} <span class="p-fiat">≈ ${money(p.btc)}</span></span>
        <button class="p-btn${S.balance >= p.btc ? '' : ' alt'}" data-product="${p.id}">${S.balance >= p.btc ? 'Trade' : 'Details'}</button>
      </div>
    </article>`).join('') : `<p class="empty" style="grid-column:1/-1">No products in this filter.</p>`;

  $('#orderList').innerHTML = S.orders.length ? S.orders.map(o => `
    <div class="list-row">
      <span class="list-ico gold">${ico(o.icon || o.emoji)}</span>
      <div class="list-body"><b>${o.name}</b><small>${o.store} · ${o.status} · ${ago(o.ts)}</small></div>
      <span class="list-amt minus">-${nf(o.btc)}</span>
    </div>`).join('') : `<p class="empty">No trades yet. Buy products in the market with the BTCYC you earned.</p>`;
}
$('#marketChips').addEventListener('click', e => {
  const b = e.target.closest('[data-cat]'); if (!b) return;
  filterCat = b.dataset.cat;
  $$('#marketChips .chip').forEach(c => c.classList.toggle('is-on', c === b));
  renderMarket();
});
document.addEventListener('click', e => {
  const jump = e.target.closest('[data-cat-jump]');
  if (jump) {
    filterCat = jump.dataset.catJump;
    $$('#marketChips .chip').forEach(c => c.classList.toggle('is-on', c.dataset.cat === filterCat));
    renderMarket();
    $('#marketChips').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});
$('#marketSearch').addEventListener('input', e => { filterQ = e.target.value.trim().toLowerCase(); renderMarket(); });
$('#filterBtn').addEventListener('click', () => toast('Filter with category chips: ' + filterCat));

document.addEventListener('click', e => {
  const el = e.target.closest('[data-product]'); if (!el) return;
  const p = PRODUCTS.find(x => x.id === el.dataset.product); if (!p) return;
  const afford = S.balance >= p.btc;
  openModal(`
    <div class="detail-hero">${ico(p.icon)}</div>
    <h3>${p.name}</h3>
    <p class="lead">${p.store} · virtual store · market section</p>
    <div class="detail-price">
      <div><small>Trade price</small><span class="amount"><span class="coin">₿</span>${nf(p.btc)} BTCYC</span></div>
      <div style="text-align:right"><small>Rent value</small><b>${money(p.btc)}</b></div>
    </div>
    <div class="spec-list">
      <div><span>Category</span><b>${p.cat[0].toUpperCase() + p.cat.slice(1)}</b></div>
      <div><span>Stock</span><b>${p.stock} units</b></div>
      <div><span>Shipping</span><b>${p.ship}</b></div>
      <div><span>Your balance</span><b>${nf(S.balance)} BTCYC</b></div>
    </div>
    ${afford ? '' : `<div class="balance-warn">Insufficient balance. ${nf(p.btc - S.balance)} BTCYC more to earn — 100 km a day = 5 BTCYC.</div>`}
    <div class="row gap" style="gap:10px">
      <button class="btn btn-primary btn-lg" style="flex:1" ${afford ? `data-trade="${p.id}"` : 'disabled'}>${afford ? 'Confirm trade' : 'Insufficient balance'}</button>
      ${afford ? '' : `<button class="btn btn-soft btn-lg" style="flex:1" data-nav="ride" data-modal-close>Go to ride</button>`}
    </div>`);
});
document.addEventListener('click', e => {
  const b = e.target.closest('[data-trade]'); if (!b) return;
  const p = PRODUCTS.find(x => x.id === b.dataset.trade); if (!p) return;
  if (S.balance < p.btc) return toast('Insufficient balance.', 'bad');
  addBalance(-p.btc, 'spend', `Trade · ${p.name}`);
  const id = 'BC-' + Math.floor(1000 + Math.random() * 8999);
  S.orders.unshift({ id, name: p.name, store: p.store, btc: p.btc, icon: p.icon, status: 'Preparing', ts: Date.now() });
  save(); renderAll(); closeModal();
  confetti(24);
  openModal(`
    <h3>Trade confirmed</h3>
    <p class="lead">Your order number is <b>${id}</b>. ${p.store} store is preparing the item; shipping details will go to the address in your profile.</p>
    <div class="summary-grid">
      <div><b>${nf(p.btc)}</b><small>BTCYC paid</small></div>
      <div><b>${nf(S.balance)}</b><small>remaining balance</small></div>
      <div><b>${p.ship}</b><small>estimated delivery</small></div>
    </div>
    <button class="btn btn-primary btn-lg" data-nav="market" data-modal-close style="width:100%">Back to market</button>`);
});

/* ============================================================
   QR / EVENTS
   ============================================================ */
function grantQr(source) {
  if (S.todayQr >= 10) return toast('Your 10 QR codes for today are used up.', 'bad');
  const gain = 1 + Math.floor(Math.random() * 5);
  const city = $('#qrCity') ? $('#qrCity').value : 'Istanbul';
  S.todayQr++; S.qrCount++;
  addBalance(gain, 'bonus', `QR bonus · ${city}`);
  confetti(24);
  notify(`+${gain} BTCYC QR bonus · ${city}`, 'qr');
  toast(`+${gain} BTCYC — ${city} QR code scanned${source === 'cam' ? ' (camera)' : ''}!`, 'good');
  checkBadges();
}
$('#qrScanBtn').addEventListener('click', () => {
  if (S.todayQr >= 10) return toast('Your 10 QR codes for today are used up.', 'bad');
  const box = $('#qrVisual');
  box.classList.remove('is-spin'); void box.offsetWidth; box.classList.add('is-spin');
  setTimeout(() => grantQr('sim'), 480);
});

/* ---------- QR scanning with the camera ---------- */
let camStream = null, camTimer = null;
function stopCam() {
  clearInterval(camTimer); camTimer = null;
  if (camStream) { try { camStream.getTracks().forEach(t => t.stop()); } catch {} camStream = null; }
}
function openScanner() {
  if (S.todayQr >= 10) return toast('Your 10 QR codes for today are used up.', 'bad');
  openModal(`
    <h3>QR with camera</h3>
    <p class="lead">Align the event QR code in the frame. Once it is read, the bonus is credited to your balance instantly.</p>
    <div class="cam-box">
      <video id="camVideo" playsinline muted autoplay></video>
      <div class="cam-reticle"></div><div class="cam-scan"></div>
      <div class="cam-hint" id="camHint">Scanning code…</div>
    </div>
    <div id="camErr"></div>
    <button class="btn btn-soft btn-lg" id="camSim" style="width:100%">No code? Simulate it and claim the bonus</button>
    <div class="secure-note">${ico('lock')} The camera image never leaves your device; QR decoding happens only in this tab.</div>`);
  $('#camSim').onclick = () => { stopCam(); closeModal(); setTimeout(() => grantQr('sim'), 120); };
  startCam();
}
async function startCam() {
  const v = $('#camVideo'); if (!v) return;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    $('#camErr').innerHTML = `<div class="cam-fail">This browser doesn’t support the camera. Continue with the simulation button.</div>`;
    return;
  }
  try {
    camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    v.srcObject = camStream;
    await v.play().catch(() => {});
    if (typeof jsQR !== 'undefined' && !window.__jsqrFailed) camTimer = setInterval(() => scanFrame(v), 400);
    else $('#camHint').textContent = 'QR engine failed to load · use simulation';
  } catch (err) {
    const e = $('#camErr');
    if (e) e.innerHTML = `<div class="cam-fail">Could not open the camera (${err && err.name ? err.name : 'no permission'}). Grant camera permission and try again, or use simulation.</div>`;
    const h = $('#camHint'); if (h) h.textContent = 'Camera unavailable';
  }
}
function scanFrame(v) {
  if (!v || !v.videoWidth || typeof jsQR === 'undefined') return;
  try {
    const w = 260, h = Math.max(1, Math.round(260 * v.videoHeight / v.videoWidth));
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(v, 0, 0, w, h);
    const img = ctx.getImageData(0, 0, w, h);
    const code = jsQR(img.data, w, h, { inversionAttempts: 'dontInvert' });
    if (code && code.data) { stopCam(); closeModal(); setTimeout(() => grantQr('cam'), 120); }
  } catch {}
}
$('#qrQuickBtn').addEventListener('click', () => {
  nav('events');
  setTimeout(() => $('#qrScanBtn').scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
});
$('#qrCamBtn').addEventListener('click', openScanner);
$('#festJoin').addEventListener('click', () => {
  if (S.festJoined) return toast('You’re already registered. See you on May 18!');
  S.festJoined = true; save(); renderAll();
  confetti(30);
  toast('Your Bike Fest registration is complete!', 'good');
  notify('Bike Fest registration complete · May 18 Riverside', 'flag');
  checkBadges();
});
$('#shareBtn').addEventListener('click', () => {
  if (S.shared) return toast('You’ve claimed today’s sharing reward — again tomorrow.');
  S.shared = true; save(); renderAll();
  addBalance(1, 'bonus', '#Bitcycling share reward');
  toast('Post published +1 BTCYC', 'good');
});

/* ============================================================
   PROFILE
   ============================================================ */
$('#toggle2fa').addEventListener('change', e => {
  S.settings.twoFA = e.target.checked; save();
  toast(e.target.checked ? '2FA enabled.' : '2FA disabled — security reduced.', e.target.checked ? 'good' : 'bad');
  renderProfile();
});
$('#toggleData').addEventListener('change', e => {
  S.settings.dataShare = e.target.checked; save();
  toast(e.target.checked ? 'Data sharing enabled.' : 'Data sharing disabled.');
});
$('#toggleNotify').addEventListener('change', e => { S.settings.notify = e.target.checked; save(); });
$('#profileSelfie').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => { S.user.selfie = r.result; save(); renderProfile(); toast('Selfie updated.', 'good'); };
  r.readAsDataURL(f);
});
$('#resetBtn').addEventListener('click', () => {
  openModal(`
    <h3>Reset your data?</h3>
    <p class="lead">Balance, ride history, trades and profile are permanently deleted. This cannot be undone.</p>
    <div class="row gap" style="gap:10px">
      <button class="btn btn-ghost btn-lg" style="flex:1" data-modal-close>Cancel</button>
      <button class="btn btn-primary btn-lg" style="flex:1;background:linear-gradient(135deg,#F43F5E,#BE123C)" id="resetYes">Reset</button>
    </div>`);
  $('#resetYes').addEventListener('click', () => {
    localStorage.removeItem(KEY);
    S = defaults(); save(); closeModal(); logout(); toast('Demo data deleted.');
  });
});
$('#logoutBtn').addEventListener('click', () => { logout(); toast('Signed out.'); });

/* ============================================================
   RENDER
   ============================================================ */
function rankOf() {
  const all = [...BOARD.map(b => ({ n: b.n, km: b.km, me: false, c: b.c })),
               { n: (S.user ? S.user.name + ' ' + S.user.surname : 'You'), km: S.totalKm, me: true, c: '#059669' }]
    .sort((a, b) => b.km - a.km);
  return { all, idx: all.findIndex(x => x.me) + 1 };
}

function renderHome() {
  const u = S.user || {};
  const hour = new Date().getHours();
  const greet = hour < 11 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  $('#greetEyebrow').textContent = greet;
  $('#greetName').textContent = u.name ? `${u.name}, ready to ride?` : 'Ready to ride?';

  const streak = currentStreak();
  $('#streakChip').style.display = streak > 0 ? '' : 'none';
  $('#streakNum').textContent = streak;

  const av = u.selfie ? `<img src="${u.selfie}" alt="" />` : initials(u.name, u.surname);
  $('#homeAvatar').innerHTML = av;
  setNum($('#chipBalance'), S.balance);
  setNum($('#heroBalance'), S.balance);
  $('#heroFiat').textContent = `≈ ${money(S.balance)} in value`;

  const prog = Math.min(S.todayKm, DAILY_KM) / DAILY_KM;
  $('#ringFg').style.strokeDashoffset = String(251.3 * (1 - prog));
  $('#ringKm').textContent = nf(S.todayKm, 1);

  setNum($('#statTodayKm'), S.todayKm, v => nf(v, 1));
  setNum($('#statTodayEarn'), S.todayEarn, v => nf(v, 0));
  setNum($('#statTotalKm'), S.totalKm, v => nf(v, 1));
  $('#statQr').textContent = S.qrCount;

  $('#homeLedger').innerHTML = S.ledger.slice(0, 4).map(ledgerRow).join('') ||
    emptyIll('coin', 'No activity yet', 'Start riding; every 20 km = 1 BTCYC is credited to your balance.');

  const { all, idx } = rankOf();
  $('#homeBoard').innerHTML = all.slice(0, 5).map((r, i) => `
    <div class="list-row" ${r.me ? 'style="background:var(--primary-tint)"' : ''}>
      <span class="list-ico ${i < 3 ? 'gold' : 'blue'}">${i + 1}</span>
      <div class="list-body"><b>${r.n}${r.me ? ' (you)' : ''}</b><small>${nf(r.km, 1)} km · this month</small></div>
      <span class="list-amt">${ico(i === 0 ? 'crown' : 'medal')}</span>
    </div>`).join('');
  $('#notifDot').style.display = idx <= 10 && (S.notifs || []).some(n => !n.read) ? '' : 'none';

  $('#homeFeed').innerHTML = FEED.map((p, i) => {
    const liked = !!(S.likes || {})[i];
    const cm = ((S.comments || {})[i] || []).length + p.cm;
    const likes = p.l + (S.shared ? 12 : 0) + (liked ? 1 : 0);
    return `
    <article class="post">
      <div class="post-head">
        <span class="post-ava" style="background:${p.c}">${p.n.split(' ').map(x => x[0]).join('')}</span>
        <div><b>${p.n}</b><small>${p.h}</small></div>
      </div>
      <p>${p.t}</p>
      <div class="post-stats">
        <button class="post-act ${liked ? 'on' : ''}" data-like="${i}">${ico('heart')} ${likes}</button>
        <button class="post-act" data-comments="${i}">${ico('chat')} ${cm}</button>
        <button class="post-act" data-share-post="${i}">${ico('share')} share</button>
      </div>
    </article>`;
  }).join('');
}

function ledgerRow(l) {
  const ic =
    l.kind === 'spend' ? ['bag', 'pink'] :
    l.kind === 'bonus' ? ['gift', 'gold'] :
    l.kind === 'send' ? ['share', 'red'] :
    l.kind === 'receive' ? ['arrowDownLeft', 'green'] : ['bike', 'green'];
  const sign = l.amount > 0 ? '+' : '';
  return `
    <div class="list-row">
      <span class="list-ico ${ic[1]}">${ico(ic[0])}</span>
      <div class="list-body"><b>${l.note}</b><small>${ago(l.ts)}${l.trx ? ' · ' + l.trx : ''}</small></div>
      <span class="list-amt ${l.amount > 0 ? 'plus' : 'minus'}">${sign}${nf(l.amount)}</span>
    </div>`;
}

/* speed gauge: generates 0–50 km/h ticks and labels */
function buildGauge() {
  const ticks = $('#gaugeTicks'), labels = $('#gaugeLabels');
  if (!ticks || !labels) return;
  let t = '', l = '';
  for (let v = 0; v <= 50; v += 10) {
    const a = (180 - (v / 50) * 180) * Math.PI / 180;
    const c = Math.cos(a), s = Math.sin(a);
    const x = r => (100 + r * c).toFixed(1);
    const y = r => (95 - r * s).toFixed(1);
    t += `<line class="tick" x1="${x(58)}" y1="${y(58)}" x2="${x(70)}" y2="${y(70)}"/>`;
    l += `<text class="tick-label" x="${x(46)}" y="${y(46)}" text-anchor="middle" dominant-baseline="middle">${v}</text>`;
  }
  ticks.innerHTML = t;
  labels.innerHTML = l;
}

function renderRide() {
  const r = ride();
  $('#rideKm').textContent = nf(r.km);
  $('#rideTime').textContent = fmtTime(r.seconds);
  const spd = r.source === 'sim' ? (S.rideActive ? Math.round(speedTarget) : 0) : Math.round(r.gpsSpeed || 0);
  $('#speedBig').textContent = spd;
  const needle = $('#gaugeNeedle');
  if (needle) needle.style.transform = `rotate(${(Math.max(0, Math.min(spd, 50)) / 50) * 180}deg)`;
  $('#rideAvg').textContent = r.seconds ? nf(r.km / (r.seconds / 3600), 1) : '0.0';
  setNum($('#rideEligible'), r.eligible || 0, v => nf(v, 2));

  const over = spd > LIMIT_SPEED;
  $('#speedCard').classList.toggle('is-over', over);
  $('#speedFlag').textContent = over ? `${spd} km/h · limit exceeded!` : `Limit ${LIMIT_SPEED} km/h`;
  $('#speedNote').textContent = over
    ? 'This segment earns no BTCYC. Slow down!'
    : 'Rides above the limit earn no BTCYC; repeats suspend your account.';

  const done = Math.min(S.todayEligibleKm, DAILY_KM);
  $('#limitKm').textContent = nf(done, 1);
  $('#limitFill').style.width = (done / DAILY_KM) * 100 + '%';
  $('#limitEarn').textContent = S.todayEarn;
  $('#nextCredit').textContent = done >= DAILY_KM ? 'Limit reached' : `${nf(KM_PER_BTCYC - (done % KM_PER_BTCYC))} km`;

  const pct = Math.min(1, r.km / 40);
  $('#routeFg').style.strokeDashoffset = String(600 * (1 - pct));
  $('#mapRider').style.offsetDistance = (pct * 100) + '%';
  syncMap();
}

/* ride history + route map */
function renderRideHistory() {
  const el = $('#rideHistory'); if (!el) return;
  el.innerHTML = S.rides.length ? S.rides.slice(0, 8).map((r, i) => `
    <button class="history-row" data-ride="${i}">
      <span class="list-ico green">${ico('map')}</span>
      <span class="list-body"><b>${nf(r.km, 1)} km · ${r.min} min</b>
        <small>${ago(r.ts)} · avg. ${nf(r.avg, 1)} km/h${r.points && r.points.length > 1 ? ' · route recorded' : ''}</small></span>
      <span class="list-amt">→</span>
    </button>`).join('')
    : emptyIll('compass', 'No rides yet', 'When you finish a ride its route appears on the map and you can reopen it here.');
}
function openRideHistory(i) {
  const r = S.rides[i]; if (!r) return;
  const has = r.points && r.points.length > 1;
  openModal(`
    <h3>Ride detail</h3>
    <p class="lead">${new Date(r.ts).toLocaleString('en-US', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })} · ${has ? 'route on map' : 'no route recorded'}</p>
    <div class="history-map" id="hmap"></div>
    <div class="summary-grid">
      <div><b>${nf(r.km, 1)}</b><small>km</small></div>
      <div><b>${r.min}</b><small>minutes</small></div>
      <div><b>${nf(r.avg, 1)}</b><small>km/h avg.</small></div>
      <div><b>${nf(r.km / KM_PER_BTCYC, 2)}</b><small>≈ BTCYC</small></div>
      <div><b>${nf(r.km / (r.min / 60 || 1), 1)}</b><small>km per hour</small></div>
      <div><b>${(r.points || []).length}</b><small>route points</small></div>
    </div>
    ${has ? '' : `<div class="balance-warn" style="background:var(--surface-2);color:var(--muted)">This ride was recorded before route tracking; the map opens at the city center.</div>`}
    <button class="btn btn-primary btn-lg" data-modal-close style="width:100%">Close</button>`);
  requestAnimationFrame(() => {
    if (!mapAvailable()) {
      $('#hmap').innerHTML = emptyIll('map', 'Map could not load', 'The map library could not load because you are offline.');
      return;
    }
    try {
      const m = L.map('hmap', { zoomControl: false, attributionControl: true, scrollWheelZoom: false })
        .setView(MAP_CENTER, 13);
      m.attributionControl.setPrefix('');
      const ht = L.tileLayer(tileUrl(), tileOpt()).addTo(m);
      mapSkeleton($('#hmap'), ht);
      if (has) {
        L.polyline(r.points, { color: '#059669', weight: 5, lineJoin: 'round', lineCap: 'round' }).addTo(m);
        m.fitBounds(L.latLngBounds(r.points).pad(.2));
        L.circleMarker(r.points[0], { radius: 6, color: '#fff', weight: 3, fillColor: '#2563EB', fillOpacity: 1 }).addTo(m);
        L.circleMarker(r.points[r.points.length - 1], { radius: 6, color: '#fff', weight: 3, fillColor: '#E11D48', fillOpacity: 1 }).addTo(m);
      }
      window.__hmap = m;
      setTimeout(() => m.invalidateSize(), 90);
    } catch { $('#hmap').innerHTML = emptyIll('map', 'Map could not open', 'An unexpected error occurred.'); }
  });
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-ride]'); if (!b) return;
  openRideHistory(+b.dataset.ride);
});

function renderEvents() {
  $('#chDistBar').style.width = Math.min(100, (S.totalKm / 300) * 100) + '%';
  $('#chDistNote').textContent = `Monthly goal 300 km · you: ${nf(S.totalKm, 1)} km · rank: ${rankOf().idx}.`;
  $('#chQrBar').style.width = Math.min(100, (S.qrCount / 10) * 100) + '%';
  $('#chQrNote').textContent = `Codes scanned: ${S.qrCount} / 10 · today: ${S.todayQr}`;
  $('#festJoin').textContent = S.festJoined ? '✓ Registered' : 'Register now';
  $('#shareBtn').textContent = S.shared ? '✓ Shared' : 'Share now';
  $('#qrCity').disabled = false;

  const { all } = rankOf();
  $('#eventsBoard').innerHTML = all.map((r, i) => `
    <div class="list-row" ${r.me ? 'style="background:var(--primary-tint)"' : ''}>
      <span class="list-ico ${i < 3 ? 'gold' : 'green'}">${i + 1}</span>
      <div class="list-body"><b>${r.n}${r.me ? ' (you)' : ''}</b><small>${nf(r.km, 1)} km</small></div>
      <span class="list-amt ${r.me ? 'plus' : ''}">${i < 3 ? ico(i === 0 ? 'trophy' : 'medal') : ''}</span>
    </div>`).join('');
}

function renderWallet() {
  setNum($('#walletBalance'), S.balance);
  setNum($('#walletEarned'), S.earned);
  setNum($('#walletSpent'), S.spent);
  $('#walletFiat').textContent = money(S.balance);
  $('#wRides').textContent = S.rides.length;
  $('#wKm').textContent = nf(S.totalKm, 1);
  $('#wQr').textContent = S.qrCount;
  $('#walletAddr').textContent = ensureWallet();
  const f = $('#ledgerChips .chip.is-on')?.dataset.lt || 'all';
  const rows = S.ledger.filter(l =>
    f === 'all' ? true :
    f === 'earn' ? l.kind === 'earn' :
    f === 'spend' ? l.kind === 'spend' :
    f === 'transfer' ? (l.kind === 'send' || l.kind === 'receive') : l.kind === 'bonus');
  $('#walletLedger').innerHTML = rows.length ? rows.map(ledgerRow).join('')
    : emptyIll('notebook', 'No activity in this filter', 'Pick a different filter or start a ride to earn BTCYC.');
}
$('#ledgerChips').addEventListener('click', e => {
  const b = e.target.closest('[data-lt]'); if (!b) return;
  $$('#ledgerChips .chip').forEach(c => c.classList.toggle('is-on', c === b));
  renderWallet();
});

/* ---------- WALLET TRANSFER ---------- */
async function copyText(txt, label) {
  try {
    await navigator.clipboard.writeText(txt);
    toast(`${label} copied.`, 'good');
  } catch {
    const ta = document.createElement('textarea');
    ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch {}
    ta.remove();
    toast(ok ? `${label} copied.` : 'Could not copy — select the address manually.', ok ? 'good' : 'bad');
  }
}
$('#copyAddr').addEventListener('click', () => copyText(ensureWallet(), 'Wallet address'));

$('#receiveBtn').addEventListener('click', () => {
  const qr = document.querySelector('#qrVisual svg');
  openModal(`
    <h3>Receive BTCYC</h3>
    <p class="lead">Send your wallet address to the other party; incoming transfers are credited instantly.</p>
    <div class="addr-code">${ensureWallet()}</div>
    ${qr ? `<div class="qr-visual" style="margin:0 auto 16px">${qr.outerHTML}</div>` : ''}
    <button class="btn btn-primary btn-lg" id="receiveCopy" style="width:100%">Copy address</button>
    <div class="secure-note">${ico('lock')} Share your address only with people you trust. Confirmed transfers cannot be reversed.</div>`);
  $('#receiveCopy').addEventListener('click', () => copyText(ensureWallet(), 'Wallet address'));
});

function contactRow(c) {
  return `
    <button type="button" class="contact" data-pick="${c.handle}">
      <span class="contact-ava" style="background:${c.c}">${c.name.split(' ').map(x => x[0]).join('')}</span>
      <span class="contact-body"><b>${c.name}</b><small>${c.handle} · ${c.id}</small></span>
      <span class="contact-check">✓</span>
    </button>`;
}

function openTransfer() {
  openModal(`
    <h3>Transfer to wallet</h3>
    <p class="lead">Pick a recipient from your contacts or paste a wallet code. You have <b>${nf(S.balance)} BTCYC</b>.</p>
    <label class="field"><span>Recipient</span><input id="tTo" placeholder="@user or BCYC-XXXX-XXXX" autocomplete="off" /></label>
    <div class="transfer-contacts" id="tContacts">${CONTACTS.map(contactRow).join('')}</div>
    <div id="tNoMatch"></div>
    <label class="field"><span>Amount · BTCYC</span><input id="tAmt" inputmode="decimal" placeholder="0.00" /></label>
    <div class="amt-chips">
      <button type="button" class="chip" data-amt="1">1</button>
      <button type="button" class="chip" data-amt="5">5</button>
      <button type="button" class="chip" data-amt="10">10</button>
      <button type="button" class="chip" data-amt="max">Max</button>
    </div>
    <label class="field"><span>Note (optional)</span><input id="tNote" maxlength="42" placeholder="e.g. helmet installments" /></label>
    <label class="field"><span>2FA verification</span></label>
    <div class="otp-row" id="tOtp">
      <input maxlength="1" inputmode="numeric" /><input maxlength="1" inputmode="numeric" /><input maxlength="1" inputmode="numeric" /><input maxlength="1" inputmode="numeric" /><input maxlength="1" inputmode="numeric" /><input maxlength="1" inputmode="numeric" />
    </div>
    <div class="transfer-totals">
      <div><small>To send</small><b id="tOut">0.00</b></div>
      <div><small>After sending</small><b id="tLeft">${nf(S.balance)}</b></div>
    </div>
    <button class="btn btn-primary btn-lg" id="tSend" style="width:100%">Send</button>
    <div class="secure-note">${ico('lock')} Transfers complete only after the 2FA code is verified. Demo code: <b>240519</b><br>
      Remaining daily transfer limit: <b>${nf(Math.max(0, TRANSFER_LIMIT - (S.transferredToday || 0)), 0)} BTCYC</b></div>`);

  wireOtp($('#tOtp'));

  const amtIn = $('#tAmt'), outEl = $('#tOut'), leftEl = $('#tLeft');
  const syncTotals = () => {
    const v = Number(String(amtIn.value).replace(',', '.')) || 0;
    outEl.textContent = nf(v);
    const left = S.balance - v;
    leftEl.textContent = nf(Math.max(0, left));
    leftEl.style.color = left < 0 ? 'var(--danger)' : '';
  };
  amtIn.addEventListener('input', syncTotals);

  const toIn = $('#tTo');
  toIn.addEventListener('input', () => {
    const v = toIn.value.trim().toLowerCase();
    $$('#tContacts .contact').forEach(el => el.classList.toggle('is-on', el.dataset.pick === v));
    $('#tNoMatch').innerHTML = '';
  });

  $('#tContacts').addEventListener('click', e => {
    const b = e.target.closest('[data-pick]'); if (!b) return;
    toIn.value = b.dataset.pick;
    $$('#tContacts .contact').forEach(el => el.classList.toggle('is-on', el === b));
    $('#tNoMatch').innerHTML = '';
  });

  $('#modalBody').onclick = e => {                 // prevent stacking on repeated opens
    const a = e.target.closest('[data-amt]'); if (!a) return;
    const v = a.dataset.amt;
    amtIn.value = v === 'max' ? S.balance.toFixed(2) : v;
    syncTotals();
  };

  $('#tSend').addEventListener('click', sendTransfer);
}
$('#sendBtn').addEventListener('click', openTransfer);

function resolveRecipient(raw) {
  if (!raw) return null;
  const q = raw.trim().toLowerCase().replace(/\s+/g, '');
  if (!q) return null;
  if (q === ensureWallet().toLowerCase()) return { self: true, name: 'Your own wallet' };
  const hit = CONTACTS.find(c =>
    c.handle.toLowerCase() === q ||
    c.id.toLowerCase() === q ||
    c.name.toLowerCase().replace(/\s+/g, '') === q);
  return hit || { notFound: true };
}

function sendTransfer() {
  const raw = $('#tTo').value;
  const amt = Number(String($('#tAmt').value).replace(',', '.'));
  const otp = otpValue($('#tOtp'));

  const rec = resolveRecipient(raw);
  if (!rec) return toast('Choose a recipient or enter a wallet address.', 'bad');
  if (rec.self) return toast('You cannot send a transfer to your own wallet.', 'bad');
  if (rec.notFound) {
    $('#tNoMatch').innerHTML = `<div class="no-contact">“${raw.trim()}” wallet not found. Pick a recipient from your contacts.</div>`;
    return toast('Recipient not found.', 'bad');
  }
  if (!amt || amt <= 0) return toast('Enter a valid amount.', 'bad');
  if (amt > S.balance) return toast('Insufficient balance.', 'bad');
  const used = S.transferredToday || 0;
  if (used + amt > TRANSFER_LIMIT)
    return toast(`Daily transfer limit ${TRANSFER_LIMIT} BTCYC — remaining: ${nf(Math.max(0, TRANSFER_LIMIT - used), 0)}`, 'bad');
  if (otp !== '240519') return toast('Incorrect 2FA code. Demo code: 240519', 'bad');

  const trx = 'TRX-' + Math.floor(1000 + Math.random() * 8999);
  const note = $('#tNote').value.trim();
  S.transferredToday = +(used + amt).toFixed(2);
  S.lastTransferDay = dayKey();
  addBalance(-amt, 'send', `Transfer → ${rec.name}${note ? ' · ' + note : ''}`,
             { to: rec.handle, trx });
  notify(`${nf(amt)} BTCYC sent → ${rec.name} · ${trx}`, 'share');
  confetti(18);
  openModal(`
    <div class="ok-badge">✓</div>
    <h3 style="text-align:center">Transfer complete</h3>
    <p class="lead" style="text-align:center">${rec.name} (${rec.handle}) — ${nf(amt)} BTCYC transferred.</p>
    <div class="summary-grid">
      <div><b>${nf(amt)}</b><small>sent</small></div>
      <div><b>${nf(S.balance)}</b><small>remaining balance</small></div>
      <div><b>${trx}</b><small>tx id</small></div>
    </div>
    <div class="row gap" style="gap:10px">
      <button class="btn btn-soft btn-lg" style="flex:1" data-modal-close>Close</button>
      <button class="btn btn-primary btn-lg" style="flex:1" data-nav="wallet" data-modal-close>View ledger</button>
    </div>`);
  toast(`${nf(amt)} BTCYC sent.`, 'good');
}

/* ---------- social feed ---------- */
function openComments(i) {
  const p = FEED[i];
  const list = (S.comments || {})[i] || [];
  openModal(`
    <h3>Comments</h3>
    <p class="lead">${p.n} · ${list.length + p.cm} comments</p>
    <div class="list-card" style="max-height:250px;overflow-y:auto;margin-bottom:14px">
      ${list.length ? list.map(c => `
        <div class="notif-row">
          <span class="contact-ava" style="background:${c.me ? '#059669' : '#2563EB'}">${(c.n || '?').split(' ').map(x => x[0]).join('').slice(0, 2)}</span>
          <div class="list-body"><b>${c.n}${c.me ? ' (you)' : ''}</b><small>${c.t}</small>
            <small>${ago(c.ts)}</small></div>
        </div>`).join('')
      : emptyIll('chat', 'Write the first comment', 'Share your thoughts with the community.')}
    </div>
    <label class="field"><span>Your comment</span><input id="cmInput" maxlength="140" placeholder="What do you think?" /></label>
    <button class="btn btn-primary btn-lg" id="cmSend" style="width:100%">Post</button>`);
  $('#cmSend').onclick = () => {
    const v = $('#cmInput').value.trim();
    if (!v) return toast('Comment cannot be empty.', 'bad');
    S.comments = S.comments || {};
    (S.comments[i] = S.comments[i] || []).unshift({ n: (S.user && S.user.name) || 'You', t: v, ts: Date.now(), me: true });
    S.todaySocial = (S.todaySocial || 0) + 1;                   // daily quest: interaction
    save(); openComments(i); renderHome();
    toast('Comment posted', 'good');
  };
  setTimeout(() => { const el = $('#cmInput'); if (el) el.focus(); }, 80);
}

document.addEventListener('click', e => {
  const like = e.target.closest('[data-like]');
  if (like) {
    S.likes = S.likes || {};
    const i = like.dataset.like;
    S.likes[i] = !S.likes[i];
    if (S.likes[i]) S.todaySocial = (S.todaySocial || 0) + 1;   // daily quest: interaction
    save(); renderHome();
    return;
  }
  const cm = e.target.closest('[data-comments]');
  if (cm) { openComments(cm.dataset.comments); return; }

  const sh = e.target.closest('[data-share-post]');
  if (sh) {
    const data = { title: 'Bitcycling', text: '#Bitcycling — ride and earn BTCYC! 🚴' };
    if (navigator.share) navigator.share(data).catch(() => {});
    toast('Share ready: #Bitcycling', 'good');
    return;
  }
  const fr = e.target.closest('[data-friend]');
  if (fr) {
    S.friends = S.friends || [];
    const h = fr.dataset.friend;
    if (S.friends.includes(h)) return toast('You are already friends.');
    S.friends.push(h); save(); renderFriends(); checkBadges();
    toast('Friend added', 'good');
    notify(`New friend added · ${h}`, 'users');
    return;
  }
  const sc = e.target.closest('[data-session-close]');
  if (sc) {
    S.sessions = (S.sessions || []).filter(x => x.id !== sc.dataset.sessionClose);
    save(); renderSessions();
    toast('Session closed.', 'good');
    notify('A session was closed remotely', 'lock');
    return;
  }
});

/* ---------- account suspension ---------- */
function updateSuspension() {
  const root = $('#suspendRoot'); if (!root) return;
  const on = !!S.suspended && S.violations.length >= 3 && !$('#appScreen').hidden;
  root.hidden = !on;
  if (!on) return;
  $('#suspendReason').textContent =
    `40 km/h above the limit: ${S.violations.length} violations recorded. Your account is suspended; your balance is preserved but you cannot ride or transfer.`;
  $('#suspendList').innerHTML = S.violations.map(v => `
    <div class="list-row">
      <span class="list-ico red">${ico('ban')}</span>
      <div class="list-body"><b>${v.speed} km/h · limit exceeded</b><small>${ago(v.ts)}</small></div>
    </div>`).join('');
}
$('#appealBtn').addEventListener('click', () => {
  const b = $('#appealBtn');
  if (b.disabled) return;
  b.disabled = true; b.textContent = 'Appeal submitted ✓';
  toast('Your appeal has been received — you’ll hear back within 48 hours.', 'good');
  notify('Account suspension appeal received · review in progress', 'shield');
});
$('#suspendDemo').addEventListener('click', () => {
  S.suspended = false; S.violations = []; S.strikesWarned = false; save();
  updateSuspension(); renderAll();
  toast('Demo: account reopened.', 'good');
});

/* ---------- theme / notification / invite links ---------- */
$('#themeBtn').addEventListener('click', () => {
  const next = (S.settings.theme || sysTheme()) === 'dark' ? 'light' : 'dark';
  setTheme(next);
  toast(next === 'dark' ? 'Dark theme' : 'Light theme');
});
$('#themeSeg').addEventListener('click', e => {
  const b = e.target.closest('[data-theme-set]'); if (!b) return;
  setTheme(b.dataset.themeSet);
});
$('#notifBtn').addEventListener('click', openNotifs);
$('#copyInvite').addEventListener('click', () => {
  if (!S.inviteCode) { S.inviteCode = 'BC' + Math.random().toString(36).slice(2, 7).toUpperCase(); save(); }
  copyText(S.inviteCode, 'Invite code');
});
const DEMO_INVITE_CODES = { 'PEDAL5': 2, 'BIKE26': 2, 'CITY26': 2 };
function applyInvite() {
  const v = ($('#friendCode').value || '').trim().toUpperCase();
  if (!v) return toast('Enter an invite code.', 'bad');
  if (v === (S.inviteCode || '').toUpperCase()) return toast('You can’t use your own code.', 'bad');
  if (S.invited) return toast('You already claimed the invite bonus.', 'bad');
  if (!(v in DEMO_INVITE_CODES)) return toast('Invalid invite code. Example: PEDAL5', 'bad');
  S.invited = true; $('#friendCode').value = '';
  addBalance(DEMO_INVITE_CODES[v], 'bonus', `Invite bonus · ${v}`);
  confetti(20); checkBadges();
  toast('+2 BTCYC invite bonus credited to your account!', 'good');
}
$('#applyFriendCode').addEventListener('click', applyInvite);
$('#friendCode').addEventListener('keydown', e => { if (e.key === 'Enter') applyInvite(); });

/* ---------- profile: helpers ---------- */
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TRANSFER_LIMIT = 100;
function last7() {
  const labels = [], km = []; let max = .5, total = 0;
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5), key = dayKey(d);
    const rideKm = S.rides.filter(r => dayKey(new Date(r.ts)) === key).reduce((a, r) => a + r.km, 0);
    const v = Math.max(rideKm, key === dayKey() ? S.todayKm : 0);
    labels.push(DAY_NAMES[d.getDay()]); km.push(v);
    max = Math.max(max, v); total += v;
  }
  return { labels, km, max, total };
}
function renderCharts() {
  const w = last7();
  $('#chartWeekTotal').textContent = `${nf(w.total, 1)} km`;
  $('#chartWeek').innerHTML = w.km.map((v, i) => `
    <div class="bar-col ${v < 0.05 ? 'zero' : ''}" title="${nf(v, 1)} km">
      <i style="height:${Math.max(4, Math.round((v / w.max) * 82))}px;animation-delay:${i * 55}ms"></i>
      <small>${w.labels[i]}</small>
    </div>`).join('');

  const vals = []; let gmax = 1, gtotal = 0;
  for (let i = 29; i >= 0; i--) {
    const key = dayKey(new Date(Date.now() - i * 864e5));
    const v = S.ledger.filter(l => l.amount > 0 && dayKey(new Date(l.ts)) === key).reduce((a, l) => a + l.amount, 0);
    vals.push(v); gmax = Math.max(gmax, v); gtotal += v;
  }
  $('#chartEarnTotal').textContent = `${nf(gtotal, 2)} BTCYC`;
  const W = 300, H = 110;
  const pts = vals.map((v, i) => [(i / 29) * W, H - 8 - (v / gmax) * (H - 24)]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  $('#chartEarn').innerHTML = `
    <defs><linearGradient id="earnGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(16,185,129,.4)"/><stop offset="100%" stop-color="rgba(16,185,129,0)"/>
    </linearGradient></defs>
    <path class="area" d="${line} L${W},${H} L0,${H} Z"/>
    <path class="line" d="${line}"/>
    <circle class="dot" cx="${pts[29][0].toFixed(1)}" cy="${pts[29][1].toFixed(1)}" r="4.5"/>`;
  const d30 = new Date(Date.now() - 29 * 864e5);
  $('#chartEarnAxis').innerHTML = `<span>${d30.getDate()}.${d30.getMonth() + 1}</span><span>today</span>`;
}
function renderBadges() {
  $('#badgeGrid').innerHTML = BADGES.map(b => {
    const on = S.badges.includes(b.id);
    return `<div class="badge-item ${on ? 'on' : 'off'}"><span>${ico(b.ico)}</span><b>${b.n}</b><small>${b.d}</small></div>`;
  }).join('');
  $('#badgeCount').textContent = `${S.badges.length} / ${BADGES.length}`;
}
function renderStreakCard() {
  const streak = currentStreak(), w = last7(), goal = 100;
  const days = new Set(S.rideDays || []);
  let strip = '';
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5), on = days.has(dayKey(d));
    strip += `<div class="streak-day ${on ? 'on' : ''} ${i === 0 ? 'today' : ''}"><span>${DAY_NAMES[d.getDay()]}</span><b>${on ? '✓' : '·'}</b></div>`;
  }
  $('#streakCard').innerHTML = `
    <div class="streak-top">
      <div><b>Daily streak · ${streak} days</b><small>Ride every day to grow your streak — streak badge at 7 days</small></div>
      <span class="streak-flame">${ico('flame')}</span>
    </div>
    <div class="streak-days">${strip}</div>
    <div class="streak-goal">
      <div class="bar"><div class="bar-fill" style="width:${Math.min(100, (w.total / goal) * 100)}%"></div></div>
      <p><span>Weekly goal ${goal} km</span><span>${nf(w.total, 1)} / ${goal} km</span></p>
    </div>`;
}
function renderSessions() {
  if (!S.sessions) S.sessions = defaultSessions();
  $('#sessionList').innerHTML = S.sessions.map(s => `
    <div class="list-row">
      <span class="list-ico ${s.current ? 'green' : 'blue'}">${ico(s.current ? 'phone' : 'laptop')}</span>
      <div class="list-body"><b>${s.dev}${s.current ? ' · active now' : ''}</b>
        <small>${s.loc} · last sign-in ${ago(s.ts)}</small></div>
      ${s.current ? '<span class="pill pill-green">This device</span>'
                  : `<button class="row-act" data-session-close="${s.id}">Close</button>`}
    </div>`).join('');
}
function renderFriends() {
  $('#friendList').innerHTML = CONTACTS.map(c => {
    const on = (S.friends || []).includes(c.handle);
    return `<div class="list-row">
      <span class="contact-ava" style="background:${c.c}">${c.name.split(' ').map(x => x[0]).join('')}</span>
      <div class="list-body"><b>${c.name}</b><small>${c.handle} · ${c.id}</small></div>
      <button class="friend-act ${on ? 'on' : ''}" data-friend="${c.handle}">${on ? 'Friend ✓' : 'Add'}</button>
    </div>`;
  }).join('');
}

function renderProfile() {
  const u = S.user || {};
  $('#profileAvatar').innerHTML = u.selfie ? `<img src="${u.selfie}" alt="" />` : initials(u.name, u.surname);
  $('#profileName').textContent = [u.name, u.surname].filter(Boolean).join(' ') || 'Bitcycling User';
  $('#profileEmail').textContent = u.email || '—';
  $('#profilePhone').textContent = u.phone || '—';
  $('#pill2fa').textContent = S.settings.twoFA ? '2FA on' : '2FA off';
  $('#pill2fa').className = 'pill ' + (S.settings.twoFA ? 'pill-blue' : 'pill-green');
  $('#toggle2fa').checked = !!S.settings.twoFA;
  $('#toggleData').checked = !!S.settings.dataShare;
  $('#toggleNotify').checked = !!S.settings.notify;

  const v = S.violations.length;
  $('#violationText').textContent = v ? `${v} records · latest ${ago(S.violations[0].ts)} (${S.violations[0].speed} km/h)` : 'No violations — clean';
  $('#violationPill').textContent = v ? `${v} violations` : 'Clean';
  $('#violationPill').className = 'pill ' + (v ? 'pill-blue' : 'pill-green');

  setNum($('#pTotalKm'), S.totalKm, x => nf(x, 1));
  setNum($('#pTotalEarn'), S.earned);
  $('#pTotalTime').textContent = Math.max(1, Math.round(S.totalMinutes / 60)) + 'h';
  $('#pRank').textContent = '#' + rankOf().idx;

  if (!S.inviteCode) { S.inviteCode = 'BC' + Math.random().toString(36).slice(2, 7).toUpperCase(); save(); }
  $('#inviteCode').textContent = S.inviteCode;
  $('#transferLeft').textContent = `${nf(Math.max(0, TRANSFER_LIMIT - S.transferredToday), 0)} / ${TRANSFER_LIMIT}`;
  $$('#themeSeg button').forEach(b => b.classList.toggle('is-on', b.dataset.themeSet === S.settings.theme));

  renderSessions(); renderCharts(); renderBadges(); renderStreakCard(); renderFriends();
  checkBadges();
}

function renderAll() {
  if ($('#appScreen').hidden) return;
  renderHome(); renderRide(); renderMarket(); renderEvents(); renderWallet(); renderProfile();
  renderRideHistory(); renderQuests(); renderNotifDot(); updateSuspension();
  syncSourceUI();
  hydrateIcons();
}

/* ---------- periodic update ---------- */
setInterval(() => { if (!$('#appScreen').hidden) renderAll(); }, 60000);

/* ---------- PWA ---------- */
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

/* ---------- startup ---------- */
applyTheme();
buildGauge();
hydrateIcons();
$('#views').addEventListener('scroll', () => {
  $('.topbar').classList.toggle('is-scrolled', $('#views').scrollTop > 8);
}, { passive: true });
setStep(1);
syncSourceUI();
renderRide();
renderNotifDot();
updateSuspension();
$('#rideToggle').textContent = S.ride && S.ride.km > 0 ? 'Start new ride' : 'Start ride';
if (S.user) enterApp();
})();
