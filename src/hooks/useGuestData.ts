import { useState, useCallback } from 'react';

interface GuestHabit {
  id: string;
  name: string;
  description: string | null;
  color: string;
  is_active: boolean;
  created_at: string;
}

interface GuestCompletion {
  id: string;
  habit_id: string;
  completion_date: string;
}

interface GuestTodo {
  id: string;
  task: string;
  completed: boolean;
  due_date: string;
  created_at: string;
}

const HABITS_KEY = 'guest_habits';
const COMPLETIONS_KEY = 'guest_completions';
const TODOS_KEY = 'guest_todos';

const getStored = <T,>(key: string): T[] => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
};

const setStored = <T,>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const useGuestData = () => {
  const [habits, setHabits] = useState<GuestHabit[]>(() => getStored(HABITS_KEY));
  const [completions, setCompletions] = useState<GuestCompletion[]>(() => getStored(COMPLETIONS_KEY));
  const [todos, setTodos] = useState<GuestTodo[]>(() => getStored(TODOS_KEY));

  const addHabit = useCallback((name: string, description?: string, color?: string) => {
    const habit: GuestHabit = {
      id: crypto.randomUUID(),
      name,
      description: description || null,
      color: color || '#6B9080',
      is_active: true,
      created_at: new Date().toISOString(),
    };
    const updated = [...habits, habit];
    setHabits(updated);
    setStored(HABITS_KEY, updated);
    return habit;
  }, [habits]);

  const deleteHabit = useCallback((id: string) => {
    const updated = habits.filter(h => h.id !== id);
    setHabits(updated);
    setStored(HABITS_KEY, updated);
    const updatedCompletions = completions.filter(c => c.habit_id !== id);
    setCompletions(updatedCompletions);
    setStored(COMPLETIONS_KEY, updatedCompletions);
  }, [habits, completions]);

  const toggleCompletion = useCallback((habitId: string, date: string) => {
    const existing = completions.find(c => c.habit_id === habitId && c.completion_date === date);
    let updated: GuestCompletion[];
    if (existing) {
      updated = completions.filter(c => c.id !== existing.id);
    } else {
      updated = [...completions, { id: crypto.randomUUID(), habit_id: habitId, completion_date: date }];
    }
    setCompletions(updated);
    setStored(COMPLETIONS_KEY, updated);
  }, [completions]);

  const addTodo = useCallback((task: string, dueDate: string) => {
    const todo: GuestTodo = {
      id: crypto.randomUUID(),
      task,
      completed: false,
      due_date: dueDate,
      created_at: new Date().toISOString(),
    };
    const updated = [...todos, todo];
    setTodos(updated);
    setStored(TODOS_KEY, updated);
    return todo;
  }, [todos]);

  const toggleTodo = useCallback((id: string) => {
    const updated = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTodos(updated);
    setStored(TODOS_KEY, updated);
  }, [todos]);

  const deleteTodo = useCallback((id: string) => {
    const updated = todos.filter(t => t.id !== id);
    setTodos(updated);
    setStored(TODOS_KEY, updated);
  }, [todos]);

  return {
    habits,
    completions,
    todos,
    addHabit,
    deleteHabit,
    toggleCompletion,
    addTodo,
    toggleTodo,
    deleteTodo,
  };
};
