import { useState, useRef } from 'react';
import { format, getDaysInMonth, startOfMonth, getDay } from 'date-fns';
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface HabitTrackerProps {
  habits: Habit[];
  completions: Completion[];
  onAddHabit: (name: string, color?: string) => void;
  onDeleteHabit: (id: string) => void;
  onToggleCompletion: (habitId: string, date: string) => void;
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
  currentMonth,
  onMonthChange,
}: HabitTrackerProps) => {
  const [newHabit, setNewHabit] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [showAdd, setShowAdd] = useState(false);
  const [animatingCell, setAnimatingCell] = useState<string | null>(null);

  const daysInMonth = getDaysInMonth(currentMonth);
  const today = format(new Date(), 'yyyy-MM-dd');

  const handleAdd = () => {
    if (newHabit.trim()) {
      onAddHabit(newHabit.trim(), selectedColor);
      setNewHabit('');
      setShowAdd(false);
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
          <div className="flex items-center gap-2">
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
                  <th className="text-left p-3 font-medium text-muted-foreground sticky left-0 bg-card/90 backdrop-blur-sm min-w-[120px]">
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
                    <td className="p-3 sticky left-0 bg-card/90 backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: habit.color || '#6B9080' }} />
                        <span className="text-foreground font-medium truncate max-w-[80px]">{habit.name}</span>
                        <button
                          onClick={() => onDeleteHabit(habit.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                        >
                          <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    </td>
                    {Array.from({ length: daysInMonth }, (_, i) => {
                      const day = i + 1;
                      const dateStr = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day), 'yyyy-MM-dd');
                      const completed = isCompleted(habit.id, dateStr);
                      const cellKey = `${habit.id}-${dateStr}`;
                      const isToday = dateStr === today;

                      return (
                        <td key={day} className="p-1 text-center">
                          <button
                            onClick={() => handleToggle(habit.id, dateStr)}
                            className={cn(
                              'w-6 h-6 rounded-md transition-all duration-200 inline-flex items-center justify-center',
                              completed ? 'scale-100' : 'bg-muted/50 hover:bg-muted',
                              isToday && !completed && 'ring-1 ring-primary/30',
                              animatingCell === cellKey && 'animate-check-pop'
                            )}
                            style={completed ? { backgroundColor: habit.color || '#6B9080', opacity: 0.85 } : {}}
                          >
                            {completed && (
                              <svg className="w-3 h-3 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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
