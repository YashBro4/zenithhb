import { useEffect, useMemo, useRef, useState } from 'react';
import { format, getDaysInMonth, subDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ChevronLeft, ChevronRight, Target, Flame, Search, Command } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
  const [filter, setFilter] = useState('');
  const [holdingCell, setHoldingCell] = useState<string | null>(null);
  const filterRef = useRef<HTMLInputElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  const today = format(new Date(), 'yyyy-MM-dd');
  const daysInMonth = getDaysInMonth(currentMonth);

  // Cmd/Ctrl+K -> focus filter; "n" -> open add panel
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setFilter('');
        filterRef.current?.focus();
      } else if (!meta && e.key === 'n' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setShowAdd(true);
        setTimeout(() => addInputRef.current?.focus(), 50);
      } else if (e.key === 'Escape') {
        setShowAdd(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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

  const filtered = useMemo(
    () => habits.filter(h => h.name.toLowerCase().includes(filter.toLowerCase())),
    [habits, filter]
  );

  // Click-and-hold to complete: progress ring fills, then commits.
  const HOLD_MS = 380;
  const holdTimer = useRef<number | null>(null);
  const startHold = (habitId: string, date: string, isClickable: boolean) => {
    if (!isClickable) return;
    const key = `${habitId}-${date}`;
    setHoldingCell(key);
    holdTimer.current = window.setTimeout(() => {
      onToggleCompletion(habitId, date);
      setHoldingCell(null);
      holdTimer.current = null;
    }, HOLD_MS);
  };
  const cancelHold = () => {
    if (holdTimer.current) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
    setHoldingCell(null);
  };

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
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
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

        <div className="flex items-center gap-2 flex-1 min-w-[180px] max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              ref={filterRef}
              placeholder="Filter habits…"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="h-8 pl-8 pr-12 text-xs rounded-lg bg-background/60"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-0.5 text-[9px] text-muted-foreground border border-border/60 rounded px-1 py-0.5 font-mono">
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setShowAdd(s => !s); setTimeout(() => addInputRef.current?.focus(), 50); }}
          className="rounded-lg text-primary hover:text-primary h-8"
        >
          <Plus className="w-4 h-4 mr-1" />
          New <kbd className="ml-1 hidden md:inline text-[9px] opacity-60">N</kbd>
        </Button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass rounded-xl p-3 space-y-2.5">
              <Input
                ref={addInputRef}
                placeholder="e.g., Meditate, Read, Exercise…  (Enter to add)"
                value={newHabit}
                onChange={e => setNewHabit(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                className="rounded-lg text-sm h-9"
              />
              <div className="flex items-center gap-2 flex-wrap">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={cn(
                      'w-5 h-5 rounded-md transition-all',
                      selectedColor === c ? 'ring-2 ring-offset-2 ring-foreground/30 scale-110' : 'hover:scale-110'
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <div className="flex items-center gap-1.5 ml-2 text-[10px] text-muted-foreground">
                  <Target className="w-3 h-3" /> Goal:
                </div>
                <Select value={String(weeklyGoal)} onValueChange={v => setWeeklyGoal(Number(v))}>
                  <SelectTrigger className="w-20 h-7 rounded-md text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7].map(n => (
                      <SelectItem key={n} value={String(n)}>{n}/wk</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={handleAdd} className="ml-auto rounded-md h-7 text-xs">Add</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <p className="text-muted-foreground text-sm">
            {habits.length === 0 ? 'No habits yet. Press N to add your first one.' : 'No habits match your filter.'}
          </p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          {/* Software-grade list rows */}
          <div className="divide-y divide-border/30">
            {filtered.map(habit => {
              const goal = (habit as any).weekly_goal ?? 7;
              const streak = calcStreak(habit.id, completions);
              const weekDone = completions.filter(c => c.habit_id === habit.id && weekDates.includes(c.completion_date)).length;
              const pct = Math.min(100, Math.round((weekDone / goal) * 100));
              const todayDone = isCompleted(habit.id, today);
              const color = habit.color || '#6B9080';

              const status: 'success' | 'progress' | 'skipped' =
                pct >= 100 ? 'success' : weekDone > 0 ? 'progress' : 'skipped';
              const statusStyle = {
                success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
                progress: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
                skipped: 'bg-slate-500/15 text-slate-500 dark:text-slate-400 border-slate-500/30',
              }[status];

              return (
                <div key={habit.id} className="group">
                  {/* Row header */}
                  <div className="flex items-center gap-3 px-3 py-2 hover:bg-muted/30 transition-colors">
                    <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground truncate">{habit.name}</span>
                        <Badge variant="outline" className={cn('text-[9px] py-0 px-1.5 capitalize border', statusStyle)}>
                          {status}
                        </Badge>
                        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Flame className={cn('w-3 h-3', streak > 0 ? 'text-warm' : 'text-muted-foreground/50')} />
                          {streak}d
                        </span>
                        <span className="text-[10px] text-muted-foreground">{weekDone}/{goal} wk</span>
                      </div>
                      <div className="mt-1 h-1 rounded-full bg-muted/40 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                    <Select
                      value={String(goal)}
                      onValueChange={v => onUpdateGoal(habit.id, Number(v))}
                    >
                      <SelectTrigger className="h-7 w-[64px] text-[10px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
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

                  {/* Day grid */}
                  <div className="px-3 pb-2 -mt-0.5 overflow-x-auto">
                    <div className="flex items-center gap-[3px] min-w-max">
                      {Array.from({ length: daysInMonth }, (_, i) => {
                        const day = i + 1;
                        const dateStr = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day), 'yyyy-MM-dd');
                        const completed = isCompleted(habit.id, dateStr);
                        const cellKey = `${habit.id}-${dateStr}`;
                        const isToday = dateStr === today;
                        const isPast = dateStr < today;
                        const isFuture = dateStr > today;
                        const habitCreated = habit.created_at ? format(new Date(habit.created_at), 'yyyy-MM-dd') : null;
                        const isBeforeCreation = habitCreated ? dateStr < habitCreated : false;
                        const isMissed = isPast && !completed && !isBeforeCreation;
                        const isClickable = !isBeforeCreation && !isFuture; // allow toggling past or today via hold
                        const holding = holdingCell === cellKey;

                        return (
                          <button
                            key={day}
                            onMouseDown={() => startHold(habit.id, dateStr, isClickable)}
                            onMouseUp={cancelHold}
                            onMouseLeave={cancelHold}
                            onTouchStart={() => startHold(habit.id, dateStr, isClickable)}
                            onTouchEnd={cancelHold}
                            disabled={!isClickable}
                            title={`${dateStr}${isClickable ? ' — hold to toggle' : ''}`}
                            className={cn(
                              'relative w-5 h-5 rounded transition-all duration-200 inline-flex items-center justify-center text-[8px] font-medium shrink-0',
                              isBeforeCreation && 'bg-transparent cursor-default',
                              !isBeforeCreation && !completed && !isMissed && 'bg-muted/40 hover:bg-muted',
                              !isBeforeCreation && !completed && isMissed && 'bg-destructive/10',
                              isToday && !completed && !isBeforeCreation && 'ring-1 ring-primary/40',
                              !isClickable && !completed && 'cursor-default',
                            )}
                            style={completed ? { backgroundColor: color } : {}}
                          >
                            {completed && (
                              <svg className="w-2.5 h-2.5 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            {!completed && isMissed && (
                              <svg className="w-2.5 h-2.5 text-destructive/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                            {/* Hold-to-confirm progress ring */}
                            {holding && (
                              <motion.span
                                className="absolute inset-0 rounded ring-2 ring-primary"
                                initial={{ scale: 0.6, opacity: 0.2 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: HOLD_MS / 1000, ease: 'easeOut' }}
                              />
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
        </div>
      )}
    </div>
  );
};

export default HabitTracker;
