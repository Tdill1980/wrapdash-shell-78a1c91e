/**
 * Hook for monitoring offline status and sync state
 */
import { useState, useEffect, useCallback } from 'react';
import { syncFromServer, syncPendingChanges, getLastSyncTime, isNetworkOnline, startBackgroundSync } from '@/lib/offline/sync';
import { getSyncQueue, getPendingQuotes } from '@/lib/offline/db';

interface OfflineStatus {
  isOnline: boolean;
  isInitializing: boolean;
  isSyncing: boolean;
  pendingChanges: number;
  lastSyncTime: Date | null;
  syncNow: () => Promise<void>;
  downloadForOffline: () => Promise<void>;
}

export function useOfflineStatus(): OfflineStatus {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Update online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check pending changes
  const checkPendingChanges = useCallback(async () => {
    try {
      const queue = await getSyncQueue();
      const pendingQuotes = await getPendingQuotes();
      setPendingChanges(queue.length + pendingQuotes.length);
    } catch {
      // DB not ready yet
    }
  }, []);

  // Initialize and start background sync
  useEffect(() => {
    const init = async () => {
      try {
        const lastSync = await getLastSyncTime();
        if (lastSync) {
          setLastSyncTime(new Date(lastSync));
        }
        await checkPendingChanges();
        startBackgroundSync();
      } catch (error) {
        console.error('Error initializing offline status:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    init();

    // Check pending changes periodically
    const interval = setInterval(checkPendingChanges, 10000);
    return () => clearInterval(interval);
  }, [checkPendingChanges]);

  // Sync now
  const syncNow = useCallback(async () => {
    if (!isNetworkOnline()) {
      console.log('Cannot sync while offline');
      return;
    }

    setIsSyncing(true);
    try {
      await syncPendingChanges();
      await syncFromServer();
      const lastSync = await getLastSyncTime();
      if (lastSync) {
        setLastSyncTime(new Date(lastSync));
      }
      await checkPendingChanges();
    } finally {
      setIsSyncing(false);
    }
  }, [checkPendingChanges]);

  // Download all data for offline use
  const downloadForOffline = useCallback(async () => {
    if (!isNetworkOnline()) {
      console.log('Cannot download while offline');
      return;
    }

    setIsSyncing(true);
    try {
      await syncFromServer();
      const lastSync = await getLastSyncTime();
      if (lastSync) {
        setLastSyncTime(new Date(lastSync));
      }
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return {
    isOnline,
    isInitializing,
    isSyncing,
    pendingChanges,
    lastSyncTime,
    syncNow,
    downloadForOffline,
  };
}
