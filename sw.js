
const channel = new BroadcastChannel('alba-sync');

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  const taskId = notification.data?.taskId;

  notification.close();

  channel.postMessage({
    type: 'TASK_ACTION',
    action: action || 'dismiss',
    taskId: taskId
  });

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const taskId = data.taskId || 'general';
  
  const options = {
    body: data.body || 'Lembrete da Alba!',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [500, 100, 500, 100, 500],
    tag: 'alba-notif-' + taskId,
    data: { taskId: taskId },
    actions: [
      { action: 'complete', title: 'Concluir ✅' },
      { action: 'dismiss', title: 'Ignorar ❌' }
    ],
    requireInteraction: true,
    renovate: true,
    priority: 'high'
  };
  event.waitUntil(self.registration.showNotification(data.title || 'Alerta Alba', options));
});
