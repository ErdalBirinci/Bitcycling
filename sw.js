/* Bitcycling — minimal service worker for the offline shell
   strategy: always network first (fresh content), fall back to cache when offline */
const CACHE = 'bitcycling-v7';
const ASSETS = ['./', './index.html', './app.html', './styles.css', './app.js', './api.js', './i18n.js', './web.css', './web.js', './manifest.webmanifest', './icon.svg'];

self.addEventListener('push', e => {
  let data = { title: 'Bitcycling', body: '' };
  try { data = Object.assign(data, e.data.json()); } catch {}
  e.waitUntil(self.registration.showNotification(data.title || 'Bitcycling', {
    body: data.body || '', icon: 'icon.svg', badge: 'icon.svg'
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if ('focus' in c) return c.focus(); }
    return clients.openWindow('./app.html');
  }));
});

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  e.respondWith(
    fetch(req).then(res => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      }
      return res;
    }).catch(() =>
      caches.match(req).then(hit =>
        hit ||
        (req.mode === 'navigate' ? caches.match('./app.html') : Response.error())
      )
    )
  );
});
