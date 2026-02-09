/**
 * Synced Data Hook
 *
 * React hook for data that syncs between local storage and remote API.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createSyncManager, type SyncConfig, type SyncState } from '../lib/storage';

/**
 * Use data that syncs between local and remote
 */
export function useSyncedData<T>(config: SyncConfig<T>) {
  const managerRef = useRef(createSyncManager(config));
  const [state, setState] = useState<SyncState<T>>(() => managerRef.current.getState());

  useEffect(() => {
    const manager = managerRef.current;

    // Subscribe to state changes
    const unsubscribe = manager.subscribe(setState);

    // Initial sync if needed
    if (manager.needsSync()) {
      manager.sync().catch(() => {
        // Error is in state
      });
    }

    return unsubscribe;
  }, []);

  const sync = useCallback(() => {
    return managerRef.current.sync();
  }, []);

  const push = useCallback((data: T) => {
    return managerRef.current.push(data);
  }, []);

  const setLocal = useCallback((data: T) => {
    managerRef.current.setLocal(data);
  }, []);

  const clear = useCallback(() => {
    managerRef.current.clear();
  }, []);

  return {
    data: state.data,
    isLoading: state.isLoading,
    isSyncing: state.isSyncing,
    error: state.error,
    lastSyncedAt: state.lastSyncedAt,
    isStale: state.isStale,
    sync,
    push,
    setLocal,
    clear,
    needsSync: managerRef.current.needsSync(),
  };
}

/**
 * Use synced data with auto-sync on interval
 */
export function useAutoSyncedData<T>(
  config: SyncConfig<T>,
  options: {
    /** Auto sync interval in ms (default: 5 minutes) */
    interval?: number;
    /** Sync when window gains focus */
    syncOnFocus?: boolean;
    /** Sync when network comes online */
    syncOnOnline?: boolean;
  } = {}
) {
  const { interval = 5 * 60 * 1000, syncOnFocus = true, syncOnOnline = true } = options;

  const syncedData = useSyncedData(config);
  const { sync, isStale, isSyncing } = syncedData;

  // Auto sync on interval
  useEffect(() => {
    if (!interval) return;

    const timer = setInterval(() => {
      if (!isSyncing) {
        sync().catch(() => {
          // Error is in state
        });
      }
    }, interval);

    return () => clearInterval(timer);
  }, [interval, sync, isSyncing]);

  // Sync on focus
  useEffect(() => {
    if (!syncOnFocus) return;

    const handleFocus = () => {
      if (isStale && !isSyncing) {
        sync().catch(() => {
          // Error is in state
        });
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [syncOnFocus, sync, isStale, isSyncing]);

  // Sync when online
  useEffect(() => {
    if (!syncOnOnline) return;

    const handleOnline = () => {
      if (isStale && !isSyncing) {
        sync().catch(() => {
          // Error is in state
        });
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncOnOnline, sync, isStale, isSyncing]);

  return syncedData;
}
