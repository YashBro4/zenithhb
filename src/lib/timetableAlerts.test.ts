import { beforeEach, describe, expect, it } from 'vitest';
import {
  blockAlertStorageKey,
  getBlocksStartingNow,
  markBlockAlertFired,
  timetableNotificationOptions,
} from './timetableAlerts';
import type { TimeBlock } from '@/hooks/useTimeBlocks';

const block = (id: string, day: number, start: number): TimeBlock => ({
  id,
  title: id,
  category: 'work',
  color: null,
  day_of_week: day,
  start_minute: start,
  end_minute: start + 60,
  notes: null,
});

describe('timetable alert timing and daily deduplication', () => {
  beforeEach(() => localStorage.clear());

  it('uses the local calendar day in each block alert key', () => {
    expect(blockAlertStorageKey('focus-1', new Date(2026, 9, 6, 9, 0)))
      .toBe('zenith_timetable_alert_fired_2026-10-06_focus-1');
  });

  it('fires at most once per block each day, then permits the next day', () => {
    const today = new Date(2026, 9, 6, 9, 0);
    expect(markBlockAlertFired('focus-1', today)).toBe(true);
    expect(markBlockAlertFired('focus-1', today)).toBe(false);
    expect(markBlockAlertFired('focus-1', new Date(2026, 9, 7, 9, 0))).toBe(true);
  });

  it('only matches blocks starting now on the current local weekday', () => {
    const now = new Date(2026, 9, 6, 9, 0);
    expect(getBlocksStartingNow([
      block('match', now.getDay(), 540),
      block('wrong-day', (now.getDay() + 1) % 7, 540),
      block('wrong-time', now.getDay(), 541),
    ], now).map(item => item.id)).toEqual(['match']);
  });

  it('creates the requested service-worker alert title, content, icon, vibration and tag', () => {
    const notification = timetableNotificationOptions(block('focus-1', 2, 540));
    expect(notification.title).toBe('Timetable Alert ⏰');
    expect(notification.options.body).toBe('Starting now: focus-1 (9:00 AM - 10:00 AM)');
    expect(notification.options.icon).toBe('/icon-192.png');
    expect(notification.options.vibrate).toEqual([200, 100, 200]);
    expect(notification.options.tag).toBe('timetable-block-focus-1');
  });
});