import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Leaf, BarChart3, ListTodo, Grid3X3, LogOut, Settings, CalendarRange } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useHabits, useHabitCompletions, useAllCompletions, useAddHabit, useDeleteHabit, useToggleCompletion, useTodos, useAddTodo, useToggleTodo, useDeleteTodo, useUpdateHabitGoal } from '@/hooks/useSupabaseData';
import { useGuestData } from '@/hooks/useGuestData';
import HabitTracker from '@/components/HabitTracker';
import TodoList from '@/components/TodoList';
import StatsView from '@/components/StatsView';
import ProfileSettings from '@/components/ProfileSettings';
import ThemeToggle from '@/components/ThemeToggle';
import GreatnessHero from '@/components/GreatnessHero';
import Timetable from '@/components/Timetable';
import NotificationPrompt from '@/components/NotificationPrompt';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getRandomQuote } from '@/lib/quotes';

type View = 'habits' | 'todos' | 'combined' | 'stats' | 'timetable' | 'profile';

const Dashboard = () => {
  const { user, isGuest, signOut, exitGuestMode } = useAuth();
  const [view, setView] = useState<View>('combined');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = format(new Date(), 'yyyy-MM-dd');
  const [motivationShown, setMotivationShown] = useState<string | null>(null);

  // Supabase hooks
  const { data: sbHabits = [] } = useHabits();
  const { data: sbCompletions = [] } = useHabitCompletions(currentMonth);
  const { data: allCompletions = [] } = useAllCompletions();
  const { data: sbTodos = [] } = useTodos(today);
  const addHabitMut = useAddHabit();
  const deleteHabitMut = useDeleteHabit();
  const toggleCompMut = useToggleCompletion();
  const addTodoMut = useAddTodo();
  const toggleTodoMut = useToggleTodo();
  const deleteTodoMut = useDeleteTodo();
  const updateGoalMut = useUpdateHabitGoal();

  // Guest hooks
  const guest = useGuestData();

  const habits = isGuest ? guest.habits : sbHabits;
  const completions = isGuest ? guest.completions : sbCompletions;
  const allComps = isGuest ? guest.completions : allCompletions;
  const todos = isGuest ? guest.todos.filter(t => t.due_date === today) : sbTodos;

  const handleAddHabit = (name: string, color?: string, weeklyGoal?: number) => {
    if (isGuest) {
      guest.addHabit(name, undefined, color, weeklyGoal);
    } else {
      addHabitMut.mutate({ name, color, weeklyGoal });
    }
  };

  const handleDeleteHabit = (id: string) => {
    if (isGuest) guest.deleteHabit(id);
    else deleteHabitMut.mutate(id);
  };

  const handleToggleCompletion = (habitId: string, date: string) => {
    if (isGuest) guest.toggleCompletion(habitId, date);
    else toggleCompMut.mutate({ habitId, date });
  };

  const handleUpdateGoal = (id: string, goal: number) => {
    if (isGuest) guest.updateHabitGoal(id, goal);
    else updateGoalMut.mutate({ id, weeklyGoal: goal });
  };

  const handleAddTodo = (task: string) => {
    if (isGuest) guest.addTodo(task, today);
    else addTodoMut.mutate({ task, dueDate: today });
  };

  const handleToggleTodo = (id: string, completed: boolean) => {
    if (isGuest) guest.toggleTodo(id);
    else toggleTodoMut.mutate({ id, completed });
  };

  const handleDeleteTodo = (id: string) => {
    if (isGuest) guest.deleteTodo(id);
    else deleteTodoMut.mutate(id);
  };

  // Motivation engine
  useEffect(() => {
    if (habits.length === 0) return;
    const todayCompletions = completions.filter(c => c.completion_date === today);
    const percentage = (todayCompletions.length / habits.length) * 100;
    if (percentage >= 80 && motivationShown !== today) {
      const quote = getRandomQuote();
      setMotivationShown(today);
      toast.success(`🎉 "${quote.text}"`, {
        description: `— ${quote.author}`,
        duration: 6000,
      });
    }
  }, [completions, habits, today, motivationShown]);

  const handleSignOut = async () => {
    if (isGuest) exitGuestMode();
    else await signOut();
  };

  const mainViews: { id: View; icon: React.ReactNode; label: string }[] = [
    { id: 'combined', icon: <Grid3X3 className="w-4 h-4" />, label: 'All' },
    { id: 'habits', icon: <BarChart3 className="w-4 h-4" />, label: 'Habits' },
    { id: 'todos', icon: <ListTodo className="w-4 h-4" />, label: 'To-Dos' },
    { id: 'timetable', icon: <CalendarRange className="w-4 h-4" />, label: 'Timetable' },
    { id: 'stats', icon: <BarChart3 className="w-4 h-4" />, label: 'Stats' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 glass border-b border-border/30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-primary" />
            <span className="font-serif font-semibold text-foreground">Zenith</span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setView('profile')}
              className="h-8 w-8 rounded-lg text-muted-foreground"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-8 w-8 rounded-lg text-muted-foreground">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* View Selector */}
      {view !== 'profile' && (
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <div className="flex gap-1 p-1 bg-muted/50 rounded-xl w-fit">
            {mainViews.map(v => (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  view === v.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {v.icon}
                {v.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        {view === 'profile' && (
          <ProfileSettings onBack={() => setView('combined')} />
        )}

        {view === 'combined' && <GreatnessHero />}

        {(view === 'habits' || view === 'combined') && (
          <HabitTracker
            habits={habits}
            completions={completions}
            onAddHabit={handleAddHabit}
            onDeleteHabit={handleDeleteHabit}
            onToggleCompletion={handleToggleCompletion}
            onUpdateGoal={handleUpdateGoal}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
          />
        )}

        {(view === 'todos' || view === 'combined') && (
          <TodoList
            todos={todos}
            onAddTodo={handleAddTodo}
            onToggleTodo={handleToggleTodo}
            onDeleteTodo={handleDeleteTodo}
            dateLabel={format(new Date(), 'EEEE, MMMM d')}
          />
        )}

        {view === 'timetable' && <Timetable />}

        {view === 'stats' && (
          <StatsView
            habits={habits}
            completions={allComps}
            currentMonth={currentMonth}
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
