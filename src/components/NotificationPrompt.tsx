import { useState, useEffect } from 'react';
import { Bell, BellOff, HelpCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { useReminders } from '@/hooks/useReminders';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const DISMISS_KEY = 'zenith_notif_prompt_dismissed';
const DENIED_DISMISS_KEY = 'zenith_notif_denied_dismissed';

const NotificationPrompt = () => {
  const reminders = useReminders();
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
  });
  const [deniedDismissed, setDeniedDismissed] = useState<boolean>(() => {
    try { return localStorage.getItem(DENIED_DISMISS_KEY) === '1'; } catch { return false; }
  });
  const [helpOpen, setHelpOpen] = useState(false);

  // Auto-hide once enabled
  useEffect(() => {
    if (reminders.enabled) setDismissed(true);
  }, [reminders.enabled]);

  // Surface schedule sync failures with a Retry action.
  useEffect(() => {
    if (!reminders.lastSyncError) return;
    toast.error('Schedule sync failed', {
      description: reminders.lastSyncError,
      action: { label: 'Retry', onClick: () => reminders.retrySync() },
    });
  }, [reminders.lastSyncError, reminders.retrySync]);

  if (!reminders.supported) return null;

  // Blocked state: show a help banner instead.
  if (reminders.permission === 'denied') {
    if (deniedDismissed) return null;
    return (
      <>
        <div
          className={cn(
            'fixed top-3 left-3 z-50 max-w-xs w-[calc(100%-1.5rem)] sm:w-80',
            'glass border border-destructive/40 rounded-xl shadow-lg p-3',
            'flex items-start gap-3 animate-in fade-in slide-in-from-top-2'
          )}
          role="alert"
        >
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <BellOff className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground leading-snug">
              Notifications are blocked
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Re-enable them in your browser to get schedule reminders.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Button size="sm" onClick={() => setHelpOpen(true)} className="h-7 px-3 text-xs">
                <HelpCircle className="h-3 w-3 mr-1" /> How to fix
              </Button>
              <Button
                size="sm" variant="ghost"
                onClick={() => {
                  setDeniedDismissed(true);
                  try { localStorage.setItem(DENIED_DISMISS_KEY, '1'); } catch {}
                }}
                className="h-7 px-2 text-xs text-muted-foreground"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>

        <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Re-enable notifications</DialogTitle>
              <DialogDescription>
                Your browser is currently blocking notifications for this site.
              </DialogDescription>
            </DialogHeader>
            <ol className="text-sm space-y-2 text-foreground/90 list-decimal pl-5">
              <li>Click the lock or info icon in the address bar.</li>
              <li>Find <strong>Notifications</strong> in the site settings.</li>
              <li>Change it from <em>Block</em> to <em>Allow</em>.</li>
              <li>Reload this page and toggle notifications on again.</li>
            </ol>
            <DialogFooter>
              <Button onClick={() => setHelpOpen(false)}>Got it</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (reminders.enabled) return null;
  if (dismissed) return null;

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
          Get a ping at the start of every scheduled block.
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

