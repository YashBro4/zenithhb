import { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTimeBlocks, CATEGORIES, CATEGORY_COLORS, type TimeBlock, type NewTimeBlock } from '@/hooks/useTimeBlocks';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOUR_HEIGHT = 44; // px per hour
const HOURS_VISIBLE = 18; // 6am - 12am
const HOUR_START = 6;

const minutesToLabel = (m: number) => {
  const h = Math.floor(m / 60);
  const min = m % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(min).padStart(2, '0')} ${ampm}`;
};

const minutesToTimeInput = (m: number) => {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

const timeInputToMinutes = (s: string) => {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
};

interface EditState {
  id?: string;
  title: string;
  category: string;
  day_of_week: number;
  start_minute: number;
  end_minute: number;
  notes: string;
}

const Timetable = () => {
  const { blocks, add, update, remove } = useTimeBlocks();
  const [editing, setEditing] = useState<EditState | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current hour on mount
  useEffect(() => {
    if (!scrollRef.current) return;
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const offset = ((minutes - HOUR_START * 60) / 60) * HOUR_HEIGHT - 100;
    scrollRef.current.scrollTop = Math.max(0, offset);
  }, []);

  const blocksByDay = useMemo(() => {
    const map: Record<number, TimeBlock[]> = {};
    for (let i = 0; i < 7; i++) map[i] = [];
    blocks.forEach(b => map[b.day_of_week]?.push(b));
    return map;
  }, [blocks]);

  const openNew = (day: number, startMinute = 9 * 60) => {
    setEditing({
      title: '',
      category: 'work',
      day_of_week: day,
      start_minute: startMinute,
      end_minute: startMinute + 60,
      notes: '',
    });
  };

  const openEdit = (b: TimeBlock) => {
    setEditing({
      id: b.id,
      title: b.title,
      category: b.category,
      day_of_week: b.day_of_week,
      start_minute: b.start_minute,
      end_minute: b.end_minute,
      notes: b.notes ?? '',
    });
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim()) {
      toast.error('Add a title for this block');
      return;
    }
    if (editing.end_minute <= editing.start_minute) {
      toast.error('End must be after start');
      return;
    }
    const payload: NewTimeBlock = {
      title: editing.title.trim(),
      category: editing.category,
      color: CATEGORY_COLORS[editing.category],
      day_of_week: editing.day_of_week,
      start_minute: editing.start_minute,
      end_minute: editing.end_minute,
      notes: editing.notes.trim() || null,
    };
    try {
      if (editing.id) await update(editing.id, payload);
      else await add(payload);
      setEditing(null);
      toast.success(editing.id ? 'Block updated' : 'Block added');
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to save');
    }
  };

  const removeBlock = async () => {
    if (!editing?.id) return;
    await remove(editing.id);
    setEditing(null);
    toast.success('Block removed');
  };

  const today = new Date().getDay();
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const nowOffset = ((nowMinutes - HOUR_START * 60) / 60) * HOUR_HEIGHT;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-serif font-semibold text-foreground">The Architect</h2>
          <p className="text-xs text-muted-foreground">Design your week. Click any cell to add a block.</p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {CATEGORIES.map(c => (
            <span key={c} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground capitalize">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[c] }} />
              {c}
            </span>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[48px_repeat(7,1fr)] border-b border-border/30 bg-card/60">
          <div />
          {DAYS.map((d, i) => (
            <div
              key={d}
              className={cn(
                'p-2 text-center text-[11px] font-medium border-l border-border/30',
                i === today ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Body */}
        <div ref={scrollRef} className="overflow-y-auto max-h-[560px]">
          <div
            className="grid grid-cols-[48px_repeat(7,1fr)] relative"
            style={{ height: HOURS_VISIBLE * HOUR_HEIGHT }}
          >
            {/* Hour labels + grid */}
            <div className="relative border-r border-border/30">
              {Array.from({ length: HOURS_VISIBLE }, (_, i) => {
                const h = HOUR_START + i;
                return (
                  <div
                    key={h}
                    className="absolute left-0 right-0 text-[9px] text-muted-foreground/70 pl-1.5"
                    style={{ top: i * HOUR_HEIGHT - 5 }}
                  >
                    {((h + 11) % 12) + 1} {h >= 12 ? 'PM' : 'AM'}
                  </div>
                );
              })}
            </div>

            {DAYS.map((_, dayIdx) => (
              <div
                key={dayIdx}
                className={cn(
                  'relative border-l border-border/30',
                  dayIdx === today && 'bg-primary/[0.03]'
                )}
              >
                {/* Hour grid lines + click targets */}
                {Array.from({ length: HOURS_VISIBLE }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => openNew(dayIdx, (HOUR_START + i) * 60)}
                    className="absolute left-0 right-0 border-t border-border/20 hover:bg-primary/5 transition-colors"
                    style={{ top: i * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                    aria-label={`Add block at ${HOUR_START + i}:00`}
                  />
                ))}

                {/* Now indicator on today's column */}
                {dayIdx === today && nowOffset >= 0 && nowOffset <= HOURS_VISIBLE * HOUR_HEIGHT && (
                  <div
                    className="absolute left-0 right-0 z-10 pointer-events-none"
                    style={{ top: nowOffset }}
                  >
                    <div className="h-px bg-destructive/70" />
                    <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-destructive" />
                  </div>
                )}

                {/* Blocks */}
                {blocksByDay[dayIdx]?.map(b => {
                  const top = ((b.start_minute - HOUR_START * 60) / 60) * HOUR_HEIGHT;
                  const height = ((b.end_minute - b.start_minute) / 60) * HOUR_HEIGHT;
                  const color = b.color || CATEGORY_COLORS[b.category] || '#6B9080';
                  return (
                    <motion.button
                      key={b.id}
                      layout
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      onClick={(e) => { e.stopPropagation(); openEdit(b); }}
                      className="absolute left-0.5 right-0.5 rounded-md p-1.5 text-left overflow-hidden border z-20 group hover:shadow-md transition-shadow"
                      style={{
                        top: Math.max(0, top),
                        height: Math.max(20, height - 2),
                        backgroundColor: `${color}25`,
                        borderColor: `${color}66`,
                      }}
                    >
                      <div className="flex items-start gap-1">
                        <div className="w-0.5 self-stretch rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-semibold text-foreground truncate leading-tight">
                            {b.title}
                          </p>
                          <p className="text-[9px] text-muted-foreground truncate">
                            {minutesToLabel(b.start_minute)}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">{editing?.id ? 'Edit block' : 'New time block'}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <Input
                placeholder="What are you doing?"
                value={editing.title}
                onChange={e => setEditing({ ...editing, title: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && save()}
                autoFocus
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Day</label>
                  <Select
                    value={String(editing.day_of_week)}
                    onValueChange={v => setEditing({ ...editing, day_of_week: Number(v) })}
                  >
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DAYS.map((d, i) => <SelectItem key={d} value={String(i)}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Category</label>
                  <Select
                    value={editing.category}
                    onValueChange={v => setEditing({ ...editing, category: v })}
                  >
                    <SelectTrigger className="h-9 capitalize"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c} value={c} className="capitalize">
                          <span className="inline-flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[c] }} />
                            {c}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Start</label>
                  <Input
                    type="time"
                    value={minutesToTimeInput(editing.start_minute)}
                    onChange={e => setEditing({ ...editing, start_minute: timeInputToMinutes(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">End</label>
                  <Input
                    type="time"
                    value={minutesToTimeInput(editing.end_minute)}
                    onChange={e => setEditing({ ...editing, end_minute: timeInputToMinutes(e.target.value) })}
                  />
                </div>
              </div>
              <Input
                placeholder="Notes (optional)"
                value={editing.notes}
                onChange={e => setEditing({ ...editing, notes: e.target.value })}
              />
              <div className="flex items-center justify-between pt-1">
                {editing.id ? (
                  <Button variant="ghost" size="sm" onClick={removeBlock} className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                  </Button>
                ) : <span />}
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
                  <Button size="sm" onClick={save}>Save</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Timetable;
