import { useState } from 'react';
import { format, getDaysInMonth } from 'date-fns';
import { Plus, Trash2, ChevronLeft, ChevronRight, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Habit {
  id: string;
  name: string;
  color: string | null;
  weekly_goal?: number;
  created_at?: string;
}

interface Completion {
  habit_id: string;
  completion_date: string;
}

interface HabitTrackerProps {
  habits: Habit[];
  completions: Completion[];
  onAddHabit: (name: string, color?: string, weeklyGoal?: number) => void;
  onDeleteHabit: (id: string) => void;
  onToggleCompletion: (habitId: string, date: string) => void;
  onUpdateGoal: (id: string, goal: number) => void;
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

const COLORS = ['#6B9080', '#A4C3B2', '#CCE3DE', '#EAF4F4', '#F6BD60', '#E8A87C', '#D8A7B1', '#B5838D'];

const HabitTracker = ({
  habits,
  completions,
  onAddHabit,
  onDeleteHabit,
  onToggleCompletion,
  onUpdateGoal,
  currentMonth,
  onMonthChange,
}: HabitTrackerProps) => {
  const [newHabit, setNewHabit] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [weeklyGoal, setWeeklyGoal] = useState(7);
  const [showAdd, setShowAdd] = useState(false);
  const [animatingCell, setAnimatingCell] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState<string | null>(null);

  const daysInMonth = getDaysInMonth(currentMonth);
  const today = format(new Date(), 'yyyy-MM-dd');

  const handleAdd = () => {
    if (newHabit.trim()) {
      onAddHabit(newHabit.trim(), selectedColor, weeklyGoal);
      setNewHabit('');
      setShowAdd(false);
      setWeeklyGoal(7);
    }
  };

  const handleToggle = (habitId: string, date: string) => {
    const cellKey = `${habitId}-${date}`;
    setAnimatingCell(cellKey);
    setTimeout(() => setAnimatingCell(null), 300);
    onToggleCompletion(habitId, date);
  };

  const isCompleted = (habitId: string, date: string) =>
    completions.some(c => c.habit_id === habitId && c.completion_date === date);

  const prevMonth = () => {
    onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 rounded-lg">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-serif font-semibold text-foreground">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 rounded-lg">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdd(!showAdd)}
          className="rounded-lg text-primary hover:text-primary"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Habit
        </Button>
      </div>

      {showAdd && (
        <div className="glass rounded-xl p-4 space-y-3 animate-fade-in-up">
          <Input
            placeholder="e.g., Meditate, Read, Exercise..."
            value={newHabit}
            onChange={e => setNewHabit(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="rounded-lg border-border bg-background/50"
          />
          <div className="flex items-center gap-2 flex-wrap">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setSelectedColor(c)}
                className={cn(
                  'w-6 h-6 rounded-full transition-all',
                  selectedColor === c ? 'ring-2 ring-offset-2 ring-foreground/30 scale-110' : 'hover:scale-105'
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Target className="w-3.5 h-3.5" />
              <span>Weekly goal:</span>
            </div>
            <Select value={String(weeklyGoal)} onValueChange={v => setWeeklyGoal(Number(v))}>
              <SelectTrigger className="w-20 h-8 rounded-lg text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1,2,3,4,5,6,7].map(n => (
                  <SelectItem key={n} value={String(n)}>{n} day{n > 1 ? 's' : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleAdd} className="ml-auto rounded-lg">
              Add
            </Button>
          </div>
        </div>
      )}

      {habits.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-muted-foreground text-sm">No habits yet. Add your first habit to start tracking!</p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left p-3 font-medium text-muted-foreground sticky left-0 z-20 bg-card backdrop-blur-sm min-w-[140px]">
                    Habit
                  </th>
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    const dateStr = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day), 'yyyy-MM-dd');
                    const isToday = dateStr === today;
                    return (
                      <th
                        key={day}
                        className={cn(
                          'p-1 text-center font-medium min-w-[28px]',
                          isToday ? 'text-primary' : 'text-muted-foreground'
                        )}
                      >
                        {day}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {habits.map(habit => (
                  <tr key={habit.id} className="border-t border-border/30 group">
                    <td className="p-3 sticky left-0 z-20 bg-card backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: habit.color || '#6B9080' }} />
                        <span className="text-foreground font-medium truncate max-w-[60px]">{habit.name}</span>
                        <button
                          onClick={() => setEditingGoal(editingGoal === habit.id ? null : habit.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Edit weekly goal"
                        >
                          <Target className="w-3 h-3 text-muted-foreground hover:text-primary" />
                        </button>
                        <button
                          onClick={() => onDeleteHabit(habit.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                      {editingGoal === habit.id && (
                        <div className="mt-1 flex items-center gap-1">
                          <Select
                            value={String((habit as any).weekly_goal ?? 7)}
                            onValueChange={v => { onUpdateGoal(habit.id, Number(v)); setEditingGoal(null); }}
                          >
                            <SelectTrigger className="h-6 w-16 text-[10px] rounded">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[1,2,3,4,5,6,7].map(n => (
                                <SelectItem key={n} value={String(n)}>{n}d/wk</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </td>
                    {Array.from({ length: daysInMonth }, (_, i) => {
                      const day = i + 1;
                      const dateStr = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day), 'yyyy-MM-dd');
                      const completed = isCompleted(habit.id, dateStr);
                      const cellKey = `${habit.id}-${dateStr}`;
                      const isToday = dateStr === today;
                      const isPast = dateStr < today;
                      const isMissed = isPast && !completed;
                      const isClickable = !isPast || isToday;

                      return (
                        <td key={day} className="p-1 text-center">
                          <button
                            onClick={() => isClickable && handleToggle(habit.id, dateStr)}
                            disabled={!isClickable}
                            className={cn(
                              'w-6 h-6 rounded-md transition-all duration-200 inline-flex items-center justify-center',
                              completed ? 'scale-100' : isMissed ? 'bg-destructive/10' : 'bg-muted/50 hover:bg-muted',
                              isToday && !completed && 'ring-1 ring-primary/30',
                              !isClickable && !completed && 'cursor-default',
                              animatingCell === cellKey && 'animate-check-pop'
                            )}
                            style={completed ? { backgroundColor: habit.color || '#6B9080', opacity: 0.85 } : {}}
                          >
                            {completed && (
                              <svg className="w-3 h-3 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            {isMissed && (
                              <svg className="w-3 h-3 text-destructive/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitTracker;
