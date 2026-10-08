/* ============================================================
   Bitcycling — landing page & user panel (web)
   Read-only: data is read from localStorage['bitcycling.v1'],
   written only when "no demo data → create" applies.
   ============================================================ */
const KEY = 'bitcycling.v1';
const BTCYC_EUR = 0.8;
const DAILY_KM = 100;
const LIMIT_SPEED = 40;
const DEMO_2FA = '240519';

const nf = (n, d = 2) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const money = n => `${nf(n * BTCYC_EUR)} €`;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const pad = n => String(n).padStart(2, '0');
const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function ago(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`;
  const d = Math.floor(s / 86400);
  if (d < 7) return `${d} days ago`;
  return new Date(ts).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}
const dateStr = ts => new Date(ts).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: '2-digit' });
function fmtTime(sec) {
  const m = Math.floor(sec / 60), h = Math.floor(m / 60);
  return h ? `${h} hr ${m % 60} min` : `${m} min`;
}
const initials = (a = '', b = '') => ((a[0] || 'B') + (b[0] || '')).toUpperCase();

/* ---------- SVG icon set (same as the PWA) ---------- */
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
const ico = (name, cls = '') => {
  if (name == null) return '';
  const key = ICONS[name] ? name : EMOJI_ICONS[String(name).replace(/\uFE0F/g, '')];
  const p = key && ICONS[key];
  if (!p) return esc(name);
  return `<svg class="ico${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
};
function hydrateIcons(root) {
  (root || document).querySelectorAll('[data-ico]:not([data-ico-done])').forEach(el => {
    el.dataset.icoDone = '1';
    el.insertAdjacentHTML('afterbegin', ico(el.dataset.ico));
  });
}

/* ---------- state ---------- */
const defaults = () => ({
  user: null, balance: 0, earned: 0, spent: 0,
  todayKm: 0, todayEligibleKm: 0, creditedToday: 0, todayEarn: 0, todayQr: 0, todaySocial: 0,
  totalKm: 0, totalMinutes: 0, qrCount: 0, streak: 0,
  ledger: [], orders: [], rides: [], violations: [], notifs: [], friends: [], rideDays: [],
  badges: [], questsDone: {}, sessions: [], settings: {}, walletId: null, inviteCode: null,
  festJoined: false, suspended: false, transferredToday: 0
});
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return Object.assign(defaults(), JSON.parse(raw));
  } catch { return null; }
}
let S = load();
const hasAccount = () => !!(S && S.user && S.user.email);

/* ---------- level / quest / badge (same rules as the PWA) ---------- */
const LEVELS = [
  [0, 'Rookie'], [100, 'Pedaler'], [250, 'City Rider'], [500, 'Route Master'],
  [1000, 'Tour Legend'], [1600, 'Summit Rider'], [2400, 'Legendary Rider'], [3500, 'Bitcycling Ambassador']
];
const xpTotal = () => Math.round(S.totalKm || 0) + (S.qrCount || 0) * 10 + (S.rides || []).length * 20 +
  (S.badges || []).length * 25 + Object.keys(S.questsDone || {}).length * 30;
function levelInfo() {
  const xp = xpTotal();
  let i = 0;
  for (let k = 0; k < LEVELS.length; k++) if (xp >= LEVELS[k][0]) i = k;
  const cur = LEVELS[i], next = LEVELS[i + 1] || null;
  const pct = next ? Math.min(100, ((xp - cur[0]) / (next[0] - cur[0])) * 100) : 100;
  return { xp, idx: i + 1, name: cur[1], next, pct };
}
const weekKey = (d = new Date()) => {
  const x = new Date(d); x.setHours(12, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return dayKey(x);
};
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function last7() {
  const labels = [], km = []; let max = .5, total = 0;
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5), key = dayKey(d);
    const rideKm = (S.rides || []).filter(r => dayKey(new Date(r.ts)) === key).reduce((a, r) => a + r.km, 0);
    const v = Math.max(rideKm, key === dayKey() ? (S.todayKm || 0) : 0);
    labels.push(DAY_NAMES[d.getDay()]); km.push(v);
    max = Math.max(max, v); total += v;
  }
  return { labels, km, max, total };
}
const QUESTS = [
  { id: 'd_km', ico: 'bike', t: 'Pedal 10 km', type: 'daily', target: 10, unit: 'km', reward: .5, prog: () => S.todayKm || 0 },
  { id: 'd_qr', ico: 'qr', t: 'Scan 1 QR code', type: 'daily', target: 1, unit: 'code', reward: .3, prog: () => S.todayQr || 0 },
  { id: 'd_soc', ico: 'chat', t: 'Interact in the feed', type: 'daily', target: 1, unit: 'interaction', reward: .2, prog: () => S.todaySocial || 0 },
  { id: 'w_km', ico: 'route', t: 'Ride 50 km', type: 'weekly', target: 50, unit: 'km', reward: 2, prog: () => last7().total },
  { id: 'w_ride', ico: 'flag', t: 'Complete 3 rides', type: 'weekly', target: 3, unit: 'ride', reward: 1.5, prog: () => (S.rides || []).filter(r => Date.now() - r.ts < 7 * 864e5).length }
];
const questKey = q => q.id + '|' + (q.type === 'daily' ? dayKey() : weekKey());
const BADGES = [
  { id: 'first', ico: 'bike', n: 'First pedal', d: 'Finish your first ride' },
  { id: 'km50', ico: 'route', n: '50 km', d: '50 km pedaled in total' },
  { id: 'km250', ico: 'mountain', n: '250 km', d: '250 km in total' },
  { id: 'km1000', ico: 'globe', n: '1,000 km', d: 'Legendary distance' },
  { id: 'earn1', ico: 'coin', n: 'First BTCYC', d: 'Your first earnings' },
  { id: 'earn25', ico: 'money', n: '25 BTCYC', d: 'Fill your wallet' },
  { id: 'qr10', ico: 'qr', n: 'QR hunter', d: 'Scan 10 codes' },
  { id: 'streak7', ico: 'flame', n: '7-day streak', d: 'Ride 7 days in a row' },
  { id: 'fest', ico: 'flag', n: 'Bike Fest', d: 'Register for Bike Fest' },
  { id: 'social', ico: 'users', n: 'Social', d: 'Add a friend' },
  { id: 'quest5', ico: 'target', n: 'Quest master', d: 'Complete 5 quests' }
];

/* ---------- CALCULATOR ---------- */
const CALC_PRODUCTS = [
  { n: 'Electrolyte Water Bottle', p: 5 }, { n: 'Energy Gel · 12-pack', p: 6 },
  { n: 'Mini Air Pump', p: 6 }, { n: 'Gel-Pad Gloves', p: 7 },
  { n: 'Front + Rear Light Set', p: 9 }, { n: 'Breathable Jersey', p: 9 },
  { n: 'Aero Sport Sunglasses', p: 11 }, { n: 'Vento Aero Helmet', p: 14 },
  { n: 'Whey Protein 1kg', p: 18 }, { n: 'Windproof Jacket', p: 22 },
  { n: 'GPS Computer', p: 38 }, { n: 'Disc Wheelset', p: 95 },
  { n: 'Carbon Road Bike', p: 320 }, { n: 'Electric City Bike', p: 480 }
];
function calc() {
  const raw = Math.max(0, +$('#calcKm').value || 0);   // raw value entered by the user
  const weekly = clamp(Math.round(raw / 5) * 5, 0, 700); // weekly upper bound that can be credited
  $('#calcRange').value = weekly;
  const weekBtc = weekly / 20;
  const monthBtc = weekBtc * 4.33;
  const dayKm = raw / 7;

  $('#calcWeekBtc').textContent = nf(weekBtc);
  $('#calcMonthBtc').textContent = nf(monthBtc);
  $('#calcMonthEur').textContent = nf(monthBtc * BTCYC_EUR);
  $('#calcDayKm').textContent = nf(dayKm, 1);

  const over = raw > 700;
  const note = $('#calcNote');
  note.classList.toggle('warn', over);
  $('#calcNoteTxt').textContent = over
    ? `Average ${nf(dayKm, 1)} km a day — you're above the ${DAILY_KM} km daily cap. ${nf(raw - 700, 0)} km a week won't turn into credit; drop to 700 km a week and you'll earn the same.`
    : `You're in the clear: at ${nf(dayKm, 1)} km a day you earn ${nf(weekBtc)} BTCYC a week and ${nf(monthBtc)} BTCYC a month.`;

  $('#affordChips').innerHTML = CALC_PRODUCTS.map(p =>
    `<span class="${monthBtc >= p.p ? 'ok' : ''}">${p.n} <b>${p.p}</b></span>`).join('');
}

/* ---------- demo data (only when there is no account at all) ---------- */
function genPath(n, lat0, lon0, heading) {
  const pts = [[+lat0.toFixed(6), +lon0.toFixed(6)]];
  let h = heading;
  for (let i = 1; i < n; i++) {
    h += (Math.random() - .5) * .7;
    const last = pts[pts.length - 1];
    pts.push([+(+last[0] + Math.cos(h) * .0006).toFixed(6), +(last[1] + Math.sin(h) * .0008).toFixed(6)]);
  }
  return pts;
}
function seedDemo() {
  const now = Date.now(), H = 36e5, D = 864e5;
  S = defaults();
  S.user = {
    name: 'Alex', surname: 'Morgan', email: 'alex@bitcycling.app',
    phone: '+90 532 111 22 33', selfie: null, twoFA: true, paid: true, since: '1.3.2026'
  };
  S.balance = 13.75; S.earned = 22.5; S.spent = 8.75;
  S.walletId = 'BCYC-4F18-2A77'; S.inviteCode = 'ALEX7';
  S.todayKm = 12.4; S.todayEligibleKm = 12.4; S.todayQr = 1;
  S.creditedToday = 10; S.todayEarn = 0.5;
  S.totalKm = 62.4; S.totalMinutes = 412; S.qrCount = 7;
  S.rideDays = [dayKey(new Date(now - 2 * D)), dayKey(new Date(now - D)), dayKey()];
  S.streak = 3;
  S.badges = ['first', 'km50', 'fest', 'qr10'];
  S.questsDone = { ['d_qr|' + dayKey()]: now - 2 * H };
  S.festJoined = true; S.friends = ['@ellak'];
  S.ledger = [
    { id: 1, ts: now - 2 * H, kind: 'earn', amount: .5, note: 'Ride credit · 10 km', km: 10 },
    { id: 2, ts: now - 5 * H, kind: 'bonus', amount: .3, note: 'QR bonus · Downtown' },
    { id: 3, ts: now - D, kind: 'earn', amount: 1, note: 'Ride credit · 20 km', km: 20 },
    { id: 4, ts: now - 2 * D, kind: 'spend', amount: -6.25, note: 'Trade · Energy Gel · 12-pack' },
    { id: 5, ts: now - 4 * D, kind: 'send', amount: -2.5, note: 'Transfer → Sara Nolan', to: '@saran', trx: 'TRX-8842' },
    { id: 6, ts: now - 6 * D, kind: 'bonus', amount: 5, note: 'Bike Fest volunteer bonus' }
  ];
  S.rides = [
    { ts: now - 26 * H, km: 21.2, min: 74, avg: 17.2, points: genPath(58, 40.9682, 29.0262, 1.1) },
    { ts: now - 3 * D, km: 14.6, min: 52, avg: 16.8, points: genPath(44, 40.9801, 29.0410, 2.4) },
    { ts: now - 5 * D, km: 18.9, min: 66, avg: 17.2, points: genPath(52, 40.9560, 29.0120, .4) },
    { ts: now - 7 * D, km: 7.7, min: 26, avg: 17.8, points: genPath(26, 40.9900, 29.0600, 3.3) }
  ];
  S.orders = [
    { id: 'BC-2041', name: 'Energy Gel · 12-pack', store: 'FuelLab', btc: 6.25, icon: 'zap', status: 'Shipped', ts: now - 3 * D }
  ];
  S.notifs = [
    { id: 1, ts: now - 2 * H, text: '+0.50 BTCYC · Ride credit · 10 km', icon: 'bike', read: false },
    { id: 2, ts: now - 5 * H, text: '+0.30 BTCYC · QR bonus · Downtown', icon: 'qr', read: false },
    { id: 3, ts: now - 2 * D, text: "You made the top 10 in this month's ranking", icon: 'trophy', read: true }
  ];
  S.sessions = [
    { id: 's1', dev: 'iPhone · Safari', loc: 'Istanbul', ts: now - 4 * 6e4, current: true },
    { id: 's2', dev: 'Windows · Chrome', loc: 'Izmir', ts: now - 5 * H, current: false },
    { id: 's3', dev: 'Android · Chrome', loc: 'Ankara', ts: now - 3 * D, current: false }
  ];
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { }
}

/* ---------- PANEL RENDER ---------- */
function row(icoName, color, title, sub, amt, amtCls = '') {
  return `<div class="row"><span class="row-ico ${color}">${ico(icoName)}</span>
    <span class="row-body"><b>${title}</b><small>${sub}</small></span>
    ${amt ? `<span class="row-amt ${amtCls}">${amt}</span>` : ''}</div>`;
}
const ledgerIcon = k => k === 'spend' ? ['bag', 'pink'] : k === 'bonus' ? ['gift', 'gold']
  : k === 'send' ? ['share', 'red'] : k === 'receive' ? ['arrowDownLeft', 'green'] : ['bike', 'green'];

function renderKpis() {
  const kpis = [
    ['coin', 'gold', nf(S.balance) + ' <i>BTCYC</i>', 'balance ≈ ' + money(S.balance)],
    ['money', 'gold', nf(S.earned) + ' <i>BTCYC</i>', 'total earnings'],
    ['route', '', nf(S.todayKm, 1) + ' <i>km</i>', 'today · cap 100'],
    ['bike', 'blue', nf(S.totalKm, 1) + ' <i>km</i>', 'total distance'],
    ['timer', 'pink', String((S.rides || []).length) + ' <i>rides</i>', fmtTime(S.totalMinutes * 60) + ' pedaling'],
    ['medal', 'gold', `${(S.badges || []).length}<i>/${BADGES.length}</i>`, 'badges · level ' + levelInfo().idx]
  ];
  $('#kpis').innerHTML = kpis.map(([ic, cls, val, lab]) =>
    `<div class="kpi ${cls}"><span class="kpi-ico">${ico(ic)}</span><b>${val}</b><small>${lab}</small></div>`).join('');
}
function renderLevel() {
  const L = levelInfo();
  $('#lvlOrb').textContent = L.idx;
  $('#lvlName').textContent = L.name;
  $('#lvlMeta').textContent = L.next ? `Level ${L.idx} · next ${L.next[0]} XP` : 'Level 8 · highest level';
  $('#lvlXp').textContent = `${L.xp} XP`;
  $('#lvlBar').style.width = L.pct.toFixed(1) + '%';
  $('#lvlNote1').textContent = L.next ? `Next: ${L.next[1]}` : "You've reached the top";
  $('#lvlNote2').textContent = L.next ? `${L.next[0] - L.xp} XP to go` : 'Highest level';
  $('#lvlTag').textContent = `★ Lv.${L.idx} ${L.name}`;
  $('#pLvl').textContent = `★ Lv.${L.idx} ${L.name}`;
}
function renderDay() {
  const km = S.todayKm || 0, pct = Math.min(100, (km / DAILY_KM) * 100);
  const earn = S.todayEarn != null ? S.todayEarn : (S.creditedToday || 0) / 20;
  $('#dayOrb').textContent = nf(km, 0);
  $('#dayTxt').textContent = `${nf(km, 1)} km / ${DAILY_KM} km`;
  $('#daySub').textContent = `Remaining: ${nf(Math.max(0, DAILY_KM - km), 1)} km = ${nf(Math.max(0, DAILY_KM - km) / 20)} BTCYC`;
  $('#dayBar').style.width = pct.toFixed(1) + '%';
  $('#dayEarn').textContent = `${nf(earn)} BTCYC`;
  $('#dayNote1').textContent = "Today's credit";
  $('#dayNote2').textContent = km >= DAILY_KM ? 'Daily cap reached' : `Speed limit ${LIMIT_SPEED} km/h`;
}
function renderCharts() {
  const w = last7();
  $('#chartWeekTotal').textContent = `${nf(w.total, 1)} km`;
  $('#chartWeekFrom').textContent = new Date(Date.now() - 6 * 864e5).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  $('#chartWeek').innerHTML = w.km.map((v, i) => `
    <div class="bar-col ${v < .05 ? 'zero' : ''}" title="${nf(v, 1)} km">
      <i style="height:${Math.max(5, Math.round((v / w.max) * 84))}px;animation-delay:${i * 55}ms"></i>
      <small>${w.labels[i]}</small></div>`).join('');

  const vals = []; let gmax = 1, gtotal = 0;
  for (let i = 29; i >= 0; i--) {
    const key = dayKey(new Date(Date.now() - i * 864e5));
    const v = (S.ledger || []).filter(l => l.amount > 0 && dayKey(new Date(l.ts)) === key).reduce((a, l) => a + l.amount, 0);
    vals.push(v); gmax = Math.max(gmax, v); gtotal += v;
  }
  $('#chartEarnTotal').textContent = `${nf(gtotal)} BTCYC`;
  const W = 300, H = 110;
  const pts = vals.map((v, i) => [(i / 29) * W, H - 8 - (v / gmax) * (H - 24)]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  $('#chartEarn').innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-label="30-day earnings chart">
      <defs><linearGradient id="webEarnGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgba(16,185,129,.38)"/><stop offset="100%" stop-color="rgba(16,185,129,0)"/>
      </linearGradient></defs>
      <path class="area" d="${line} L${W},${H} L0,${H} Z"/>
      <path class="line" d="${line}"/>
      <circle class="dot" cx="${pts[29][0].toFixed(1)}" cy="${pts[29][1].toFixed(1)}" r="4.5"/>
    </svg>`;
  $('#chartEarnAxis').textContent = new Date(Date.now() - 29 * 864e5).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}
function renderLedger() {
  const list = (S.ledger || []).slice(0, 7);
  $('#ledgerCount').textContent = `${(S.ledger || []).length} records`;
  $('#pLedger').innerHTML = list.length ? list.map(l => {
    const [ic, col] = ledgerIcon(l.kind);
    const sign = l.amount > 0 ? '+' : '';
    return row(ic, col, esc(l.note), dateStr(l.ts) + ' · ' + ago(l.ts),
      `${sign}${nf(l.amount)}`, l.amount > 0 ? 'plus' : 'minus');
  }).join('') : `<div class="empty">No activity yet. Once you start riding, every 20 km shows up here.</div>`;
}
function renderRides() {
  const list = (S.rides || []).slice(0, 6);
  $('#rideCount').textContent = `${(S.rides || []).length} rides`;
  $('#pRides').innerHTML = list.length ? list.map(r => `
    <div class="row"><span class="row-ico green">${ico('bike')}</span>
      <span class="row-body"><b>${nf(r.km, 1)} km · ${r.min || Math.round(r.seconds / 60) || 0} min</b>
        <small>${dateStr(r.ts)} · avg ${nf(r.avg || 0, 1)} km/h</small></span>
      <span class="row-amt plus">${nf(r.km / 20, 2)}<small>BTCYC</small></span></div>`).join('')
    : `<div class="empty">No rides yet. Start a ride in the app; the route will be archived here.</div>`;
}
function renderQuests() {
  const claimed = QUESTS.filter(q => (S.questsDone || {})[questKey(q)]).length;
  $('#questCount').textContent = `${claimed}/${QUESTS.length} claimed`;
  $('#pQuests').innerHTML = QUESTS.map(q => {
    const p = Math.max(0, q.prog()), done = !!(S.questsDone || {})[questKey(q)];
    const ready = !done && p >= q.target;
    const pct = Math.min(100, (p / q.target) * 100);
    const shown = q.unit === 'km' ? nf(p, 1) : p;
    const target = q.unit === 'km' ? nf(q.target, 0) : q.target;
    return `<div class="q-row ${done ? 'is-done' : ''}">
      <span class="q-ico">${ico(q.ico)}</span>
      <span class="q-body"><b>${q.t}<span class="q-tag ${q.type === 'weekly' ? 'w' : ''}">${q.type === 'daily' ? 'daily' : 'weekly'}</span></b>
        <span class="q-sub">${done ? 'Completed · reward claimed' : `${shown} / ${target} ${q.unit}`} · reward ${nf(q.reward)} BTCYC</span>
        <span class="q-bar"><i style="width:${pct}%"></i></span></span>
      <span class="q-state ${done ? 'done' : ready ? 'claim' : ''}">${done ? '✓ Claimed' : ready ? 'Ready' : `${Math.round(pct)}%`}</span></div>`;
  }).join('');
}
function renderBadges() {
  $('#badgeCount').textContent = `${(S.badges || []).length}/${BADGES.length}`;
  $('#pBadges').innerHTML = BADGES.map(b => {
    const on = (S.badges || []).includes(b.id);
    return `<div class="badge ${on ? 'on' : ''}"><span>${ico(b.ico)}</span><b>${b.n}</b><small>${on ? 'Earned' : b.d}</small></div>`;
  }).join('');
}
function renderOrders() {
  const list = (S.orders || []).slice(0, 5);
  $('#orderCount').textContent = String((S.orders || []).length);
  $('#pOrders').innerHTML = list.length ? list.map(o => `
    <div class="row"><span class="row-ico gold">${ico(o.icon || o.emoji || 'bag')}</span>
      <span class="row-body"><b>${esc(o.name)}</b><small>${esc(o.store)} · ${esc(o.status)} · ${dateStr(o.ts)}</small></span>
      <span class="row-amt gold">${nf(o.btc)}<small>BTCYC</small></span></div>`).join('')
    : `<div class="empty">No orders yet. Trade for a product you like in the market using BTCYC.</div>`;
}
function renderNotifs() {
  const list = (S.notifs || []).slice(0, 5);
  $('#notifCount').textContent = `${(S.notifs || []).filter(n => !n.read).length} unread`;
  $('#pNotifs').innerHTML = list.length ? list.map(n => {
    const col = n.icon === 'ban' ? 'red' : (n.icon === 'medal' || n.icon === 'gift') ? 'gold' : 'green';
    return row(n.icon, col, esc(n.text), ago(n.ts), '');
  }).join('') : `<div class="empty">No notifications.</div>`;
}
function renderProfile() {
  const u = S.user || {};
  const av = u.selfie ? `<img src="${u.selfie}" alt="" />` : initials(u.name, u.surname);
  $('#pName').textContent = `${u.name || ''} ${u.surname || ''}`.trim() || 'User';
  $('#pAvatar').innerHTML = av;
  $('#profAvatar').innerHTML = av;
  $('#profName').textContent = `${u.name || ''} ${u.surname || ''}`.trim();
  $('#profMeta').textContent = `${u.email || '—'} · member since: ${u.since || '—'}`;
  $('#pHello').textContent = `Hello, ${u.name || 'rider'}`;
  $('#pSub').textContent = `Your account summary: ${nf(S.totalKm, 1)} km pedaled, ${nf(S.earned)} BTCYC total earnings.`;
  $('#pWallet').textContent = S.walletId || 'BCYC-????-????';
  $('#pWalletEur').textContent = `${nf(S.balance)} BTCYC · ≈ ${money(S.balance)}`;

  const cells = [
    ['Full name', `${u.name || ''} ${u.surname || ''}`.trim(), ''],
    ['Email', u.email || '—', ''],
    ['Phone', u.phone || '—', 'ok'],
    ['Member since', u.since || '—', ''],
    ['Wallet ID', S.walletId || '—', 'gold'],
    ['Invite code', S.inviteCode || '—', 'gold'],
    ['Total earnings', `${nf(S.earned)} BTCYC ≈ ${money(S.earned)}`, 'ok'],
    ['Spent', `${nf(S.spent)} BTCYC`, ''],
    ['QR bonus', `${S.qrCount || 0} codes scanned`, '']
  ];
  $('#pProfGrid').innerHTML = cells.map(([k, v, cls]) =>
    `<div class="prof-cell"><small>${k}</small><b class="${cls}">${esc(v)}</b></div>`).join('');

  const tags = [
    ['shield', u.twoFA ? '2FA on' : '2FA off', u.twoFA ? '' : 'red'],
    ['phone', 'Phone verified', 'blue'],
    ['money', u.paid ? '€1 access paid' : 'Payment pending', u.paid ? 'gold' : 'red'],
    ['medal', `${(S.badges || []).length} badges`, 'gold'],
    ['flame', `${S.streak || 0}-day streak`, ''],
    ['ban', `${(S.violations || []).length} speed violations`, (S.violations || []).length ? 'red' : 'blue'],
    S.suspended ? ['ban', 'Account suspended', 'red'] : ['shield', 'Account active', '']
  ];
  $('#pProfTags').innerHTML = tags.map(([ic, t, cls]) =>
    `<span class="tag-pill ${cls}">${ico(ic)} ${t}</span>`).join('');
}
function renderSecurity() {
  const sess = S.sessions || [];
  $('#secTag').textContent = S.suspended ? 'Suspended' : 'Secure';
  $('#pSessions').innerHTML = sess.length ? sess.map(s => `
    <div class="row"><span class="row-ico ${s.current ? 'green' : 'blue'}">${ico(/iPhone|Android/.test(s.dev) ? 'phone' : 'laptop')}</span>
      <span class="row-body"><b>${esc(s.dev)}${s.current ? ' · this device' : ''}</b><small>${esc(s.loc)} · ${ago(s.ts)}</small></span>
      ${s.current ? '<span class="row-amt plus">active</span>' : ''}</div>`).join('')
    : `<div class="empty">No session records.</div>`;

  const v = S.violations || [];
  $('#pViol').innerHTML = v.length ? v.slice(0, 5).map(x => `
    <div class="row"><span class="row-ico red">${ico('ban')}</span>
      <span class="row-body"><b>${x.speed} km/h · limit exceeded</b><small>${ago(x.ts)} · record ${v.length}/3</small></span></div>`).join('')
    : `<div class="empty">No limit violations — clean riding under ${LIMIT_SPEED} km/h.</div>`;
}
function renderPanel() {
  renderKpis(); renderLevel(); renderDay(); renderCharts();
  renderLedger(); renderRides(); renderQuests(); renderBadges();
  renderOrders(); renderNotifs(); renderProfile(); renderSecurity();
  hydrateIcons();
}

/* ---------- login / session ---------- */
function msg(text, kind) {
  const el = $('#liMsg');
  el.className = 'form-msg show ' + kind;
  el.innerHTML = ico(kind === 'err' ? 'ban' : 'shield') + `<span>${text}</span>`;
}
function wireOtp() {
  const ins = $$('#liOtp input');
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
const otpValue = () => $$('#liOtp input').map(i => i.value).join('');

function tryLogin() {
  const email = $('#liEmail').value.trim().toLowerCase();
  const code = otpValue();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return msg('Enter a valid email address.', 'err');
  if (!hasAccount()) return msg("There's no account saved in this browser. Sign up in the app or explore the panel with demo data.", 'err');
  if (S.user.email.trim().toLowerCase() !== email)
    return msg(`No user found with this email. Saved address: ${esc(S.user.email)}`, 'err');
  if (code !== DEMO_2FA) return msg(`Incorrect 2FA code. Demo code: ${DEMO_2FA}`, 'err');
  msg('Verification successful, opening your panel…', 'ok');
  try { sessionStorage.setItem('bc.panel', S.user.email.toLowerCase()); } catch { }
  showPanel();
}
function showPanel() {
  $('#landing').hidden = true;
  $('#panel').hidden = false;
  document.title = 'Panel · Bitcycling';
  renderPanel();
  window.scrollTo(0, 0);
}
function logout() {
  try { sessionStorage.removeItem('bc.panel'); } catch { }
  $('#panel').hidden = true;
  $('#landing').hidden = false;
  document.title = 'Bitcycling — Pedal to Earn · Showcase & User Panel';
  $('#liMsg').className = 'form-msg';
  renderPhoneMock();
  window.scrollTo(0, 0);
}

/* ---------- phone mock: live copy of the app home screen ---------- */
function streakMock() {
  const days = new Set((S && S.rideDays) || []);
  let d = Date.now();
  if (!days.has(dayKey(new Date(d)))) d -= 864e5;
  let n = 0;
  while (days.has(dayKey(new Date(d)))) { n++; d -= 864e5; }
  return n;
}
function renderPhoneMock() {
  const hour = new Date().getHours();
  $('#pmGreetEyebrow').textContent = hour < 11 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  if (!S || !S.user) return;
  const u = S.user;
  $('#pmGreetName').textContent = u.name ? `${u.name}, ready to ride?` : 'Ready to ride?';
  const streak = streakMock();
  const chip = $('.pm-streak');
  chip.style.display = streak > 0 ? '' : 'none';
  $('#pmStreak').textContent = streak;
  $('#pmAvatar').innerHTML = u.selfie ? `<img src="${u.selfie}" alt="" />` : esc(initials(u.name, u.surname));
  $('#pmChipBal').textContent = nf(S.balance);
  $('#pmBalance').textContent = nf(S.balance);
  $('#pmFiat').textContent = `≈ ${money(S.balance)} in value`;
  const prog = Math.min(S.todayKm || 0, 100) / 100;
  $('#pmRingFg').style.strokeDashoffset = String(251.3 * (1 - prog));
  $('#pmRingKm').textContent = nf(S.todayKm, 1);
  $('#pmTodayKm').textContent = nf(S.todayKm, 1);
  $('#pmTodayEarn').textContent = nf(S.todayEarn || 0, 0);
  $('#pmTotalKm').textContent = nf(S.totalKm, 1);
  $('#pmQr').textContent = nf(S.qrCount, 0);
}

/* ---------- counter animation (numbers from data) ---------- */
function runCounters() {
  const els = [...document.querySelectorAll('[data-count]')];
  if (!els.length) return;
  const paint = (el, v) => { el.textContent = Math.round(v).toLocaleString('en-US') + (el.dataset.suffix || ''); };
  if (matchMedia('(prefers-reduced-motion:reduce)').matches) {
    els.forEach(el => paint(el, +el.dataset.count));
    return;
  }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, target = +el.dataset.count, t0 = performance.now(), dur = 1500;
    io.unobserve(el);
    const tick = now => {
      const p = Math.min(1, (now - t0) / dur);
      paint(el, target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }), { threshold: .35 });
  els.forEach(el => io.observe(el));
}

/* ---------- setup ---------- */
renderPhoneMock();
runCounters();
hydrateIcons();
calc();
wireOtp();

$('#calcKm').addEventListener('input', calc);
$('#calcRange').addEventListener('input', e => { $('#calcKm').value = e.target.value; calc(); });
$('#liBtn').addEventListener('click', tryLogin);
$('#liOtp').addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(); });
$('#liEmail').addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(); });
$('#logoutBtn').addEventListener('click', logout);
$('#demoBtn').addEventListener('click', () => {
  if (hasAccount()) {
    $('#liEmail').value = S.user.email;
    msg(`Saved account found: ${esc(S.user.email)}. Log in with your 2FA code.`, 'ok');
    $$('#liOtp input')[0].focus();
  } else {
    seedDemo();
    S = load();
    renderPhoneMock();
    $('#liEmail').value = S.user.email;
    try { sessionStorage.setItem('bc.panel', S.user.email.toLowerCase()); } catch { }
    msg('Demo data created, opening the panel…', 'ok');
    showPanel();
  }
});

/* top bar shadow */
const onScroll = () => $('#snav').classList.toggle('is-scrolled', window.scrollY > 8);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* gradual reveal */
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => io.observe(el));
} else {
  $$('.reveal').forEach(el => el.classList.add('in'));
}

/* session restore */
try {
  const sess = sessionStorage.getItem('bc.panel');
  if (sess && hasAccount() && sess === S.user.email.trim().toLowerCase()) showPanel();
} catch { }
