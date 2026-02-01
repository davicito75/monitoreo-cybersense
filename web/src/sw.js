self.addEventListener('push', function (event) {
  let data = {};
  try { data = event.data.json(); } catch (e) {}
  const title = data.title || 'Notification';
  const body = data.body || '';
  event.waitUntil(self.registration.showNotification(title, { body }));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(clients.matchAll({ type: 'window' }).then((clientList) => {
    if (clientList.length > 0) return clientList[0].focus();
    return clients.openWindow('/');
  }));
});
