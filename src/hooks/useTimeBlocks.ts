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
    const { error } = await supabase.from('time_blocks').delete().eq('id', id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: ['time_blocks'] });
  }, [isGuest, qc]);

  return { blocks, add, update, remove, isLoading: !isGuest && cloudQuery.isLoading };
};
