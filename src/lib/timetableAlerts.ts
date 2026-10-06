import type { TimeBlock } from '@/hooks/useTimeBlocks';

export const TIMETABLE_ALERTS_ENABLED_KEY = 'zenith_timetable_alerts_enabled';
export const TIMETABLE_ALERTS_CHANGED_EVENT = 'zenith:timetable-alerts-changed';

const dateStamp = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const blockAlertStorageKey = (blockId: string, date: Date) =>
  `zenith_timetable_alert_fired_${dateStamp(date)}_${blockId}`;

export const markBlockAlertFired = (blockId: string, date: Date) => {
  try {
    const key = blockAlertStorageKey(blockId, date);
    if (localStorage.getItem(key) === '1') return false;
    localStorage.setItem(key, '1');
    return true;
  } catch {
    return false;
  }
};

export const clearBlockAlertFired = (blockId: string, date: Date) => {
  try {
    localStorage.removeItem(blockAlertStorageKey(blockId, date));
  } catch {
    // Storage can be unavailable in private browsing; the caller still has its in-memory timer.
  }
};

export const getBlocksStartingNow = (blocks: TimeBlock[], date: Date) => {
  const minuteOfDay = date.getHours() * 60 + date.getMinutes();
  return blocks.filter(block => block.day_of_week === date.getDay() && block.start_minute === minuteOfDay);
};