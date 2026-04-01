import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export const useHabits = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['habits', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useHabitCompletions = (month: Date) => {
  const { user } = useAuth();
  const startDate = format(new Date(month.getFullYear(), month.getMonth(), 1), 'yyyy-MM-dd');
  const endDate = format(new Date(month.getFullYear(), month.getMonth() + 1, 0), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['habit_completions', user?.id, startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habit_completions')
        .select('*')
        .gte('completion_date', startDate)
        .lte('completion_date', endDate);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useAllCompletions = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['all_completions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habit_completions')
        .select('*');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useAddHabit = () => {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ name, description, color }: { name: string; description?: string; color?: string }) => {
      const { data, error } = await supabase
        .from('habits')
        .insert({ name, description, color, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits'] }),
  });
};

export const useDeleteHabit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('habits').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habits'] });
      qc.invalidateQueries({ queryKey: ['habit_completions'] });
    },
  });
};

export const useToggleCompletion = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ habitId, date }: { habitId: string; date: string }) => {
      const { data: existing } = await supabase
        .from('habit_completions')
        .select('id')
        .eq('habit_id', habitId)
        .eq('completion_date', date)
        .maybeSingle();

      if (existing) {
        await supabase.from('habit_completions').delete().eq('id', existing.id);
      } else {
        await supabase.from('habit_completions').insert({ habit_id: habitId, completion_date: date });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habit_completions'] }),
  });
};

export const useTodos = (date: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['todos', user?.id, date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('due_date', date)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useAddTodo = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ task, dueDate }: { task: string; dueDate: string }) => {
      const { data, error } = await supabase
        .from('todos')
        .insert({ task, due_date: dueDate, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['todos'] }),
  });
};

export const useToggleTodo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase.from('todos').update({ completed }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['todos'] }),
  });
};

export const useDeleteTodo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('todos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['todos'] }),
  });
};
