import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTimeBlocks } from './useTimeBlocks';
import { useReminders } from './useReminders';

const SUB_KEY = 'onesignal_subscription_id';
const IDS_KEY = 'onesignal_scheduled_ids';

/**
 * Bridges the active timetable to OneSignal Web Push. Whenever blocks, the
 * lead time, or the OneSignal subscription change, this hook asks the
 * `schedule-onesignal` edge function to (a) cancel previously-scheduled
 * pushes and (b) schedule new `send_after` pushes for the next 24h so that
 * each block fires a real mobile push exactly at its start time — even when
 * the browser tab is closed.
 */
export const useOneSignalSchedule = () => {
  const { blocks } = useTimeBlocks();
  const { enabled, permission, leadMinutes } = useReminders();
  const [subscriptionId, setSubscriptionId] = useState<string | null>(() => {
    try { return localStorage.getItem(SUB_KEY); } catch { return null; }
  });
  const lastSyncRef = useRef<string>('');

  useEffect(() => {
    const onSub = (e: Event) => {
      const id = (e as CustomEvent).detail?.id;
      if (id) setSubscriptionId(id);
    };
    window.addEventListener('onesignal:subscription', onSub as EventListener);
    return () => window.removeEventListener('onesignal:subscription', onSub as EventListener);
  }, []);

  useEffect(() => {
    if (!enabled || permission !== 'granted' || !subscriptionId) return;
    if (!blocks.length) return;

    const payload = {
      subscriptionId,
      leadMinutes,
      tzOffsetMinutes: new Date().getTimezoneOffset(),
      previousNotificationIds: (() => {
        try { return JSON.parse(localStorage.getItem(IDS_KEY) || '[]'); } catch { return []; }
      })(),
      blocks: blocks.map(b => ({
        id: b.id,
        title: b.title,
        day_of_week: b.day_of_week,
        start_minute: b.start_minute,
        end_minute: b.end_minute,
      })),
    };

    // Skip duplicate syncs (e.g. React StrictMode double-invoke).
    const sig = JSON.stringify({ s: subscriptionId, l: leadMinutes, b: payload.blocks });
    if (sig === lastSyncRef.current) return;
    lastSyncRef.current = sig;

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('schedule-onesignal', { body: payload });
        if (error) throw error;
        if (data?.notificationIds) {
          try { localStorage.setItem(IDS_KEY, JSON.stringify(data.notificationIds)); } catch {}
        }
        console.log('[OneSignal] scheduled', data);
      } catch (e) {
        console.error('[OneSignal] schedule failed', e);
      }
    })();
  }, [enabled, permission, subscriptionId, leadMinutes, blocks]);

  return { subscriptionId };
};
