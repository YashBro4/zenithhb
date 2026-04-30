import { useCallback, useEffect, useState } from 'react';
import { useTimeBlocks } from './useTimeBlocks';

const STORAGE_KEY = 'zenith_reminders_enabled';
const LEAD_MINUTES = 5;

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
    const reg = await navigator.serviceWorker.getRegistration('/reminder-sw.js');
    if (!reg || !reg.active) return;

    const now = new Date();
    const items: Array<{ fireAt: number; title: string; body: string; tag: string }> = [];
    // Walk the next 24h, day by day.
    for (let d = 0; d < 2; d++) {
      const day = new Date(now);
      day.setDate(day.getDate() + d);
      const dow = day.getDay();
      const dayBlocks = blocks.filter(b => b.day_of_week === dow);
      dayBlocks.forEach(b => {
        const fire = new Date(day);
        fire.setHours(0, 0, 0, 0);
        fire.setMinutes(b.start_minute - LEAD_MINUTES);
        const ts = fire.getTime();
        if (ts > now.getTime() && ts < now.getTime() + 24 * 60 * 60 * 1000) {
          const hh = Math.floor(b.start_minute / 60);
          const mm = b.start_minute % 60;
          const ampm = hh >= 12 ? 'PM' : 'AM';
          const h12 = ((hh + 11) % 12) + 1;
          items.push({
            fireAt: ts,
            title: `Up next: ${b.title}`,
            body: `Starts in ${LEAD_MINUTES} min · ${h12}:${String(mm).padStart(2, '0')} ${ampm}`,
            tag: `zenith-${b.id}-${ts}`,
          });
        }
      });
    }
    reg.active.postMessage({ type: 'SCHEDULE', items });
  }, [enabled, permission, blocks]);

  // Register/unregister SW based on enabled flag.
  useEffect(() => {
    if (!canUseSW()) return;
    if (enabled && permission === 'granted') {
      navigator.serviceWorker
        .register('/reminder-sw.js')
        .then(() => sync())
        .catch(() => {});
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
