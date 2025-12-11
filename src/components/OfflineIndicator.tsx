/**
 * Offline status indicator component
 * Shows connection status and pending sync count
 */
import { Wifi, WifiOff, RefreshCw, Download, Cloud, CloudOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export function OfflineIndicator() {
  const {
    isOnline,
    isSyncing,
    pendingChanges,
    lastSyncTime,
    syncNow,
    downloadForOffline,
  } = useOfflineStatus();

  return (
    <Popover>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'relative gap-2 px-2',
                  !isOnline && 'text-amber-500'
                )}
              >
                {isOnline ? (
                  <Cloud className="h-4 w-4 text-green-500" />
                ) : (
                  <CloudOff className="h-4 w-4 text-amber-500" />
                )}
                {pendingChanges > 0 && (
                  <Badge
                    variant="secondary"
                    className="h-5 min-w-5 px-1 text-xs bg-amber-500/20 text-amber-600"
                  >
                    {pendingChanges}
                  </Badge>
                )}
                {isSyncing && (
                  <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
                )}
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>
            {isOnline ? 'Online' : 'Offline'} 
            {pendingChanges > 0 && ` • ${pendingChanges} pending`}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full',
                isOnline ? 'bg-green-500/10' : 'bg-amber-500/10'
              )}
            >
              {isOnline ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-amber-500" />
              )}
            </div>
            <div>
              <p className="font-medium">
                {isOnline ? 'Online' : 'Offline Mode'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isOnline
                  ? 'All changes sync automatically'
                  : 'Changes saved locally'}
              </p>
            </div>
          </div>

          {pendingChanges > 0 && (
            <div className="rounded-lg bg-amber-500/10 p-3">
              <p className="text-sm font-medium text-amber-600">
                {pendingChanges} pending change{pendingChanges !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isOnline
                  ? 'Will sync shortly'
                  : 'Will sync when back online'}
              </p>
            </div>
          )}

          {lastSyncTime && (
            <p className="text-xs text-muted-foreground">
              Last synced {formatDistanceToNow(lastSyncTime, { addSuffix: true })}
            </p>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={syncNow}
              disabled={!isOnline || isSyncing}
            >
              <RefreshCw className={cn('h-4 w-4 mr-2', isSyncing && 'animate-spin')} />
              Sync Now
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={downloadForOffline}
              disabled={!isOnline || isSyncing}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>

          {!isOnline && (
            <p className="text-xs text-center text-muted-foreground">
              You can still create quotes and view cached data while offline
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
