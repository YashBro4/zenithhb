// Zenith Smart Reminders — background scheduler.
//
// Delivery paths (in order of reliability when the tab is closed):
//   1) Notification Triggers API (TimestampTrigger). OS-level, survives tab
//      close and browser restart in supporting Chromium builds.
//   2) setTimeout fallback while this Service Worker is alive.
//
// The full schedule is persisted to IndexedDB so the SW can re-hydrate and
// re-schedule on activate / wake-up without needing the page to be open.

const TAG_PREFIX = 'zenith-';
const DB_NAME = 'zenith-reminders';
const STORE = 'schedule';
const KEY = 'items';

self.addEventListener('install', (e) => e.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (e) =>
  e.waitUntil((async () => {
    await self.clients.claim();
    // Re-hydrate stored schedule so triggers exist after SW restart.
    const items = await readItems().catch(() => []);
    if (items && items.length) await scheduleAll(items);
  })()),
);

// --- IndexedDB helpers ---------------------------------------------------
const openDb = () => new Promise((resolve, reject) => {
  const req = indexedDB.open(DB_NAME, 1);
  req.onupgradeneeded = () => req.result.createObjectStore(STORE);
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});
const writeItems = async (items) => {
  const db = await openDb();
  await new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(items, KEY);
    tx.oncomplete = res;
    tx.onerror = () => rej(tx.error);
  });
  db.close();
};
const readItems = async () => {
  const db = await openDb();
  const items = await new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readonly');
    const r = tx.objectStore(STORE).get(KEY);
    r.onsuccess = () => res(r.result || []);
    r.onerror = () => rej(r.error);
  });
  db.close();
  return items;
};

// --- Scheduling ----------------------------------------------------------
let timers = [];
const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

const clearScheduledTriggers = async () => {
  try {
    const all = await self.registration.getNotifications({ includeTriggered: false });
    all.forEach((n) => { if (n.tag && n.tag.startsWith(TAG_PREFIX)) n.close(); });
  } catch {}
};

const supportsTrigger = () => 'TimestampTrigger' in self;

const scheduleAll = async (items) => {
  clearTimers();
  await clearScheduledTriggers();
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
      renotify: true,
      data: { url: '/', fireAt: it.fireAt },
    };
    if (supportsTrigger()) {
      try {
        // eslint-disable-next-line no-undef
        opts.showTrigger = new TimestampTrigger(it.fireAt);
        await self.registration.showNotification(it.title || 'Upcoming block', opts);
        continue;
      } catch {
        // fall through
      }
    }
    const id = setTimeout(() => {
      self.registration.showNotification(it.title || 'Upcoming block', opts);
    }, delay);
    timers.push(id);
  }
};

// --- Messaging from the page --------------------------------------------
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SCHEDULE') {
    const items = Array.isArray(data.items) ? data.items : [];
    event.waitUntil((async () => {
      await writeItems(items).catch(() => {});
      await scheduleAll(items);
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
    event.waitUntil((async () => {
      clearTimers();
      await writeItems([]).catch(() => {});
      await clearScheduledTriggers();
    })());
  }
});

// Periodic Background Sync (Chromium, when granted) — re-hydrates triggers.
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'zenith-reschedule') {
    event.waitUntil((async () => {
      const items = await readItems().catch(() => []);
      if (items.length) await scheduleAll(items);
    })());
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((wins) => {
      const w = wins.find((c) => 'focus' in c);
      if (w) return w.focus();
      return self.clients.openWindow('/');
    }),
  );
});
