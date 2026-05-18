// Pawsitive Service Worker — 푸시 알림 전용
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Pawsitive';
  const options = {
    body:    data.body || '',
    icon:    '/pawsitive_logo_transparent.png',
    badge:   '/pawsitive_logo_transparent.png',
    tag:     data.tag  || 'pawsitive',
    data:    data.url  || '/',
    vibrate: [200, 100, 200]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data || '/';
  event.waitUntil(clients.matchAll({ type: 'window' }).then(list => {
    for (const client of list) {
      if (client.url.includes(self.location.origin) && 'focus' in client) {
        client.navigate(url);
        return client.focus();
      }
    }
    if (clients.openWindow) return clients.openWindow(url);
  }));
});
