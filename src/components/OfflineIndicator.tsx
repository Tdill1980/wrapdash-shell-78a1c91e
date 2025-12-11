/**
 * Offline status indicator component
 * Shows connection status, offline-ready state, and pending sync count
 */
import { Wifi, WifiOff, RefreshCw, Download, Cloud, CloudOff, CheckCircle, AlertTriangle, Shield } from 'lucide-react';
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
import { toast } from 'sonner';

export function OfflineIndicator() {
  const {
    isOnline,
    isSyncing,
    isOfflineReady,
    offlineReadyAt,
    pendingChanges,
    lastSyncTime,
    syncNow,
    preloadForOffline,
    clearOfflineReady,
  } = useOfflineStatus();

  const handlePreload = async () => {
    const success = await preloadForOffline();
    if (success) {
      toast.success('Offline Ready!', {
        description: 'You can now use the app without internet.',
      });
    } else {
      toast.error('Preload Failed', {
        description: 'Could not prepare offline mode. Try again.',
      });
    }
  };

  const handleClearOffline = () => {
    clearOfflineReady();
    toast.info('Offline status cleared', {
      description: 'Re-sync to enable offline mode again.',
    });
  };

  // Determine the icon and color based on state
  const getStatusIcon = () => {
    if (!isOnline && !isOfflineReady) {
      // Offline but NOT ready - danger state
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    }
    if (!isOnline && isOfflineReady) {
      // Offline but ready - safe state
      return <Shield className="h-4 w-4 text-green-500" />;
    }
    if (isOnline && isOfflineReady) {
      // Online and ready
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    // Online but not ready
    return <Cloud className="h-4 w-4 text-muted-foreground" />;
  };

  const getStatusColor = () => {
    if (!isOnline && !isOfflineReady) return 'text-destructive';
    if (isOfflineReady) return 'text-green-500';
    return 'text-muted-foreground';
  };

  return (
    <Popover>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn('relative gap-2 px-2', getStatusColor())}
              >
                {getStatusIcon()}
                {isOfflineReady && (
                  <span className="text-xs font-medium hidden sm:inline">Ready</span>
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
            {isOfflineReady ? ' • Offline Ready ✓' : ''}
            {pendingChanges > 0 && ` • ${pendingChanges} pending`}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          {/* Status Header */}
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full',
                !isOnline && !isOfflineReady && 'bg-destructive/10',
                isOfflineReady && 'bg-green-500/10',
                isOnline && !isOfflineReady && 'bg-muted'
              )}
            >
              {isOnline ? (
                isOfflineReady ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Wifi className="h-5 w-5 text-muted-foreground" />
                )
              ) : isOfflineReady ? (
                <Shield className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-destructive" />
              )}
            </div>
            <div>
              <p className="font-medium">
                {isOnline ? 'Online' : 'Offline Mode'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isOfflineReady
                  ? 'Device is offline-ready'
                  : isOnline
                  ? 'Click below to enable offline mode'
                  : 'Not offline-ready!'}
              </p>
            </div>
          </div>

          {/* Offline Ready Status */}
          {isOfflineReady ? (
            <div className="rounded-lg bg-green-500/10 p-3 border border-green-500/20">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                <p className="text-sm font-medium text-green-700">Offline Ready</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {offlineReadyAt
                  ? `Prepared ${formatDistanceToNow(offlineReadyAt, { addSuffix: true })}`
                  : 'All data cached locally'}
              </p>
            </div>
          ) : !isOnline ? (
            <div className="rounded-lg bg-destructive/10 p-3 border border-destructive/20">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <p className="text-sm font-medium text-destructive">Not Offline-Ready</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Connect to internet and sync to enable offline mode
              </p>
            </div>
          ) : null}

          {/* Pending Changes */}
          {pendingChanges > 0 && (
            <div className="rounded-lg bg-amber-500/10 p-3">
              <p className="text-sm font-medium text-amber-600">
                {pendingChanges} pending change{pendingChanges !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isOnline ? 'Will sync shortly' : 'Will sync when back online'}
              </p>
            </div>
          )}

          {/* Last Sync Time */}
          {lastSyncTime && (
            <p className="text-xs text-muted-foreground">
              Last synced {formatDistanceToNow(lastSyncTime, { addSuffix: true })}
            </p>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            {/* Primary: Prepare for Offline */}
            {isOnline && !isOfflineReady && (
              <Button
                variant="default"
                size="sm"
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                onClick={handlePreload}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Prepare for Offline
              </Button>
            )}

            {/* Secondary actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={syncNow}
                disabled={!isOnline || isSyncing}
              >
                <RefreshCw className={cn('h-4 w-4 mr-2', isSyncing && 'animate-spin')} />
                Sync
              </Button>
              {isOfflineReady && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-muted-foreground"
                  onClick={handleClearOffline}
                >
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Help text */}
          {!isOnline && isOfflineReady && (
            <p className="text-xs text-center text-green-600">
              ✓ You can create quotes and use content tools offline
            </p>
          )}
          {!isOnline && !isOfflineReady && (
            <p className="text-xs text-center text-destructive">
              ⚠️ Limited functionality until you reconnect and sync
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
