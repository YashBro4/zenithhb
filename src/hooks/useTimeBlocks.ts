import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TimeBlock {
  id: string;
  title: string;
  category: string;
  color: string | null;
  day_of_week: number; // 0=Sun..6=Sat
  start_minute: number;
  end_minute: number;
  notes: string | null;
}

export interface NewTimeBlock {
  title: string;
  category: string;
  color?: string | null;
  day_of_week: number;
  start_minute: number;
  end_minute: number;
  notes?: string | null;
}

export interface BulkCloneArgs {
  sourceDay: number;
  targetDays: number[];
  mode: 'merge' | 'replace';
}

export const CATEGORY_COLORS: Record<string, string> = {
  work: '#6B9080',
  gym: '#E8A87C',
  study: '#7C9EE8',
  rest: '#A4C3B2',
  meal: '#F6BD60',
  social: '#D8A7B1',
  other: '#9CA3AF',
};

export const CATEGORIES = Object.keys(CATEGORY_COLORS);

const GUEST_KEY = 'guest_time_blocks';

const readGuest = (): TimeBlock[] => {
  try {
    return JSON.parse(localStorage.getItem(GUEST_KEY) || '[]');
  } catch {
    return [];
  }
};

const writeGuest = (b: TimeBlock[]) => localStorage.setItem(GUEST_KEY, JSON.stringify(b));

export const useTimeBlocks = () => {
  const { user, isGuest } = useAuth();
  const qc = useQueryClient();
  const [guestBlocks, setGuestBlocks] = useState<TimeBlock[]>(() => (isGuest ? readGuest() : []));

  useEffect(() => {
    if (isGuest) setGuestBlocks(readGuest());
  }, [isGuest]);

  const cloudQuery = useQuery({
    queryKey: ['time_blocks', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_blocks')
        .select('*')
        .order('day_of_week', { ascending: true })
        .order('start_minute', { ascending: true });
      if (error) throw error;
      return data as TimeBlock[];
    },
    enabled: !!user && !isGuest,
  });

  const blocks: TimeBlock[] = isGuest ? guestBlocks : (cloudQuery.data ?? []);

  const add = useCallback(async (b: NewTimeBlock) => {
    if (isGuest) {
      const item: TimeBlock = {
        id: crypto.randomUUID(),
        title: b.title,
        category: b.category,
        color: b.color ?? CATEGORY_COLORS[b.category] ?? null,
        day_of_week: b.day_of_week,
        start_minute: b.start_minute,
        end_minute: b.end_minute,
        notes: b.notes ?? null,
      };
      const next = [...readGuest(), item];
      writeGuest(next);
      setGuestBlocks(next);
      return;
    }
    if (!user) return;
    const { error } = await supabase.from('time_blocks').insert({
      user_id: user.id,
      title: b.title,
      category: b.category,
      color: b.color ?? CATEGORY_COLORS[b.category] ?? null,
      day_of_week: b.day_of_week,
      start_minute: b.start_minute,
      end_minute: b.end_minute,
      notes: b.notes ?? null,
    });
    if (error) throw error;
    qc.invalidateQueries({ queryKey: ['time_blocks'] });
  }, [isGuest, user, qc]);

  const update = useCallback(async (id: string, patch: Partial<NewTimeBlock>) => {
    if (isGuest) {
      const next = readGuest().map(b => b.id === id ? { ...b, ...patch, color: patch.color ?? b.color } : b);
      writeGuest(next);
      setGuestBlocks(next);
      return;
    }
    const { error } = await supabase.from('time_blocks').update(patch).eq('id', id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: ['time_blocks'] });
  }, [isGuest, qc]);

  const remove = useCallback(async (id: string) => {
    if (isGuest) {
      const next = readGuest().filter(b => b.id !== id);
      writeGuest(next);
      setGuestBlocks(next);
      return;
    }
    // Optimistic update so UI feels instant.
    qc.setQueryData<TimeBlock[]>(['time_blocks', user?.id], (prev) =>
      (prev ?? []).filter(b => b.id !== id)
    );
    const { error } = await supabase.from('time_blocks').delete().eq('id', id);
    if (error) {
      qc.invalidateQueries({ queryKey: ['time_blocks'] });
      throw error;
    }
  }, [isGuest, qc, user?.id]);

  // Bulk clone: copies all source-day blocks to multiple target days in a single round-trip.
  // Avoids the per-row await storm that made cloning feel glitchy and slow.
  const cloneDays = useCallback(async ({ sourceDay, targetDays, mode }: BulkCloneArgs) => {
    const current = isGuest ? readGuest() : (qc.getQueryData<TimeBlock[]>(['time_blocks', user?.id]) ?? []);
    const source = current.filter(b => b.day_of_week === sourceDay);
    if (source.length === 0 || targetDays.length === 0) return { added: 0, skipped: 0 };

    const overlaps = (a: { start_minute: number; end_minute: number }, b: { start_minute: number; end_minute: number }) =>
      a.start_minute < b.end_minute && b.start_minute < a.end_minute;

    // Determine which IDs to delete (replace mode) and which inserts to make.
    const idsToDelete: string[] = [];
    const inserts: Array<NewTimeBlock & { user_id?: string }> = [];
    let skipped = 0;

    for (const target of targetDays) {
      const existing = current.filter(b => b.day_of_week === target);
      if (mode === 'replace') {
        idsToDelete.push(...existing.map(e => e.id));
      }
      const remaining = mode === 'replace' ? [] : [...existing];
      for (const s of source) {
        const candidate = { ...s, day_of_week: target };
        const conflict = remaining.some(r => overlaps(candidate, r));
        if (conflict) { skipped++; continue; }
        inserts.push({
          title: s.title,
          category: s.category,
          color: s.color ?? CATEGORY_COLORS[s.category] ?? null,
          day_of_week: target,
          start_minute: s.start_minute,
          end_minute: s.end_minute,
          notes: s.notes,
        });
        remaining.push(candidate);
      }
    }

    if (isGuest) {
      const newItems: TimeBlock[] = inserts.map(i => ({
        id: crypto.randomUUID(),
        title: i.title,
        category: i.category,
        color: i.color ?? null,
        day_of_week: i.day_of_week,
        start_minute: i.start_minute,
        end_minute: i.end_minute,
        notes: i.notes ?? null,
      }));
      const next = current.filter(b => !idsToDelete.includes(b.id)).concat(newItems);
      writeGuest(next);
      setGuestBlocks(next);
      return { added: newItems.length, skipped };
    }

    if (!user) return { added: 0, skipped };

    // Run delete + insert in parallel; one round-trip each.
    const ops: Promise<any>[] = [];
    if (idsToDelete.length) {
      ops.push(supabase.from('time_blocks').delete().in('id', idsToDelete));
    }
    if (inserts.length) {
      ops.push(supabase.from('time_blocks').insert(inserts.map(i => ({ ...i, user_id: user.id }))));
    }
    const results = await Promise.all(ops);
    for (const r of results) {
      if (r.error) throw r.error;
    }
    qc.invalidateQueries({ queryKey: ['time_blocks'] });
    return { added: inserts.length, skipped };
  }, [isGuest, user, qc]);

  return { blocks, add, update, remove, cloneDays, isLoading: !isGuest && cloudQuery.isLoading };
};
