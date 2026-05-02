import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReminders } from '@/hooks/useReminders';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const DISMISS_KEY = 'zenith_notif_prompt_dismissed';

const NotificationPrompt = () => {
  const reminders = useReminders();
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
  });

  // Auto-hide once enabled
  useEffect(() => {
    if (reminders.enabled) setDismissed(true);
  }, [reminders.enabled]);

  if (!reminders.supported) return null;
  if (reminders.enabled) return null;
  if (dismissed) return null;
  if (reminders.permission === 'denied') return null;

  const handleEnable = async () => {
    if (reminders.previewBlocked) {
      toast.info('Open the published site to enable browser notifications.');
      return;
    }
    await reminders.toggle(true);
  };

  const handleDismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch {}
  };

  return (
    <div
      className={cn(
        'fixed top-3 left-3 z-50 max-w-xs w-[calc(100%-1.5rem)] sm:w-80',
        'glass border border-border/40 rounded-xl shadow-lg p-3',
        'flex items-start gap-3 animate-in fade-in slide-in-from-top-2'
      )}
      role="alert"
    >
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Bell className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground leading-snug">
          Turn on notifications
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Get your daily schedule and reminders before each block.
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Button
            size="sm"
            onClick={handleEnable}
            disabled={reminders.registering}
            className="h-7 px-3 text-xs"
          >
            {reminders.registering ? 'Enabling…' : 'Enable'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            className="h-7 px-2 text-xs text-muted-foreground"
          >
            Not now
          </Button>
        </div>
      </div>
      <button
        onClick={handleDismiss}
        className="text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default NotificationPrompt;
