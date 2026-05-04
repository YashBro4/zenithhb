import { Bell, BellOff } from 'lucide-react';
import { useReminders } from '@/hooks/useReminders';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Compact "App Status" indicator for notification permissions.
// Granted+enabled = primary glow, Denied = destructive, otherwise muted.
const NotificationStatus = () => {
  const r = useReminders();
  if (!r.supported) return null;

  const denied = r.permission === 'denied';
  const active = r.enabled && r.permission === 'granted';

  const label = denied
    ? 'Notifications blocked by browser'
    : active
    ? 'Notifications: Granted'
    : r.previewBlocked
    ? 'Open published site to enable notifications'
    : 'Notifications off — open Settings to enable';

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
              active && 'text-primary bg-primary/10',
              denied && 'text-destructive bg-destructive/10',
              !active && !denied && 'text-muted-foreground'
            )}
            aria-label={label}
          >
            {denied ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default NotificationStatus;
