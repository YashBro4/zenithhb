// Zenith Smart Reminders — minimal background scheduler.
// Receives SCHEDULE messages from the app and shows notifications at the right time.
// Survives tab inactivity (within OS limits). Cleared/replaced on every SCHEDULE message.

self.addEventListener('install', (e) => e.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

let timers = [];

const clearTimers = () => {
  timers.forEach((id) => clearTimeout(id));
  timers = [];
};

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SCHEDULE') {
    clearTimers();
    const items = Array.isArray(data.items) ? data.items : [];
    const now = Date.now();
    items.forEach((it) => {
      const delay = it.fireAt - now;
      if (delay <= 0 || delay > 24 * 60 * 60 * 1000) return; // only schedule within 24h
      const id = setTimeout(() => {
        self.registration.showNotification(it.title || 'Upcoming block', {
          body: it.body || '',
          tag: it.tag || `zenith-${it.fireAt}`,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          silent: false,
        });
      }, delay);
      timers.push(id);
    });
  }
  if (data.type === 'CLEAR') clearTimers();
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((wins) => {
      const w = wins.find((c) => 'focus' in c);
      if (w) return w.focus();
      return self.clients.openWindow('/');
    })
  );
});
