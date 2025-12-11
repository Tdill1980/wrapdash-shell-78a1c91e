/**
 * Hook for monitoring offline status and sync state
 * Includes explicit "Offline Ready" confirmation for trusted offline use
 */
import { useState, useEffect, useCallback } from 'react';
import { syncFromServer, syncPendingChanges, getLastSyncTime, isNetworkOnline, startBackgroundSync } from '@/lib/offline/sync';
import { getSyncQueue, getPendingQuotes } from '@/lib/offline/db';

const OFFLINE_READY_KEY = 'wrapcommand_offline_ready';
const OFFLINE_READY_TIMESTAMP_KEY = 'wrapcommand_offline_ready_at';

interface OfflineStatus {
  isOnline: boolean;
  isInitializing: boolean;
  isSyncing: boolean;
  isOfflineReady: boolean;
  offlineReadyAt: Date | null;
  pendingChanges: number;
  lastSyncTime: Date | null;
  syncNow: () => Promise<void>;
  downloadForOffline: () => Promise<void>;
  preloadForOffline: () => Promise<boolean>;
  clearOfflineReady: () => void;
}

// Check if offline ready flag is set
function getOfflineReady(): boolean {
  try {
    return localStorage.getItem(OFFLINE_READY_KEY) === 'true';
  } catch {
    return false;
  }
}

// Get timestamp when offline was marked ready
function getOfflineReadyTimestamp(): Date | null {
  try {
    const timestamp = localStorage.getItem(OFFLINE_READY_TIMESTAMP_KEY);
    return timestamp ? new Date(timestamp) : null;
  } catch {
    return null;
  }
}

// Mark offline as ready
function markOfflineReady(): void {
  try {
    localStorage.setItem(OFFLINE_READY_KEY, 'true');
    localStorage.setItem(OFFLINE_READY_TIMESTAMP_KEY, new Date().toISOString());
  } catch {
    console.error('Failed to set offline ready flag');
  }
}

// Clear offline ready flag
function clearOfflineReadyFlag(): void {
  try {
    localStorage.removeItem(OFFLINE_READY_KEY);
    localStorage.removeItem(OFFLINE_READY_TIMESTAMP_KEY);
  } catch {
    console.error('Failed to clear offline ready flag');
  }
}

export function useOfflineStatus(): OfflineStatus {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOfflineReady, setIsOfflineReady] = useState(getOfflineReady);
  const [offlineReadyAt, setOfflineReadyAt] = useState<Date | null>(getOfflineReadyTimestamp);
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
        
        // Check stored offline ready state
        setIsOfflineReady(getOfflineReady());
        setOfflineReadyAt(getOfflineReadyTimestamp());
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

  // Explicit preload for offline - this is the CRITICAL new function
  // Returns true if preload succeeded
  const preloadForOffline = useCallback(async (): Promise<boolean> => {
    if (!isNetworkOnline()) {
      console.log('Cannot preload while offline');
      return false;
    }

    setIsSyncing(true);
    try {
      // 1. Sync all data from server to IndexedDB
      await syncFromServer();
      
      // 2. Force cache critical assets (templates are already in-memory)
      // The hook templates, tone tools, etc. are bundled with the app
      
      // 3. Update last sync time
      const lastSync = await getLastSyncTime();
      if (lastSync) {
        setLastSyncTime(new Date(lastSync));
      }
      
      // 4. Mark as offline ready ONLY after successful preload
      markOfflineReady();
      setIsOfflineReady(true);
      setOfflineReadyAt(new Date());
      
      console.log('✅ Offline preload complete - device is now offline-ready');
      return true;
    } catch (error) {
      console.error('❌ Offline preload failed:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Clear offline ready state (e.g., if user wants to force re-sync)
  const clearOfflineReady = useCallback(() => {
    clearOfflineReadyFlag();
    setIsOfflineReady(false);
    setOfflineReadyAt(null);
  }, []);

  return {
    isOnline,
    isInitializing,
    isSyncing,
    isOfflineReady,
    offlineReadyAt,
    pendingChanges,
    lastSyncTime,
    syncNow,
    downloadForOffline,
    preloadForOffline,
    clearOfflineReady,
  };
}
