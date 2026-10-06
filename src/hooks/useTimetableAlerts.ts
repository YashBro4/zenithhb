import { useCallback, useEffect, useState } from 'react';
import type { TimeBlock } from '@/hooks/useTimeBlocks';
import {
  clearBlockAlertFired,
  getBlocksStartingNow,
  markBlockAlertFired,
  TIMETABLE_ALERTS_CHANGED_EVENT,
  TIMETABLE_ALERTS_ENABLED_KEY,
  timetableNotificationOptions,
} from '@/lib/timetableAlerts';

type PermissionState = NotificationPermission | 'unsupported';
type WorkerState = 'checking' | 'active' | 'not-registered' | 'unsupported' | 'restricted' | 'error';

const isRestrictedPreview = () => {
  if (typeof window === 'undefined') return true;
  const host = window.location.hostname;
  if (host.includes('id-preview--') || host.includes('lovableproject.com')) return true;
  try { return window.self !== window.top; } catch { return true; }
};

const readEnabled = () => {
  try { return localStorage.getItem(TIMETABLE_ALERTS_ENABLED_KEY) === '1'; } catch { return false; }
};

export const useTimetableAlerts = (blocks: TimeBlock[]) => {
  const [enabled, setEnabled] = useState(readEnabled);
  const [permission, setPermission] = useState<PermissionState>(() =>
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );
  const [workerStatus, setWorkerStatus] = useState<WorkerState>(() =>
    typeof navigator === 'undefined' || !('serviceWorker' in navigator) ? 'unsupported' : 'checking'
  );
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const persistEnabled = useCallback((next: boolean) => {
    setEnabled(next);
    try { localStorage.setItem(TIMETABLE_ALERTS_ENABLED_KEY, next ? '1' : '0'); } catch {}
    window.dispatchEvent(new CustomEvent(TIMETABLE_ALERTS_CHANGED_EVENT, { detail: { enabled: next } }));
  }, []);

  const toggle = useCallback(async (next: boolean) => {
    if (!('Notification' in window)) {
      setPermission('unsupported');
      return;
    }
    if (!('serviceWorker' in navigator)) {
      setWorkerStatus('unsupported');
      return;
    }
    if (isRestrictedPreview()) {
      setWorkerStatus('restricted');
      setError('Open the published site to enable device notifications.');
      return;
    }

    if (!next) {
      persistEnabled(false);
      setError(null);
      return;
    }

    // Start the permission prompt synchronously in the user's switch tap.
    const permissionRequest = Notification.permission === 'default'
      ? Notification.requestPermission()
      : Promise.resolve(Notification.permission);
    setRegistering(true);
    setError(null);
    try {
      const granted = await permissionRequest;
      setPermission(granted);
      if (granted !== 'granted') {
        persistEnabled(false);
        if (granted === 'denied') setError('Notifications are blocked in browser settings.');
        return;
      }

      setWorkerStatus('checking');
      const registration = await navigator.serviceWorker.register('/reminder-sw.js');
      await navigator.serviceWorker.ready;
      if (!registration.active && !registration.waiting) {
        throw new Error('The notification service worker did not become active.');
      }
      setWorkerStatus('active');
      persistEnabled(true);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Could not enable timetable alerts.';
      setWorkerStatus('error');
      setError(message);
      persistEnabled(false);
    } finally {
      setRegistering(false);
    }
  }, [persistEnabled]);

  const sendTestAlert = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('Timetable Test Alert', {
        body: 'Your test alert arrived successfully.',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: `timetable-test-${Date.now()}`,
        vibrate: [200, 100, 200],
        requireInteraction: true,
      });
      setError(null);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Test alert could not be sent.');
      return false;
    }
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      setWorkerStatus('unsupported');
      return;
    }
    if (isRestrictedPreview()) {
      setWorkerStatus('restricted');
      return;
    }
    let alive = true;
    navigator.serviceWorker.getRegistration('/reminder-sw.js').then(registration => {
      if (alive) setWorkerStatus(registration?.active ? 'active' : 'not-registered');
    }).catch(() => {
      if (alive) setWorkerStatus('error');
    });
    const refreshPermission = () => {
      if ('Notification' in window) setPermission(Notification.permission);
    };
    window.addEventListener('focus', refreshPermission);
    navigator.serviceWorker.addEventListener('controllerchange', refreshPermission);
    return () => {
      alive = false;
      window.removeEventListener('focus', refreshPermission);
      navigator.serviceWorker.removeEventListener('controllerchange', refreshPermission);
    };
  }, []);

  useEffect(() => {
    const synchronize = () => setEnabled(readEnabled());
    window.addEventListener(TIMETABLE_ALERTS_CHANGED_EVENT, synchronize);
    window.addEventListener('storage', synchronize);
    return () => {
      window.removeEventListener(TIMETABLE_ALERTS_CHANGED_EVENT, synchronize);
      window.removeEventListener('storage', synchronize);
    };
  }, []);

  useEffect(() => {
    if (!enabled || permission !== 'granted' || !('serviceWorker' in navigator)) return;
    let busy = false;
    const checkSchedule = async () => {
      if (busy) return;
      const now = new Date();
      const dueBlocks = getBlocksStartingNow(blocks, now);
      if (!dueBlocks.length) return;
      busy = true;
      try {
        const registration = await navigator.serviceWorker.ready;
        for (const block of dueBlocks) {
          if (!markBlockAlertFired(block.id, now)) continue;
          const notification = timetableNotificationOptions(block);
          try {
            await registration.showNotification(notification.title, notification.options);
          } catch (cause) {
            clearBlockAlertFired(block.id, now);
            throw cause;
          }
        }
        setError(null);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'A timetable alert could not be sent.');
      } finally {
        busy = false;
      }
    };

    void checkSchedule();
    const timer = window.setInterval(() => void checkSchedule(), 30_000);
    return () => window.clearInterval(timer);
  }, [blocks, enabled, permission]);

  return {
    enabled,
    permission,
    workerStatus,
    registering,
    error,
    toggle,
    sendTestAlert,
    supported: permission !== 'unsupported',
    previewBlocked: workerStatus === 'restricted',
  };
};