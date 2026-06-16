// Zenith Smart Reminders — background scheduler.
// Two delivery paths:
//   1) Notification Triggers API (TimestampTrigger) when supported — OS-level,
//      survives the tab being closed.
//   2) setTimeout fallback while the SW is alive (within 24h window).

self.addEventListener('install', (e) => e.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

let timers = [];
const TAG_PREFIX = 'zenith-';

const clearTimers = () => {
  timers.forEach((id) => clearTimeout(id));
  timers = [];
};

// Cancel any previously-scheduled trigger notifications so edits/deletes
// don't leave stale OS-level reminders behind.
const clearScheduledTriggers = async () => {
  try {
    const all = await self.registration.getNotifications({ includeTriggered: false });
    all.forEach((n) => {
      if (n.tag && n.tag.startsWith(TAG_PREFIX)) n.close();
    });
  } catch (e) {
    // getNotifications with includeTriggered isn't universal; ignore.
  }
};

const supportsTrigger = () => 'TimestampTrigger' in self;

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SCHEDULE') {
    clearTimers();
    event.waitUntil((async () => {
      await clearScheduledTriggers();
      const items = Array.isArray(data.items) ? data.items : [];
      const now = Date.now();
      for (const it of items) {
        const delay = it.fireAt - now;
        if (delay <= 0 || delay > 24 * 60 * 60 * 1000) continue;
        const opts = {
          body: it.body || '',
          tag: it.tag || `${TAG_PREFIX}${it.fireAt}`,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          silent: !!it.silent,
          requireInteraction: true,
          data: { url: '/' },
        };
        if (supportsTrigger()) {
          try {
            // eslint-disable-next-line no-undef
            opts.showTrigger = new TimestampTrigger(it.fireAt);
            await self.registration.showNotification(it.title || 'Upcoming block', opts);
            continue;
          } catch (err) {
            // fall through to setTimeout
          }
        }
        const id = setTimeout(() => {
          self.registration.showNotification(it.title || 'Upcoming block', opts);
        }, delay);
        timers.push(id);
      }
    })());
  }
  if (data.type === 'NOTIFY_NOW') {
    self.registration.showNotification(data.title || 'Zenith notifications', {
      body: data.body || '',
      tag: data.tag || `${TAG_PREFIX}test`,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      silent: false,
    });
  }
  if (data.type === 'CLEAR') {
    clearTimers();
    event.waitUntil(clearScheduledTriggers());
  }
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
