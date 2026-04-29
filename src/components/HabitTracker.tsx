import { useMemo, useState } from 'react';
import { format, getDaysInMonth, subDays } from 'date-fns';
import { Plus, Trash2, ChevronLeft, ChevronRight, Target, Flame } from 'lucide-react';
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

const COLORS = ['#6B9080', '#A4C3B2', '#7C9EE8', '#F6BD60', '#E8A87C', '#D8A7B1', '#B5838D', '#9CA3AF'];

const calcStreak = (habitId: string, completions: Completion[]) => {
  const set = new Set(completions.filter(c => c.habit_id === habitId).map(c => c.completion_date));
  if (set.size === 0) return 0;
  let date = new Date();
  if (!set.has(format(date, 'yyyy-MM-dd'))) date = subDays(date, 1);
  let n = 0;
  for (let i = 0; i < 365; i++) {
    if (set.has(format(date, 'yyyy-MM-dd'))) { n++; date = subDays(date, 1); } else break;
  }
  return n;
};

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

  const today = format(new Date(), 'yyyy-MM-dd');
  const daysInMonth = getDaysInMonth(currentMonth);

  const handleAdd = () => {
    if (newHabit.trim()) {
      onAddHabit(newHabit.trim(), selectedColor, weeklyGoal);
      setNewHabit('');
      setShowAdd(false);
      setWeeklyGoal(7);
    }
  };

  const isCompleted = (habitId: string, date: string) =>
    completions.some(c => c.habit_id === habitId && c.completion_date === date);

  const prevMonth = () => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  const weekDates = useMemo(() => {
    const t = new Date();
    const dow = t.getDay();
    const arr: string[] = [];
    for (let i = 0; i <= dow; i++) {
      const d = new Date(t); d.setDate(t.getDate() - dow + i);
      arr.push(format(d, 'yyyy-MM-dd'));
    }
    return arr;
  }, []);

  return (
    <div className="space-y-4">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 rounded-lg">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-base font-serif font-semibold text-foreground tracking-tight">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 rounded-lg">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdd(s => !s)}
          className="rounded-lg text-primary hover:text-primary h-8"
        >
          <Plus className="w-4 h-4 mr-1" /> New habit
        </Button>
      </div>

      {/* Add panel */}
      {showAdd && (
        <div className="glass rounded-2xl p-4 space-y-3 animate-fade-in">
          <Input
            placeholder="e.g., Meditate, Read, Exercise…"
            value={newHabit}
            onChange={e => setNewHabit(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="rounded-lg text-sm"
          />
          <div className="flex items-center gap-2 flex-wrap">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setSelectedColor(c)}
                className={cn(
                  'w-6 h-6 rounded-full transition-all',
                  selectedColor === c ? 'ring-2 ring-offset-2 ring-foreground/30 scale-110' : 'hover:scale-110'
                )}
                style={{ backgroundColor: c }}
              />
            ))}
            <div className="flex items-center gap-1.5 ml-2 text-[11px] text-muted-foreground">
              <Target className="w-3 h-3" /> Weekly goal:
            </div>
            <Select value={String(weeklyGoal)} onValueChange={v => setWeeklyGoal(Number(v))}>
              <SelectTrigger className="w-24 h-8 rounded-md text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1,2,3,4,5,6,7].map(n => (
                  <SelectItem key={n} value={String(n)}>{n} / week</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleAdd} className="ml-auto rounded-md h-8">Add</Button>
          </div>
        </div>
      )}

      {/* Habit cards */}
      {habits.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <p className="text-muted-foreground text-sm">
            No habits yet. Tap "New habit" to begin.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {habits.map(habit => {
            const goal = (habit as any).weekly_goal ?? 7;
            const streak = calcStreak(habit.id, completions);
            const weekDone = completions.filter(c => c.habit_id === habit.id && weekDates.includes(c.completion_date)).length;
            const color = habit.color || '#6B9080';
            const habitCreated = habit.created_at ? format(new Date(habit.created_at), 'yyyy-MM-dd') : null;

            return (
              <div key={habit.id} className="glass rounded-2xl p-4 group hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <h3 className="font-medium text-foreground truncate">{habit.name}</h3>
                    {streak > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Flame className="w-3 h-3 text-warm" />
                        {streak}d
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground tabular-nums">{weekDone}/{goal} wk</span>
                    <Select
                      value={String(goal)}
                      onValueChange={v => onUpdateGoal(habit.id, Number(v))}
                    >
                      <SelectTrigger className="h-7 w-[72px] text-[11px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5,6,7].map(n => <SelectItem key={n} value={String(n)}>{n}/wk</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteHabit(habit.id)}
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Day circles */}
                <div className="overflow-x-auto -mx-1 px-1">
                  <div className="flex items-center gap-1.5 min-w-max pb-1">
                    {Array.from({ length: daysInMonth }, (_, i) => {
                      const day = i + 1;
                      const dateStr = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day), 'yyyy-MM-dd');
                      const completed = isCompleted(habit.id, dateStr);
                      const isToday = dateStr === today;
                      const isPast = dateStr < today;
                      const isFuture = dateStr > today;
                      const isBeforeCreation = habitCreated ? dateStr < habitCreated : false;
                      const isMissed = isPast && !completed && !isBeforeCreation;
                      const isClickable = !isBeforeCreation && !isFuture;

                      return (
                        <button
                          key={day}
                          onClick={() => isClickable && onToggleCompletion(habit.id, dateStr)}
                          disabled={!isClickable}
                          title={dateStr}
                          className={cn(
                            'relative w-7 h-7 rounded-full transition-all duration-200 inline-flex items-center justify-center text-[10px] font-medium shrink-0',
                            isBeforeCreation && 'opacity-0 pointer-events-none',
                            !isBeforeCreation && !completed && !isMissed && 'bg-muted/50 hover:bg-muted text-muted-foreground',
                            !isBeforeCreation && !completed && isMissed && 'bg-destructive/10 text-destructive/70',
                            isToday && !completed && !isBeforeCreation && 'ring-2 ring-primary/40',
                            !isClickable && !completed && !isBeforeCreation && 'cursor-default',
                          )}
                          style={completed ? { backgroundColor: color, color: 'white' } : {}}
                        >
                          {completed ? (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : isMissed ? (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          ) : (
                            day
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HabitTracker;
