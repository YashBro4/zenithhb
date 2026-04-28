import { useMemo } from 'react';
import { format, eachDayOfInterval, startOfYear, endOfYear, getDay, subDays, parseISO } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
  LineChart, Line, CartesianGrid, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie,
  AreaChart, Area,
} from 'recharts';
import { Flame, Target } from 'lucide-react';
import { useTimeBlocks, CATEGORY_COLORS } from '@/hooks/useTimeBlocks';
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

interface StatsViewProps {
  habits: Habit[];
  completions: Completion[];
  currentMonth: Date;
}

const calculateStreak = (habitId: string, completions: Completion[]): number => {
  const habitCompletions = completions
    .filter(c => c.habit_id === habitId)
    .map(c => c.completion_date)
    .sort()
    .reverse();

  if (habitCompletions.length === 0) return 0;

  let streak = 0;
  let checkDate = new Date();
  // If today isn't completed, start from yesterday
  const todayStr = format(checkDate, 'yyyy-MM-dd');
  if (!habitCompletions.includes(todayStr)) {
    checkDate = subDays(checkDate, 1);
  }

  for (let i = 0; i < 365; i++) {
    const dateStr = format(checkDate, 'yyyy-MM-dd');
    if (habitCompletions.includes(dateStr)) {
      streak++;
      checkDate = subDays(checkDate, 1);
    } else {
      break;
    }
  }
  return streak;
};

const StatsView = ({ habits, completions, currentMonth }: StatsViewProps) => {
  const { blocks: timeBlocks } = useTimeBlocks();

  // Map habit name -> life pillar (for radar). Heuristic keyword match.
  const pillarOf = (name: string): 'Health' | 'Wealth' | 'Logic' | 'Spirit' | 'Craft' => {
    const n = name.toLowerCase();
    if (/(gym|run|exercise|walk|yoga|sleep|water|meditat|stretch|workout|cardio|diet|eat)/.test(n)) return 'Health';
    if (/(invest|save|budget|money|trade|earn|sell|client|business|finance)/.test(n)) return 'Wealth';
    if (/(read|study|learn|code|practice|review|research|write notes)/.test(n)) return 'Logic';
    if (/(pray|reflect|journal|gratitude|breathe|meditat|spirit)/.test(n)) return 'Spirit';
    return 'Craft';
  };

  const monthlyData = useMemo(() => {
    if (habits.length === 0) return [];
    return habits.map(habit => {
      const habitCompletions = completions.filter(c => c.habit_id === habit.id);
      const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
      const percentage = Math.round((habitCompletions.length / daysInMonth) * 100);
      return { name: habit.name, percentage, color: habit.color || '#6B9080', count: habitCompletions.length, total: daysInMonth };
    });
  }, [habits, completions, currentMonth]);

  const streaks = useMemo(() => {
    return habits.map(h => ({
      ...h,
      streak: calculateStreak(h.id, completions),
      weeklyGoal: (h as any).weekly_goal ?? 7,
    }));
  }, [habits, completions]);

  // Weekly goal progress (current week)
  const weeklyProgress = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun
    const weekStart = subDays(today, dayOfWeek);
    const weekDates: string[] = [];
    for (let i = 0; i <= dayOfWeek; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      weekDates.push(format(d, 'yyyy-MM-dd'));
    }

    return habits.map(habit => {
      const completed = completions.filter(
        c => c.habit_id === habit.id && weekDates.includes(c.completion_date)
      ).length;
      const goal = (habit as any).weekly_goal ?? 7;
      return { name: habit.name, completed, goal, color: habit.color || '#6B9080', percentage: Math.min(100, Math.round((completed / goal) * 100)) };
    });
  }, [habits, completions]);

  const heatmapData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const days = eachDayOfInterval({ start: startOfYear(new Date(year, 0, 1)), end: endOfYear(new Date(year, 0, 1)) });
    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const count = completions.filter(c => c.completion_date === dateStr).length;
      return { date: day, dateStr, count };
    });
  }, [completions, currentMonth]);

  const maxCount = Math.max(...heatmapData.map(d => d.count), 1);

  const getHeatColor = (count: number) => {
    if (count === 0) return 'bg-muted/40';
    const intensity = count / maxCount;
    if (intensity <= 0.25) return 'bg-primary/20';
    if (intensity <= 0.5) return 'bg-primary/40';
    if (intensity <= 0.75) return 'bg-primary/60';
    return 'bg-primary/90';
  };

  const weeks = useMemo(() => {
    const result: typeof heatmapData[] = [];
    let currentWeek: typeof heatmapData = [];
    const firstDay = heatmapData[0]?.date;
    if (firstDay) {
      const dayOfWeek = getDay(firstDay);
      for (let i = 0; i < dayOfWeek; i++) currentWeek.push({ date: new Date(), dateStr: '', count: -1 });
    }
    heatmapData.forEach(d => {
      currentWeek.push(d);
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
    });
    if (currentWeek.length > 0) result.push(currentWeek);
    return result;
  }, [heatmapData]);

  const overallPercentage = useMemo(() => {
    if (habits.length === 0) return 0;
    const total = monthlyData.reduce((a, b) => a + b.total, 0);
    const completed = monthlyData.reduce((a, b) => a + b.count, 0);
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [monthlyData, habits]);

  const longestStreak = useMemo(() => Math.max(0, ...streaks.map(s => s.streak)), [streaks]);

  // Growth data: potential vs current for each day of the month
  const growthData = useMemo(() => {
    if (habits.length === 0) return [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    const data = [];
    let cumulativeCurrent = 0;
    let cumulativePotential = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = format(new Date(year, month, day), 'yyyy-MM-dd');
      
      // Count how many habits existed on this day
      const activeHabits = habits.filter(h => {
        if (!h.created_at) return true;
        const createdDate = format(new Date(h.created_at), 'yyyy-MM-dd');
        return dateStr >= createdDate;
      });

      const potentialForDay = activeHabits.length;
      cumulativePotential += potentialForDay;

      // Only count actual completions up to today
      if (dateStr <= todayStr) {
        const completedForDay = completions.filter(
          c => c.completion_date === dateStr && activeHabits.some(h => h.id === c.habit_id)
        ).length;
        cumulativeCurrent += completedForDay;
      }

      data.push({
        day,
        potential: cumulativePotential,
        current: dateStr <= todayStr ? cumulativeCurrent : null,
      });
    }
    return data;
  }, [habits, completions, currentMonth]);

  // Radar: balance across life pillars (last 30 days)
  const radarData = useMemo(() => {
    const pillars = ['Health', 'Wealth', 'Logic', 'Spirit', 'Craft'] as const;
    const today = new Date();
    const since = subDays(today, 30);
    const sinceStr = format(since, 'yyyy-MM-dd');
    const result = pillars.map(p => {
      const habitsInPillar = habits.filter(h => pillarOf(h.name) === p);
      if (habitsInPillar.length === 0) return { pillar: p, score: 0 };
      const ids = new Set(habitsInPillar.map(h => h.id));
      const completedRecent = completions.filter(c => ids.has(c.habit_id) && c.completion_date >= sinceStr).length;
      const possible = habitsInPillar.length * 30;
      return { pillar: p, score: Math.round((completedRecent / possible) * 100) };
    });
    return result;
  }, [habits, completions]);

  // Donut: today's time distribution from time blocks
  const timeDistribution = useMemo(() => {
    const today = new Date().getDay();
    const totals: Record<string, number> = {};
    timeBlocks.filter(b => b.day_of_week === today).forEach(b => {
      totals[b.category] = (totals[b.category] ?? 0) + (b.end_minute - b.start_minute);
    });
    return Object.entries(totals).map(([cat, mins]) => ({
      name: cat,
      value: mins,
      color: CATEGORY_COLORS[cat] ?? '#9CA3AF',
    }));
  }, [timeBlocks]);

  // Stacked area: per-habit completions across the month
  const stackedAreaData = useMemo(() => {
    if (habits.length === 0) return [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const out: Array<Record<string, number | string>> = [];
    const totals: Record<string, number> = {};
    habits.forEach(h => { totals[h.id] = 0; });
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = format(new Date(year, month, d), 'yyyy-MM-dd');
      if (dateStr > todayStr) break;
      habits.forEach(h => {
        if (completions.some(c => c.habit_id === h.id && c.completion_date === dateStr)) {
          totals[h.id] += 1;
        }
      });
      const row: Record<string, number | string> = { day: d };
      habits.forEach(h => { row[h.name] = totals[h.id]; });
      out.push(row);
    }
    return out;
  }, [habits, completions, currentMonth]);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-serif font-semibold text-foreground">Statistics</h2>

      {/* Streak & Progress Cards */}
      {habits.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="glass rounded-2xl p-4 text-center">
            <Flame className="w-6 h-6 text-warm mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{longestStreak}</p>
            <p className="text-[10px] text-muted-foreground">Best Streak</p>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <Target className="w-6 h-6 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{overallPercentage}%</p>
            <p className="text-[10px] text-muted-foreground">Monthly Progress</p>
          </div>
        </div>
      )}

      {/* Per-habit streaks & weekly goals */}
      {streaks.length > 0 && (
        <div className="glass rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-medium text-foreground">Streaks & Weekly Goals</h3>
          {streaks.map((habit, i) => {
            const wp = weeklyProgress[i];
            return (
              <div key={habit.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: habit.color || '#6B9080' }} />
                    <span className="text-xs font-medium text-foreground">{habit.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-warm" />
                      {habit.streak}d
                    </span>
                    <span>{wp?.completed}/{wp?.goal} this week</span>
                  </div>
                </div>
                <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${wp?.percentage || 0}%`, backgroundColor: habit.color || '#6B9080' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Overall Progress Ring */}
      <div className="glass rounded-2xl p-6 text-center">
        <div className="relative w-28 h-28 mx-auto mb-4">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="42" fill="none"
              stroke="hsl(var(--primary))" strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${overallPercentage * 2.64} ${264 - overallPercentage * 2.64}`}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-foreground">{overallPercentage}%</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Monthly Progress · {format(currentMonth, 'MMMM yyyy')}
        </p>
      </div>

      {/* Per-habit chart */}
      {monthlyData.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h3 className="text-sm font-medium text-foreground mb-4">Habit Breakdown</h3>
          <ResponsiveContainer width="100%" height={habits.length * 40 + 20}>
            <BarChart data={monthlyData} layout="vertical" margin={{ left: 0, right: 10 }}>
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [`${value}%`, 'Progress']}
              />
              <Bar dataKey="percentage" radius={[0, 6, 6, 0]} barSize={16}>
                {monthlyData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Growth Line Chart */}
      {growthData.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h3 className="text-sm font-medium text-foreground mb-1">Growth Tracking</h3>
          <p className="text-[10px] text-muted-foreground mb-4">Potential vs Current completions · {format(currentMonth, 'MMMM yyyy')}</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={growthData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                width={35}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                }}
                formatter={(value: number | null, name: string) => [
                  value !== null ? value : '—',
                  name === 'potential' ? 'Potential' : 'Current'
                ]}
                labelFormatter={(day) => `Day ${day}`}
              />
              <Legend
                formatter={(value) => (value === 'potential' ? 'Potential Growth' : 'Current Growth')}
                wrapperStyle={{ fontSize: '11px' }}
              />
              <Line
                type="monotone"
                dataKey="potential"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="current"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                dot={false}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Yearly Heatmap */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-medium text-foreground mb-4">
          {currentMonth.getFullYear()} Activity
        </h3>
        <div className="overflow-x-auto">
          <div className="flex gap-[3px]" style={{ minWidth: '680px' }}>
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day, di) => (
                  <div
                    key={di}
                    className={cn(
                      'w-[11px] h-[11px] rounded-[2px] transition-colors',
                      day.count === -1 ? 'bg-transparent' : getHeatColor(day.count)
                    )}
                    title={day.count >= 0 ? `${day.dateStr}: ${day.count} completions` : ''}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1 mt-3 justify-end text-[10px] text-muted-foreground">
          <span>Less</span>
          <div className="w-[11px] h-[11px] rounded-[2px] bg-muted/40" />
          <div className="w-[11px] h-[11px] rounded-[2px] bg-primary/20" />
          <div className="w-[11px] h-[11px] rounded-[2px] bg-primary/40" />
          <div className="w-[11px] h-[11px] rounded-[2px] bg-primary/60" />
          <div className="w-[11px] h-[11px] rounded-[2px] bg-primary/90" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
};

export default StatsView;
