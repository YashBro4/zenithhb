import { useCallback, useEffect, useState } from 'react';
import { useTimeBlocks } from './useTimeBlocks';

const STORAGE_KEY = 'zenith_reminders_enabled';
const DIGEST_KEY = 'zenith_schedule_digest_date';
const LEAD_MINUTES = 5;
const DIGEST_HOUR = 8;

// Skip SW in Lovable preview iframe — service workers in the editor preview
// pollute caching and don't fire notifications anyway.
const isPreviewHost = () => {
  if (typeof window === 'undefined') return true;
  const h = window.location.hostname;
  return h.includes('id-preview--') || h.includes('lovableproject.com');
};
const isInIframe = () => {
  try { return window.self !== window.top; } catch { return true; }
};
const canUseSW = () =>
  typeof navigator !== 'undefined' &&
  'serviceWorker' in navigator &&
  'Notification' in window &&
  !isPreviewHost() &&
  !isInIframe();

type Permission = 'default' | 'granted' | 'denied' | 'unsupported';

const formatBlockTime = (m: number) => {
  const h = Math.floor(m / 60);
  const min = m % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(min).padStart(2, '0')} ${ampm}`;
};

const dateKey = (date: Date) => date.toISOString().slice(0, 10);

export const useReminders = () => {
  const { blocks } = useTimeBlocks();
  const [enabled, setEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
  });
  const [permission, setPermission] = useState<Permission>(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    return Notification.permission as Permission;
  });
  const [registering, setRegistering] = useState(false);

  // Schedule SW notifications for the next 24h.
  const sync = useCallback(async () => {
    if (!enabled || permission !== 'granted' || !canUseSW()) return;
    const reg = await navigator.serviceWorker.ready;
    const worker = reg.active || reg.waiting || reg.installing;
    if (!worker) return;

    const now = new Date();
    const items: Array<{ fireAt: number; title: string; body: string; tag: string }> = [];
    // Walk the next 24h, day by day.
    for (let d = 0; d < 2; d++) {
      const day = new Date(now);
      day.setDate(day.getDate() + d);
      const dow = day.getDay();
      const dayBlocks = blocks
        .filter(b => b.day_of_week === dow)
        .sort((a, b) => a.start_minute - b.start_minute);

      if (d === 0 && dayBlocks.length > 0) {
        const digestAt = new Date(day);
        digestAt.setHours(DIGEST_HOUR, 0, 0, 0);
        const key = dateKey(day);
        let alreadySent = false;
        try { alreadySent = localStorage.getItem(DIGEST_KEY) === key; } catch {}
        if (!alreadySent) {
          const digestFireAt = digestAt.getTime() > now.getTime() ? digestAt.getTime() : now.getTime() + 2000;
          const preview = dayBlocks
            .slice(0, 4)
            .map(b => `${formatBlockTime(b.start_minute)} ${b.title}`)
            .join(' · ');
          items.push({
            fireAt: digestFireAt,
            title: "Today's Zenith schedule",
            body: `${dayBlocks.length} block${dayBlocks.length === 1 ? '' : 's'} today · ${preview}`,
            tag: `zenith-daily-${key}`,
          });
          try { localStorage.setItem(DIGEST_KEY, key); } catch {}
        }
      }

      dayBlocks.forEach(b => {
        const fire = new Date(day);
        fire.setHours(0, 0, 0, 0);
        fire.setMinutes(b.start_minute - LEAD_MINUTES);
        const ts = fire.getTime();
        if (ts > now.getTime() && ts < now.getTime() + 24 * 60 * 60 * 1000) {
          items.push({
            fireAt: ts,
            title: `Upcoming: ${b.title}`,
            body: `Starts in ${LEAD_MINUTES} minutes · ${formatBlockTime(b.start_minute)}`,
            tag: `zenith-${b.id}-${ts}`,
          });
        }
      });
    }
    worker.postMessage({ type: 'SCHEDULE', items });
  }, [enabled, permission, blocks]);

  // Register/unregister SW based on enabled flag.
  useEffect(() => {
    if (!canUseSW()) return;
    if (enabled && permission === 'granted') {
      navigator.serviceWorker
        .register('/reminder-sw.js')
        .then(async (reg) => {
          await navigator.serviceWorker.ready;
          await sync();
          if (reg.active) {
            reg.active.postMessage({
              type: 'NOTIFY_NOW',
              title: 'Zenith notifications are on',
              body: 'Your daily schedule and upcoming blocks will appear here.',
              tag: 'zenith-notifications-enabled',
            });
          }
        })
        .catch((error) => console.error('[Reminders] registration failed', error));
    }
  }, [enabled, permission, sync]);

  // Re-sync whenever blocks change.
  useEffect(() => { sync(); }, [sync]);

  const toggle = useCallback(async (next: boolean) => {
    if (!('Notification' in window)) {
      setPermission('unsupported');
      return;
    }
    if (next) {
      setRegistering(true);
      try {
        let perm = Notification.permission as Permission;
        if (perm === 'default') perm = (await Notification.requestPermission()) as Permission;
        setPermission(perm);
        if (perm !== 'granted') {
          setEnabled(false);
          try { localStorage.setItem(STORAGE_KEY, '0'); } catch {}
          return;
        }
        setEnabled(true);
        try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
      } finally {
        setRegistering(false);
      }
    } else {
      setEnabled(false);
      try { localStorage.setItem(STORAGE_KEY, '0'); } catch {}
      if (canUseSW()) {
        const reg = await navigator.serviceWorker.getRegistration('/reminder-sw.js');
        reg?.active?.postMessage({ type: 'CLEAR' });
      }
    }
  }, []);

  return {
    enabled,
    permission,
    registering,
    toggle,
    supported: typeof window !== 'undefined' && 'Notification' in window,
    previewBlocked: !canUseSW() && typeof window !== 'undefined' && 'Notification' in window,
  };
};

export type RemindersState = ReturnType<typeof useReminders>;
