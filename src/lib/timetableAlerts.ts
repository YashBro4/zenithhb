import type { TimeBlock } from '@/hooks/useTimeBlocks';

export const TIMETABLE_ALERTS_ENABLED_KEY = 'zenith_timetable_alerts_enabled';
export const TIMETABLE_ALERTS_CHANGED_EVENT = 'zenith:timetable-alerts-changed';

const inMemoryFiredAlerts = new Set<string>();

const dateStamp = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const blockAlertStorageKey = (blockId: string, date: Date) =>
  `zenith_timetable_alert_fired_${dateStamp(date)}_${blockId}`;

export const markBlockAlertFired = (blockId: string, date: Date) => {
  const key = blockAlertStorageKey(blockId, date);
  if (inMemoryFiredAlerts.has(key)) return false;
  try {
    if (localStorage.getItem(key) === '1') return false;
    localStorage.setItem(key, '1');
    inMemoryFiredAlerts.add(key);
    return true;
  } catch {
    inMemoryFiredAlerts.add(key);
    return true;
  }
};

export const clearBlockAlertFired = (blockId: string, date: Date) => {
  const key = blockAlertStorageKey(blockId, date);
  inMemoryFiredAlerts.delete(key);
  try {
    localStorage.removeItem(key);
  } catch {
    // Storage can be unavailable in private browsing; the caller still has its in-memory timer.
  }
};

export const timetableNotificationOptions = (block: TimeBlock) => {
  const formatTime = (minute: number) => {
    const hour24 = Math.floor(minute / 60);
    const hour12 = ((hour24 + 11) % 12) + 1;
    const suffix = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${String(minute % 60).padStart(2, '0')} ${suffix}`;
  };

  return {
    title: 'Timetable Alert ⏰',
    options: {
      body: `Starting now: ${block.title} (${formatTime(block.start_minute)} - ${formatTime(block.end_minute)})`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      tag: `timetable-block-${block.id}`,
      requireInteraction: true,
      data: { url: '/' },
    },
  };
};

export const getBlocksStartingNow = (blocks: TimeBlock[], date: Date) => {
  const minuteOfDay = date.getHours() * 60 + date.getMinutes();
  return blocks.filter(block => block.day_of_week === date.getDay() && block.start_minute === minuteOfDay);
};