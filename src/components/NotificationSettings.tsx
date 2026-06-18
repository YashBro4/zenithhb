import { useState } from 'react';
import { Settings2, Bell, BellOff, Play, Volume2, Download } from 'lucide-react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  useReminders, playReminderSound, REMINDER_SOUNDS, REMINDER_LEADS,
  type ReminderLead, type ReminderSound,
} from '@/hooks/useReminders';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const leadLabel = (m: ReminderLead) =>
  m === 0 ? 'Exactly at start time' : `${m} minutes before`;

const NotificationSettings = () => {
  const r = useReminders();
  const [open, setOpen] = useState(false);

  if (!r.supported) return null;

  const handleToggle = async (next: boolean) => {
    if (next && r.previewBlocked) {
      toast.info('Open the published site to enable browser notifications.');
      return;
    }
    await r.toggle(next);
    if (next && r.permission === 'denied') {
      toast.error('Notifications are blocked by the browser.');
    }
  };

  const statusColor = r.permission === 'denied'
    ? 'text-destructive'
    : r.enabled && r.permission === 'granted'
    ? 'text-primary'
    : 'text-muted-foreground';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8 rounded-lg', statusColor)}
          aria-label="Notification settings"
        >
          {r.permission === 'denied'
            ? <BellOff className="w-4 h-4" />
            : <Settings2 className="w-4 h-4" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <h3 className="font-serif font-semibold text-sm">Notifications</h3>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Schedule reminders sync to your timetable in real time.
          </p>
        </div>

        <div className="p-4 space-y-4">
          {/* Master toggle */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">Enable all notifications</p>
              <p className="text-[11px] text-muted-foreground">
                {r.permission === 'denied'
                  ? 'Blocked — allow in browser site settings.'
                  : r.previewBlocked
                  ? 'Available on the published site.'
                  : r.enabled
                  ? 'On — reminders fire even when this tab is closed.'
                  : 'Off — no schedule pings will appear.'}
              </p>
            </div>
            <Switch
              checked={r.enabled && r.permission === 'granted'}
              disabled={r.registering || r.permission === 'denied'}
              onCheckedChange={handleToggle}
            />
          </div>

          {/* Reminder window */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Reminder window
            </label>
            <Select
              value={String(r.leadMinutes)}
              onValueChange={(v) => r.setLeadMinutes(Number(v) as ReminderLead)}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REMINDER_LEADS.map(m => (
                  <SelectItem key={m} value={String(m)}>{leadLabel(m)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sound */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Alert sound
            </label>
            <div className="flex items-center gap-2">
              <Select
                value={r.sound}
                onValueChange={(v) => r.setSound(v as ReminderSound)}
              >
                <SelectTrigger className="h-9 text-sm flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REMINDER_SOUNDS.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (r.sound === 'silent') {
                    toast.info('Silent mode — no tone to preview.');
                    return;
                  }
                  playReminderSound(r.sound);
                }}
                className="h-9 px-2.5"
              >
                <Play className="w-3.5 h-3.5 mr-1" /> Test
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1 pt-0.5">
              <Volume2 className="w-3 h-3" />
              In-tab preview only. Background notifications use your OS default tone.
            </p>
          </div>

          {r.lastSyncError && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-2 flex items-center justify-between gap-2">
              <span className="text-[11px] text-destructive truncate">
                Sync failed: {r.lastSyncError}
              </span>
              <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={r.retrySync}>
                Retry
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationSettings;
