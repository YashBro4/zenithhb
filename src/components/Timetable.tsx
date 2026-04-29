import { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, X, Clock, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
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
  const { blocks, add, update, remove, cloneDays } = useTimeBlocks();
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

  // Layout blocks per day with collision detection: assigns each block a column index and the
  // total number of overlapping columns so we can auto-stack them side-by-side.
  type LaidOut = TimeBlock & { _col: number; _cols: number };
  const blocksByDay = useMemo(() => {
    const map: Record<number, LaidOut[]> = {};
    for (let i = 0; i < 7; i++) map[i] = [];
    for (let day = 0; day < 7; day++) {
      const dayBlocks = blocks
        .filter(b => b.day_of_week === day)
        .sort((a, b) => a.start_minute - b.start_minute || a.end_minute - b.end_minute);

      // Group into clusters of mutually-overlapping blocks.
      let cluster: TimeBlock[] = [];
      let clusterEnd = -1;
      const flush = () => {
        if (!cluster.length) return;
        // Greedy column assignment within the cluster.
        const cols: TimeBlock[][] = [];
        const colOf = new Map<string, number>();
        cluster.forEach(b => {
          let placed = false;
          for (let i = 0; i < cols.length; i++) {
            const last = cols[i][cols[i].length - 1];
            if (last.end_minute <= b.start_minute) {
              cols[i].push(b);
              colOf.set(b.id, i);
              placed = true;
              break;
            }
          }
          if (!placed) {
            cols.push([b]);
            colOf.set(b.id, cols.length - 1);
          }
        });
        const total = cols.length;
        cluster.forEach(b => {
          map[day].push({ ...b, _col: colOf.get(b.id) ?? 0, _cols: total });
        });
        cluster = [];
        clusterEnd = -1;
      };

      dayBlocks.forEach(b => {
        if (cluster.length === 0 || b.start_minute < clusterEnd) {
          cluster.push(b);
          clusterEnd = Math.max(clusterEnd, b.end_minute);
        } else {
          flush();
          cluster.push(b);
          clusterEnd = b.end_minute;
        }
      });
      flush();
    }
    return map;
  }, [blocks]);

  // True if a candidate block overlaps any existing block on its day (excluding itself when editing).
  const hasConflict = (candidate: { day_of_week: number; start_minute: number; end_minute: number; id?: string }) => {
    return blocks.some(b =>
      b.day_of_week === candidate.day_of_week &&
      b.id !== candidate.id &&
      candidate.start_minute < b.end_minute &&
      b.start_minute < candidate.end_minute
    );
  };

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
    if (hasConflict({
      day_of_week: editing.day_of_week,
      start_minute: editing.start_minute,
      end_minute: editing.end_minute,
      id: editing.id,
    })) {
      toast.error('Time conflict — this block overlaps an existing one');
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

  // ---------- Apply-to-Days (Clone) ----------
  const [cloneSourceDay, setCloneSourceDay] = useState<number | null>(null);
  const [cloneTargets, setCloneTargets] = useState<number[]>([]);
  const [cloneMode, setCloneMode] = useState<'merge' | 'replace'>('merge');
  const [confirmClone, setConfirmClone] = useState(false);

  const openClone = (day: number) => {
    setCloneSourceDay(day);
    setCloneTargets([]);
    setCloneMode('merge');
  };

  const toggleCloneTarget = (day: number) => {
    setCloneTargets(t => t.includes(day) ? t.filter(d => d !== day) : [...t, day]);
  };

  const runClone = async () => {
    if (cloneSourceDay === null || cloneTargets.length === 0) return;
    const source = blocks.filter(b => b.day_of_week === cloneSourceDay);
    if (source.length === 0) {
      toast.error('Source day has no blocks to copy');
      return;
    }
    try {
      for (const target of cloneTargets) {
        // Replace mode: delete existing target-day blocks first.
        if (cloneMode === 'replace') {
          const existing = blocks.filter(b => b.day_of_week === target);
          for (const e of existing) await remove(e.id);
        }
        // Compute the resulting target blocks (post-delete in replace mode) for collision checks.
        const remaining = cloneMode === 'replace'
          ? []
          : [...blocks.filter(b => b.day_of_week === target)];
        for (const b of source) {
          const conflict = remaining.some(r =>
            b.start_minute < r.end_minute && r.start_minute < b.end_minute
          );
          if (conflict) continue; // merge mode: skip conflicting items
          await add({
            title: b.title,
            category: b.category,
            color: b.color,
            day_of_week: target,
            start_minute: b.start_minute,
            end_minute: b.end_minute,
            notes: b.notes,
          });
          remaining.push({ ...b, day_of_week: target });
        }
      }
      toast.success(`Copied ${source.length} block${source.length > 1 ? 's' : ''} to ${cloneTargets.length} day${cloneTargets.length > 1 ? 's' : ''}`);
      setConfirmClone(false);
      setCloneSourceDay(null);
      setCloneTargets([]);
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to clone');
    }
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
          {DAYS.map((d, i) => {
            const dayCount = blocks.filter(b => b.day_of_week === i).length;
            return (
              <div
                key={d}
                className={cn(
                  'p-2 text-center text-[11px] font-medium border-l border-border/30 flex items-center justify-center gap-1',
                  i === today ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <span>{d}</span>
                {dayCount > 0 && (
                  <button
                    onClick={() => openClone(i)}
                    title={`Copy ${d}'s schedule to other days`}
                    className="opacity-40 hover:opacity-100 hover:text-primary transition-opacity"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
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
                  // Side-by-side stacking for overlapping blocks.
                  const widthPct = 100 / b._cols;
                  const leftPct = b._col * widthPct;
                  return (
                    <motion.button
                      key={b.id}
                      layout
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      onClick={(e) => { e.stopPropagation(); openEdit(b); }}
                      className="absolute rounded-md p-1.5 text-left overflow-hidden border z-20 group hover:shadow-md transition-shadow"
                      style={{
                        top: Math.max(0, top),
                        height: Math.max(20, height - 2),
                        left: `calc(${leftPct}% + 2px)`,
                        width: `calc(${widthPct}% - 4px)`,
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

      {/* Clone day → multi-day picker */}
      <Dialog open={cloneSourceDay !== null} onOpenChange={(o) => !o && setCloneSourceDay(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif">
              Copy {cloneSourceDay !== null ? DAYS[cloneSourceDay] : ''} to…
            </DialogTitle>
            <DialogDescription className="text-xs">
              Choose target days, then pick whether to merge with or replace their existing blocks.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {DAYS.map((d, i) => {
                const disabled = i === cloneSourceDay;
                const checked = cloneTargets.includes(i);
                return (
                  <label
                    key={d}
                    className={cn(
                      'flex items-center gap-2 px-2 py-1.5 rounded-md border text-xs transition-colors',
                      disabled
                        ? 'opacity-40 cursor-not-allowed border-border/30'
                        : checked
                          ? 'border-primary bg-primary/10 cursor-pointer'
                          : 'border-border/40 hover:bg-muted/50 cursor-pointer'
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={disabled}
                      onCheckedChange={() => !disabled && toggleCloneTarget(i)}
                    />
                    {d}
                  </label>
                );
              })}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Mode:</span>
              <button
                onClick={() => setCloneMode('merge')}
                className={cn(
                  'px-2.5 py-1 rounded-md border transition-colors',
                  cloneMode === 'merge' ? 'border-primary bg-primary/10 text-foreground' : 'border-border/40 text-muted-foreground hover:bg-muted/50'
                )}
              >
                Merge (skip conflicts)
              </button>
              <button
                onClick={() => setCloneMode('replace')}
                className={cn(
                  'px-2.5 py-1 rounded-md border transition-colors',
                  cloneMode === 'replace' ? 'border-destructive bg-destructive/10 text-foreground' : 'border-border/40 text-muted-foreground hover:bg-muted/50'
                )}
              >
                Replace
              </button>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setCloneSourceDay(null)}>Cancel</Button>
            <Button
              size="sm"
              disabled={cloneTargets.length === 0}
              onClick={() => {
                if (cloneMode === 'replace') setConfirmClone(true);
                else runClone();
              }}
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Replace-mode confirmation */}
      <Dialog open={confirmClone} onOpenChange={setConfirmClone}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif">Replace existing blocks?</DialogTitle>
            <DialogDescription className="text-xs">
              This will delete every block on {cloneTargets.map(d => DAYS[d]).join(', ')} and replace them with {cloneSourceDay !== null ? DAYS[cloneSourceDay] : ''}'s schedule. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setConfirmClone(false)}>Cancel</Button>
            <Button size="sm" variant="destructive" onClick={runClone}>Replace</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Timetable;
