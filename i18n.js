/* ============================================================
   Bitcycling — i18n (EN / TR)
   ------------------------------------------------------------
   Approach: a source-string dictionary. The UI is authored in
   English; tDOM() walks the DOM after every render and swaps
   any text node / common attribute that has a translation.
   t() is used inside templates for interpolated sentences.

   Add a language: extend I18N and the LANG_NAMES list.
   ============================================================ */
window.I18N = {
  tr: {
    /* --- chrome / nav --- */
    'Home': 'Ana Sayfa', 'Ride': 'Sürüş', 'Market': 'Pazar', 'Events': 'Etkinlikler', 'Profile': 'Profil',
    'Balance': 'Bakiye', 'Start riding': 'Sürüşe başla',
    /* --- home --- */
    'Ways to earn': 'Kazanma yolları', 'Quests': 'Görevler', 'Recent activity': 'Son hareketler',
    'Community leaderboard': 'Topluluk sıralaması', 'All': 'Tümü', 'Details': 'Detay',
    'Ride history': 'Sürüş geçmişi', 'My trades': 'İşlemlerim',
    /* --- ride --- */
    'Start ride': 'Sürüşe başla', 'Pause': 'Duraklat', 'Resume': 'Devam et',
    'Finish ride': 'Sürüşü bitir', 'Give up': 'Vazgeç', 'Speed': 'Hız', 'Distance': 'Mesafe',
    'Route map': 'Rota haritası', 'GPS / simulation': 'GPS / simülasyon', 'GPS': 'GPS', 'Simulation': 'Simülasyon',
    /* --- events --- */
    'QR bonus events': 'QR bonus etkinlikleri', 'city & country': 'şehir & ülke',
    'Bitcycling Bike Fest': 'Bitcycling Bisiklet Şenliği', '2x a year': 'yılda 2 kez',
    'Active contests': 'Aktif yarışmalar', 'Monthly leaderboard': 'Aylık sıralama',
    'Clubs & weekly tournament': 'Kulüpler & haftalık turnuva',
    /* --- wallet --- */
    'Wallet': 'Cüzdan', 'Payout': 'Ödeme', 'Transfer': 'Transfer', 'Send': 'Gönder',
    'BTCYC → EUR': 'BTCYC → EUR', 'Amount': 'Tutar', '2FA code': '2FA kodu',
    /* --- profile / settings --- */
    'Account security': 'Hesap güvenliği', 'Devices and sessions': 'Cihazlar ve oturumlar',
    'Statistics': 'İstatistikler', 'Charts': 'Grafikler', 'Badges': 'Rozetler',
    'Streak and goal': 'Seri ve hedef', 'Friends and invites': 'Arkadaşlar ve davetler',
    'Access and payments': 'Erişim ve ödemeler', 'Settings': 'Ayarlar',
    'Earning notifications': 'Kazanç bildirimleri',
    'Alert me when BTCYC is credited': 'BTCYC hesabıma yattığında uyar',
    'Browser notifications': 'Tarayıcı bildirimleri',
    'Daily goal': 'Günlük hedef', 'Your personal target (limit stays 100 km)': 'Kişisel hedefin (limit 100 km kalır)',
    'Bike speed limit': 'Bisiklet hız limiti', 'Maximum speed for BTCYC': 'BTCYC için maksimum hız',
    'Language': 'Dil', 'Interface language': 'Arayüz dili',
    'Theme': 'Tema', 'Light / dark appearance': 'Açık / koyu görünüm',
    'Daily transfer limit': 'Günlük transfer limiti', 'Sent today': 'Bugün gönderilen',
    'Wallet transfers': 'Cüzdan transferleri', 'All transfers protected by 2FA': 'Tüm transferler 2FA ile korunur',
    'Reset demo data': 'Demo verisini sıfırla', 'Deletes all progress': 'Tüm ilerlemeyi siler',
    'Log out': 'Çıkış yap', 'Sign out': 'Çıkış yap',
    /* --- onboarding --- */
    'Welcome to Bitcycling': 'Bitcycling\'e hoş geldin',
    'Set a daily goal': 'Günlük hedef belirle',
    'Fair play is automatic': 'Adil oyun otomatik',
    'Never miss a reward': 'Hiçbir ödülü kaçırma',
    'Next': 'İleri', 'Skip': 'Atla', "Let's ride": 'Hadi sürelim',
    /* --- quests --- */
    'Daily quest': 'Günlük görev', 'Weekly quest': 'Haftalık görev',
    'Ride 10 km today': 'Bugün 10 km sür', 'Scan 1 QR code': '1 QR kodu tara',
    'Ride 50 km this week': 'Bu hafta 50 km sür', 'Complete 3 rides this week': 'Bu hafta 3 sürüş tamamla',
    'Claim': 'Al', 'Claimed': 'Alındı',
    /* --- market --- */
    'Search products…': 'Ürün ara…', 'All categories': 'Tüm kategoriler',
    'Redeem': 'Kullan', 'Rent': 'Kirala', 'In stock': 'Stokta', 'Rented': 'Kiralandı',
    'products': 'ürün',
    /* --- empty states --- */
    'No rides yet': 'Henüz sürüş yok',
    'No rides match': 'Eşleşen sürüş yok', 'Try a different search term or sort order.': 'Farklı bir arama terimi veya sıralama dene.',
    'Nothing here yet': 'Burada henüz bir şey yok',
    'Nothing yet': 'Henüz bir şey yok',
    /* --- common actions --- */
    'Close': 'Kapat', 'Cancel': 'İptal', 'Save': 'Kaydet', 'Search': 'Ara',
    'Install': 'Yükle', 'Not now': 'Şimdi değil', 'Share summary': 'Özeti paylaş',
    'Great, close': 'Harika, kapat', 'All set — ride safe': 'Hazır — iyi sürüşler',
    /* --- toasts / misc --- */
    'BTCYC': 'BTCYC', 'km': 'km', 'min': 'dk',
    'Ride. Earn. Repeat.': 'Sür. Kazan. Tekrarla.'
  }
};

window.LANG_NAMES = { en: 'EN', tr: 'TR' };
let LANG = localStorage.getItem('bitcycling.lang') || 'en';

/* translate a single source string */
function t(src) {
  if (LANG === 'en') return src;
  const d = (window.I18N[LANG] || {});
  return (d[src] !== undefined) ? d[src] : src;
}
/* translate an interpolated sentence: t2('Quest reward', ' · ' + name) */
function t2(src, suffix) { return t(src) + (suffix || ''); }

/* remember the authored (English) source so switching back is lossless */
const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
const ORIG = new WeakMap();       // text nodes -> authored text
let ATTR_EDITS = [];              // [el, attr, value] for attributes
function tDOM(root) {
  const scope = root || document;
  if (LANG === 'en') { restoreDOM(scope); return; }
  const d = window.I18N[LANG] || {};
  const walk = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, null);
  while (walk.nextNode()) {
    const n = walk.currentNode;
    const s = n.nodeValue;
    if (!s || !s.trim()) continue;
    const key = s.trim();
    if (d[key] === undefined) continue;
    if (!ORIG.has(n)) ORIG.set(n, s);          // store authored text once
    n.nodeValue = s.replace(key, d[key]);
  }
  const els = scope.querySelectorAll ? scope.querySelectorAll('input,textarea,img,button,a,span,small,b') : [];
  els.forEach(el => ATTRS.forEach(a => {
    const v = el.getAttribute && el.getAttribute(a);
    if (v && d[v.trim()] !== undefined) { ATTR_EDITS.push([el, a, v]); el.setAttribute(a, d[v.trim()]); }
  }));
}
/* restore authored English (used when switching back to EN) */
function restoreDOM(scope) {
  const walk = document.createTreeWalker(scope || document, NodeFilter.SHOW_TEXT, null);
  while (walk.nextNode()) {
    const n = walk.currentNode;
    if (ORIG.has(n)) { n.nodeValue = ORIG.get(n); ORIG.delete(n); }
  }
  ATTR_EDITS.forEach(([el, a, v]) => { try { el.setAttribute(a, v); } catch {} });
  ATTR_EDITS = [];
}

function setLang(code) {
  LANG = code || 'en';
  localStorage.setItem('bitcycling.lang', LANG);
  document.documentElement.lang = LANG;
  if (window.S && S.settings) { S.settings.lang = LANG; if (window.save) save(); }
  // app.js registers a re-render hook so i18n.js stays decoupled
  if (typeof window.onLangChange === 'function') { try { window.onLangChange(); } catch {} }
  tDOM();
  // reflect in the settings row
  const el = document.getElementById('langVal');
  if (el) el.textContent = (LANG_NAMES[LANG] || 'EN').toUpperCase();
}
window.t = t; window.t2 = t2; window.tDOM = tDOM; window.setLang = setLang;
window.getLang = () => LANG;
