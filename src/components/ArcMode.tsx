import { useEffect, useMemo, useState } from 'react';
import { addDays, addMonths, differenceInCalendarDays, format, subDays } from 'date-fns';
import { Check, ChevronDown, Flame, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

type DurationMode = 'months' | 'days';
type Priority = 'Critical' | 'High' | 'Medium';

interface ArcRule {
  id: string;
  text: string;
}

interface ArcHabit {
  id: string;
  name: string;
  createdOn: string;
  completedDates: string[];
}

interface ArcTask {
  id: string;
  title: string;
  priority: Priority;
  targetDate: string;
  completedOn: string | null;
}

interface ArcState {
  title: string;
  startDate: string;
  durationMode: DurationMode;
  duration: number;
  rules: ArcRule[];
  pledgedDates: string[];
  habits: ArcHabit[];
  tasks: ArcTask[];
}

const STORAGE_KEY = 'zenith_arc_mode_v1';
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const dateKey = (date: Date) => format(date, 'yyyy-MM-dd');
const localDate = (key: string) => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
};
const isDateKey = (value: unknown): value is string => {
  if (typeof value !== 'string' || !DAY_PATTERN.test(value)) return false;
  const parsed = localDate(value);
  return Number.isFinite(parsed.getTime()) && dateKey(parsed) === value;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isRule(value: unknown): value is ArcRule {
  return isRecord(value) && typeof value.id === 'string' && typeof value.text === 'string';
}

function isHabit(value: unknown): value is ArcHabit {
  return isRecord(value) && typeof value.id === 'string' && typeof value.name === 'string' &&
    isDateKey(value.createdOn) && Array.isArray(value.completedDates) && value.completedDates.every(isDateKey);
}

function isTask(value: unknown): value is ArcTask {
  return isRecord(value) && typeof value.id === 'string' && typeof value.title === 'string' &&
    ['Critical', 'High', 'Medium'].includes(String(value.priority)) && isDateKey(value.targetDate) &&
    (value.completedOn === null || isDateKey(value.completedOn));
}

function defaultArc(): ArcState {
  return {
    title: 'My Arc',
    startDate: dateKey(new Date()),
    durationMode: 'days',
    duration: 90,
    rules: Array.from({ length: 3 }, () => ({ id: crypto.randomUUID(), text: '' })),
    pledgedDates: [],
    habits: [],
    tasks: [],
  };
}

function loadArc(): ArcState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultArc();
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value)) return defaultArc();
    const base = defaultArc();
    const durationMode: DurationMode = value.durationMode === 'months' ? 'months' : 'days';
    const maximum = durationMode === 'months' ? 12 : 3650;
    const duration = typeof value.duration === 'number' && Number.isFinite(value.duration)
      ? Math.min(maximum, Math.max(1, Math.round(value.duration)))
      : base.duration;
    const rules = Array.isArray(value.rules) ? value.rules.filter(isRule).slice(0, 7) : base.rules;
    while (rules.length < 3) rules.push({ id: crypto.randomUUID(), text: '' });
    return {
      title: typeof value.title === 'string' ? value.title : base.title,
      startDate: isDateKey(value.startDate) ? value.startDate : base.startDate,
      durationMode,
      duration,
      rules,
      pledgedDates: Array.isArray(value.pledgedDates) ? value.pledgedDates.filter(isDateKey) : [],
      habits: Array.isArray(value.habits) ? value.habits.filter(isHabit) : [],
      tasks: Array.isArray(value.tasks) ? value.tasks.filter(isTask) : [],
    };
  } catch {
    return defaultArc();
  }
}

const priorityOrder: Record<Priority, number> = { Critical: 0, High: 1, Medium: 2 };
const priorityStyle: Record<Priority, string> = {
  Critical: 'border-destructive/40 bg-destructive/10 text-destructive',
  High: 'border-warm/50 bg-warm/10 text-warm-foreground',
  Medium: 'border-primary/30 bg-primary/10 text-primary',
};

const ArcMode = () => {
  const [arc, setArc] = useState<ArcState>(loadArc);
  const [now, setNow] = useState(() => new Date());
  const [newHabit, setNewHabit] = useState('');
  const [newTask, setNewTask] = useState('');
  const [taskPriority, setTaskPriority] = useState<Priority>('High');
  const [taskDate, setTaskDate] = useState(() => dateKey(addDays(new Date(), 7)));

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arc));
    } catch {
      // Keep the current session usable if browser storage is unavailable.
    }
  }, [arc]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const today = dateKey(now);
  const start = localDate(arc.startDate);
  const durationDays = arc.durationMode === 'months'
    ? Math.max(1, differenceInCalendarDays(addMonths(start, arc.duration), start))
    : arc.duration;
  const endExclusive = addDays(start, durationDays);
  const finalDay = addDays(endExclusive, -1);
  const elapsedDays = now < start ? 0 : Math.min(durationDays, differenceInCalendarDays(now, start) + 1);
  const remainingDays = Math.max(0, durationDays - elapsedDays);
  const currentDay = elapsedDays;
  const arcIsLive = today >= arc.startDate && today < dateKey(endExclusive);
  const rulesReady = arc.rules.length >= 3 && arc.rules.filter(rule => rule.text.trim()).length >= 3;
  const sortedTasks = useMemo(
    () => [...arc.tasks].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority] || a.targetDate.localeCompare(b.targetDate)),
    [arc.tasks],
  );

  const updateArc = (update: (current: ArcState) => ArcState) => setArc(current => update(current));
  const setDurationMode = (mode: DurationMode) => updateArc(current => ({
    ...current,
    durationMode: mode,
    duration: mode === 'months' ? (current.durationMode === 'months' ? current.duration : 3) : (current.durationMode === 'days' ? current.duration : 90),
  }));

  const todayHabits = arc.habits.filter(habit => habit.createdOn <= today);
  const todayTasks = arc.tasks.filter(task => task.targetDate === today);
  const todayCompleted = todayHabits.filter(habit => habit.completedDates.includes(today)).length +
    todayTasks.filter(task => task.completedOn !== null).length;
  const todayItems = todayHabits.length + todayTasks.length;
  const todayPercent = todayItems ? Math.round((todayCompleted / todayItems) * 100) : 0;

  const arcAdherence = useMemo(() => {
    if (elapsedDays === 0) return 0;
    let possible = 0;
    let completed = 0;
    for (let index = 0; index < elapsedDays; index += 1) {
      const key = dateKey(addDays(start, index));
      possible += 1;
      if (arc.pledgedDates.includes(key)) completed += 1;
      arc.habits.forEach(habit => {
        if (habit.createdOn <= key) {
          possible += 1;
          if (habit.completedDates.includes(key)) completed += 1;
        }
      });
    }
    arc.tasks.forEach(task => {
      if (task.targetDate >= arc.startDate && task.targetDate <= today) {
        possible += 1;
        if (task.completedOn) completed += 1;
      }
    });
    return possible ? Math.round((completed / possible) * 100) : 0;
  }, [arc, elapsedDays, start, today]);

  const overallProgress = Math.round((elapsedDays / durationDays) * arcAdherence);

  const toggleHabit = (habitId: string, day = today) => updateArc(current => ({
    ...current,
    habits: current.habits.map(habit => {
      if (habit.id !== habitId) return habit;
      const dates = new Set(habit.completedDates);
      if (dates.has(day)) dates.delete(day);
      else dates.add(day);
      return { ...habit, completedDates: [...dates].sort() };
    }),
  }));

  const toggleTask = (taskId: string) => updateArc(current => ({
    ...current,
    tasks: current.tasks.map(task => task.id === taskId
      ? { ...task, completedOn: task.completedOn ? null : today }
      : task),
  }));

  const togglePledge = () => updateArc(current => ({
    ...current,
    pledgedDates: current.pledgedDates.includes(today)
      ? current.pledgedDates.filter(date => date !== today)
      : [...current.pledgedDates, today].sort(),
  }));

  const addRule = () => {
    if (arc.rules.length >= 7) return;
    updateArc(current => ({ ...current, rules: [...current.rules, { id: crypto.randomUUID(), text: '' }] }));
  };

  const addHabit = () => {
    const name = newHabit.trim();
    if (!name) return;
    updateArc(current => ({ ...current, habits: [...current.habits, { id: crypto.randomUUID(), name, createdOn: today, completedDates: [] }] }));
    setNewHabit('');
  };

  const addTask = () => {
    const title = newTask.trim();
    if (!title || !isDateKey(taskDate)) return;
    updateArc(current => ({
      ...current,
      tasks: [...current.tasks, { id: crypto.randomUUID(), title, priority: taskPriority, targetDate: taskDate, completedOn: null }],
    }));
    setNewTask('');
  };

  const streakFor = (habit: ArcHabit) => {
    const completed = new Set(habit.completedDates);
    let cursor = localDate(today);
    if (!completed.has(dateKey(cursor))) cursor = subDays(cursor, 1);
    let streak = 0;
    while (streak < 3650 && completed.has(dateKey(cursor)) && dateKey(cursor) >= habit.createdOn) {
      streak += 1;
      cursor = subDays(cursor, 1);
    }
    return streak;
  };

  const week = Array.from({ length: 7 }, (_, index) => dateKey(subDays(localDate(today), 6 - index)));

  return (
    <div className="space-y-8 pb-8">
      <details open className="rounded-lg border-2 border-warm/60 bg-warm/5 shadow-sm">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-4 sm:px-5">
          <ShieldCheck className="h-5 w-5 shrink-0 text-warm" />
          <span className="min-w-0 flex-1">
            <span className="block font-serif text-lg font-semibold text-foreground">Arc Rules / Manifesto</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">Non-Negotiable Code · {arc.rules.length}/7</span>
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </summary>
        <div className="space-y-3 border-t border-warm/20 px-4 py-4 sm:px-5">
          {arc.rules.map((rule, index) => (
            <div key={rule.id} className="flex items-center gap-2">
              <span className="w-8 shrink-0 text-xs font-semibold tabular-nums text-warm">{String(index + 1).padStart(2, '0')}</span>
              <Input
                value={rule.text}
                maxLength={160}
                aria-label={`Arc rule ${index + 1}`}
                placeholder={`Add non-negotiable rule ${index + 1}`}
                onChange={event => updateArc(current => ({
                  ...current,
                  rules: current.rules.map(item => item.id === rule.id ? { ...item, text: event.target.value } : item),
                }))}
                className="h-10 border-warm/20 bg-background/70"
              />
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove rule ${index + 1}`}
                onClick={() => updateArc(current => ({ ...current, rules: current.rules.filter(item => item.id !== rule.id) }))}
                disabled={arc.rules.length <= 3}
                className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <Button variant="outline" size="sm" onClick={addRule} disabled={arc.rules.length >= 7}>
              <Plus className="mr-1.5 h-4 w-4" /> Add rule
            </Button>
            <Button
              variant={arc.pledgedDates.includes(today) ? 'default' : 'outline'}
              size="sm"
              onClick={togglePledge}
              disabled={!rulesReady || !arcIsLive}
              aria-pressed={arc.pledgedDates.includes(today)}
              className="border-warm/50"
            >
              <Check className="mr-1.5 h-4 w-4" /> I pledge to uphold these rules today
            </Button>
          </div>
        </div>
      </details>

      <section aria-labelledby="arc-title" className="space-y-5 border-b border-border/60 pb-7">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="min-w-0">
            <label htmlFor="arc-title" className="mb-1 block text-xs font-medium text-muted-foreground">Arc title</label>
            <Input
              id="arc-title"
              value={arc.title}
              maxLength={80}
              onChange={event => updateArc(current => ({ ...current, title: event.target.value }))}
              className="h-auto border-0 bg-transparent px-0 py-1 font-serif text-2xl font-semibold shadow-none focus-visible:ring-0 sm:text-3xl"
            />
            <p className="mt-1 text-sm text-muted-foreground">
              {currentDay > 0 ? `Day ${currentDay} of ${durationDays}` : `Day 0 of ${durationDays}`}
              <span className="mx-2">·</span>{remainingDays} {remainingDays === 1 ? 'day' : 'days'} remaining
              <span className="mx-2">·</span>Ends {format(finalDay, 'MMM d, yyyy')}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-3xl font-semibold tabular-nums text-primary">{overallProgress}%</p>
            <p className="text-xs text-muted-foreground">overall Arc progress</p>
          </div>
        </div>

        <div
          role="progressbar"
          aria-label="Overall Arc progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={overallProgress}
          className="h-2 overflow-hidden rounded-full bg-muted"
        >
          <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${overallProgress}%` }} />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="arc-start">Start date</label>
            <Input id="arc-start" type="date" value={arc.startDate} onChange={event => {
              if (isDateKey(event.target.value)) updateArc(current => ({ ...current, startDate: event.target.value }));
            }} />
          </div>
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Duration type</span>
            <div className="flex gap-2">
              <Button size="sm" variant={arc.durationMode === 'months' ? 'default' : 'outline'} onClick={() => setDurationMode('months')} className="flex-1">Months</Button>
              <Button size="sm" variant={arc.durationMode === 'days' ? 'default' : 'outline'} onClick={() => setDurationMode('days')} className="flex-1">Custom days</Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="arc-duration">Arc length</label>
            {arc.durationMode === 'months' ? (
              <Select value={String(arc.duration)} onValueChange={value => updateArc(current => ({ ...current, duration: Number(value) }))}>
                <SelectTrigger id="arc-duration"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 6].map(months => <SelectItem key={months} value={String(months)}>{months} {months === 1 ? 'month' : 'months'}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="arc-duration"
                type="number"
                inputMode="numeric"
                min={1}
                max={3650}
                value={arc.duration}
                onChange={event => {
                  const next = Number(event.target.value);
                  if (Number.isFinite(next) && next >= 1 && next <= 3650) updateArc(current => ({ ...current, duration: Math.round(next) }));
                }}
              />
            )}
          </div>
        </div>
        {!arcIsLive && (
          <p className="text-xs text-muted-foreground">
            {today < arc.startDate ? `This Arc starts ${format(start, 'MMMM d, yyyy')}.` : 'This Arc has reached its end date.'}
          </p>
        )}
      </section>

      <section aria-labelledby="daily-checklist" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary">{format(now, 'EEEE, MMMM d')}</p>
            <h2 id="daily-checklist" className="mt-1 font-serif text-xl font-semibold">Today’s non-negotiables</h2>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold tabular-nums">{todayCompleted}/{todayItems} complete</p>
            <p className="text-xs text-muted-foreground">{todayPercent}% daily completion</p>
          </div>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${todayPercent}%` }} />
        </div>
        {todayItems === 0 ? (
          <p className="border-y border-border/60 py-5 text-sm text-muted-foreground">Add an Arc habit or schedule a milestone for today.</p>
        ) : (
          <ul className="divide-y divide-border/60 border-y border-border/60">
            {todayHabits.map(habit => {
              const done = habit.completedDates.includes(today);
              return (
                <li key={habit.id} className="flex min-h-12 items-center gap-3 py-2">
                  <Button variant={done ? 'default' : 'outline'} size="icon" disabled={!arcIsLive} aria-label={`${done ? 'Uncheck' : 'Complete'} habit ${habit.name}`} onClick={() => toggleHabit(habit.id)} className="h-7 w-7 shrink-0 rounded-full">
                    {done && <Check className="h-4 w-4" />}
                  </Button>
                  <span className={cn('min-w-0 flex-1 text-sm', done && 'text-muted-foreground line-through')}>{habit.name}</span>
                  <span className="text-[10px] text-muted-foreground">Habit</span>
                </li>
              );
            })}
            {todayTasks.map(task => {
              const done = task.completedOn !== null;
              return (
                <li key={task.id} className="flex min-h-12 items-center gap-3 py-2">
                  <Button variant={done ? 'default' : 'outline'} size="icon" aria-label={`${done ? 'Uncheck' : 'Complete'} task ${task.title}`} onClick={() => toggleTask(task.id)} className="h-7 w-7 shrink-0 rounded-full">
                    {done && <Check className="h-4 w-4" />}
                  </Button>
                  <span className={cn('min-w-0 flex-1 text-sm', done && 'text-muted-foreground line-through')}>{task.title}</span>
                  <span className={cn('rounded-sm border px-1.5 py-0.5 text-[10px]', priorityStyle[task.priority])}>{task.priority}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="arc-habits" className="space-y-4">
        <div>
          <h2 id="arc-habits" className="font-serif text-xl font-semibold">Arc habits</h2>
          <p className="mt-1 text-xs text-muted-foreground">Daily disciplines · last seven days</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            aria-label="New Arc habit"
            placeholder="Add a daily discipline"
            value={newHabit}
            maxLength={100}
            onChange={event => setNewHabit(event.target.value)}
            onKeyDown={event => event.key === 'Enter' && addHabit()}
          />
          <Button onClick={addHabit} disabled={!newHabit.trim()} className="shrink-0"><Plus className="mr-1.5 h-4 w-4" />Add habit</Button>
        </div>
        {arc.habits.length === 0 ? (
          <p className="border-y border-border/60 py-5 text-sm text-muted-foreground">Your daily disciplines will appear here.</p>
        ) : (
          <ul className="divide-y divide-border/60 border-y border-border/60">
            {arc.habits.map(habit => (
              <li key={habit.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                <span className="min-w-0 flex-1 text-sm font-medium">{habit.name}</span>
                <span className="inline-flex items-center gap-1 text-xs tabular-nums text-muted-foreground"><Flame className="h-3.5 w-3.5 text-warm" />{streakFor(habit)} day streak</span>
                <div className="flex items-center gap-1.5" aria-label="Last seven days">
                  {week.map(day => {
                    const eligible = day >= habit.createdOn;
                    const done = habit.completedDates.includes(day);
                    return (
                      <span
                        key={day}
                        title={`${format(localDate(day), 'EEE, MMM d')}${eligible ? done ? ' · complete' : ' · not complete' : ' · before habit started'}`}
                        className={cn('h-2.5 w-2.5 rounded-full', !eligible && 'border border-border bg-background', eligible && done && 'bg-primary', eligible && !done && 'bg-muted')}
                      />
                    );
                  })}
                </div>
                <Button variant="ghost" size="icon" aria-label={`Delete habit ${habit.name}`} onClick={() => updateArc(current => ({ ...current, habits: current.habits.filter(item => item.id !== habit.id) }))} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="arc-tasks" className="space-y-4">
        <div>
          <h2 id="arc-tasks" className="font-serif text-xl font-semibold">Arc milestones</h2>
          <p className="mt-1 text-xs text-muted-foreground">Targets · sorted by priority, then date</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_130px_160px_auto]">
          <Input
            aria-label="New Arc milestone"
            placeholder="What will you accomplish?"
            value={newTask}
            maxLength={140}
            onChange={event => setNewTask(event.target.value)}
            onKeyDown={event => event.key === 'Enter' && addTask()}
          />
          <Select value={taskPriority} onValueChange={value => setTaskPriority(value as Priority)}>
            <SelectTrigger aria-label="Milestone priority"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Critical">Critical</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
            </SelectContent>
          </Select>
          <Input aria-label="Milestone target date" type="date" value={taskDate} onChange={event => {
            if (isDateKey(event.target.value)) setTaskDate(event.target.value);
          }} />
          <Button onClick={addTask} disabled={!newTask.trim()}><Plus className="mr-1.5 h-4 w-4" />Add target</Button>
        </div>
        {sortedTasks.length === 0 ? (
          <p className="border-y border-border/60 py-5 text-sm text-muted-foreground">Set a target date for your first Arc milestone.</p>
        ) : (
          <ul className="divide-y divide-border/60 border-y border-border/60">
            {sortedTasks.map(task => {
              const done = task.completedOn !== null;
              return (
                <li key={task.id} className="flex flex-wrap items-center gap-3 py-3">
                  <Button variant={done ? 'default' : 'outline'} size="icon" aria-label={`${done ? 'Uncheck' : 'Complete'} milestone ${task.title}`} onClick={() => toggleTask(task.id)} className="h-7 w-7 shrink-0 rounded-full">
                    {done && <Check className="h-4 w-4" />}
                  </Button>
                  <span className={cn('min-w-0 flex-1 text-sm', done && 'text-muted-foreground line-through')}>{task.title}</span>
                  <span className={cn('rounded-sm border px-1.5 py-0.5 text-[10px]', priorityStyle[task.priority])}>{task.priority}</span>
                  <time dateTime={task.targetDate} className="w-24 text-right text-xs tabular-nums text-muted-foreground">{format(localDate(task.targetDate), 'MMM d, yyyy')}</time>
                  <Button variant="ghost" size="icon" aria-label={`Delete milestone ${task.title}`} onClick={() => updateArc(current => ({ ...current, tasks: current.tasks.filter(item => item.id !== task.id) }))} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

export default ArcMode;