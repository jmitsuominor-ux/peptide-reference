const CACHE = 'peptideref-v21';

self.addEventListener('install', e => {
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
  if (url.hostname.includes('supabase.co')) return;
  const isAppFile = /\.(html|js)$/.test(url.pathname) || url.pathname.endsWith('/');
  if (isAppFile) {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
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
  let data = {};
  try { data = e.data?.json() || {}; } catch {}
  e.waitUntil(
    self.registration.showNotification(data.title || 'PeptideRef', {
      body: data.body || '',
      icon: '/peptide-reference/icon-192.png',
      tag: data.tag || 'peptideref',
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
      const c = cs.find(w => w.url.includes('peptide-reference'));
      return c ? c.focus() : clients.openWindow('/peptide-reference/');
    })
  );
});
