const CACHE = 'peptideref-v3';
const PRECACHE = ['/index.html', '/js/app.js', '/js/ui.js', '/js/utils.js', '/js/state.js'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Never cache Supabase API calls
  if (url.hostname.includes('supabase.co')) return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if (res && res.status === 200 && res.type === 'basic') {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() => cached))
  );
});

self.addEventListener('push', e => {
  const data = e.data?.json() ?? {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'PeptideRef', {
      body: data.body || 'Time for your injection',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: data.tag || 'peptideref-reminder',
      data,
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('/'));
});
