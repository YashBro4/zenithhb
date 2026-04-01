import { useMemo } from 'react';
import { format, eachDayOfInterval, startOfYear, endOfYear, getDay, startOfWeek, endOfWeek } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { cn } from '@/lib/utils';

interface Habit {
  id: string;
  name: string;
  color: string | null;
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

const StatsView = ({ habits, completions, currentMonth }: StatsViewProps) => {
  const monthlyData = useMemo(() => {
    if (habits.length === 0) return [];
    return habits.map(habit => {
      const habitCompletions = completions.filter(c => c.habit_id === habit.id);
      const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
      const percentage = Math.round((habitCompletions.length / daysInMonth) * 100);
      return { name: habit.name, percentage, color: habit.color || '#6B9080', count: habitCompletions.length, total: daysInMonth };
    });
  }, [habits, completions, currentMonth]);

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

  // Group heatmap by weeks
  const weeks = useMemo(() => {
    const result: typeof heatmapData[] = [];
    let currentWeek: typeof heatmapData = [];
    // Pad start
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

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-serif font-semibold text-foreground">Statistics</h2>

      {/* Overall Progress */}
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
