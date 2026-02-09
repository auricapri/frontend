/**
 * Data Sync Manager
 *
 * Manages synchronization between local and remote data with conflict resolution.
 */

export interface SyncConfig<T> {
  /** Unique identifier for this sync target */
  key: string;
  /** Fetch data from server */
  fetchRemote: () => Promise<T>;
  /** Push local changes to server */
  pushLocal?: (data: T) => Promise<T>;
  /** Merge local and remote data */
  merge?: (local: T, remote: T) => T;
  /** Check if data has changed */
  hasChanged?: (prev: T, next: T) => boolean;
  /** Minimum interval between syncs in ms */
  syncInterval?: number;
  /** Retry attempts on failure */
  retryAttempts?: number;
  /** Retry delay in ms */
  retryDelay?: number;
}

export interface SyncState<T> {
  data: T | null;
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  error: Error | null;
  isStale: boolean;
}

export interface SyncManager<T> {
  /** Current state */
  getState(): SyncState<T>;
  /** Force sync from remote */
  sync(): Promise<T>;
  /** Push local changes */
  push(data: T): Promise<T>;
  /** Update local data without sync */
  setLocal(data: T): void;
  /** Subscribe to state changes */
  subscribe(listener: (state: SyncState<T>) => void): () => void;
  /** Check if sync is needed */
  needsSync(): boolean;
  /** Clear local data */
  clear(): void;
}

const STORAGE_PREFIX = 'auricapri_sync_';

/**
 * Create a sync manager for a data type
 */
export function createSyncManager<T>(config: SyncConfig<T>): SyncManager<T> {
  const {
    key,
    fetchRemote,
    pushLocal,
    merge = (_, remote) => remote,
    hasChanged = (prev, next) => JSON.stringify(prev) !== JSON.stringify(next),
    syncInterval = 5 * 60 * 1000, // 5 minutes
    retryAttempts = 3,
    retryDelay = 1000,
  } = config;

  const storageKey = `${STORAGE_PREFIX}${key}`;
  const timestampKey = `${storageKey}_timestamp`;
  const listeners = new Set<(state: SyncState<T>) => void>();

  let state: SyncState<T> = {
    data: loadFromStorage(),
    isLoading: false,
    isSyncing: false,
    lastSyncedAt: loadTimestamp(),
    error: null,
    isStale: true,
  };

  function loadFromStorage(): T | null {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function saveToStorage(data: T): void {
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn(`Failed to save sync data for "${key}":`, error);
    }
  }

  function loadTimestamp(): number | null {
    try {
      const raw = localStorage.getItem(timestampKey);
      return raw ? parseInt(raw, 10) : null;
    } catch {
      return null;
    }
  }

  function saveTimestamp(): void {
    try {
      localStorage.setItem(timestampKey, Date.now().toString());
    } catch {
      // Ignore
    }
  }

  function setState(updates: Partial<SyncState<T>>): void {
    state = { ...state, ...updates };
    listeners.forEach((listener) => listener(state));
  }

  async function withRetry<R>(fn: () => Promise<R>): Promise<R> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < retryAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < retryAttempts - 1) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
      }
    }

    throw lastError;
  }

  return {
    getState() {
      return state;
    },

    async sync() {
      if (state.isSyncing) {
        // Wait for ongoing sync
        return new Promise<T>((resolve, reject) => {
          const unsubscribe = this.subscribe((newState) => {
            if (!newState.isSyncing) {
              unsubscribe();
              if (newState.error) {
                reject(newState.error);
              } else if (newState.data) {
                resolve(newState.data);
              }
            }
          });
        });
      }

      setState({ isSyncing: true, isLoading: state.data === null, error: null });

      try {
        const remoteData = await withRetry(fetchRemote);
        const localData = state.data;

        // Merge if we have local data
        const finalData = localData ? merge(localData, remoteData) : remoteData;

        saveToStorage(finalData);
        saveTimestamp();

        setState({
          data: finalData,
          isSyncing: false,
          isLoading: false,
          lastSyncedAt: Date.now(),
          isStale: false,
          error: null,
        });

        return finalData;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setState({ isSyncing: false, isLoading: false, error: err });
        throw err;
      }
    },

    async push(data: T) {
      if (!pushLocal) {
        throw new Error(`Push not supported for "${key}"`);
      }

      setState({ isSyncing: true, error: null });

      try {
        const updatedData = await withRetry(() => pushLocal(data));

        saveToStorage(updatedData);
        saveTimestamp();

        setState({
          data: updatedData,
          isSyncing: false,
          lastSyncedAt: Date.now(),
          isStale: false,
          error: null,
        });

        return updatedData;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setState({ isSyncing: false, error: err });
        throw err;
      }
    },

    setLocal(data: T) {
      const changed = !state.data || hasChanged(state.data, data);
      saveToStorage(data);
      setState({ data, isStale: changed });
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    needsSync() {
      if (!state.lastSyncedAt) return true;
      return Date.now() - state.lastSyncedAt > syncInterval;
    },

    clear() {
      try {
        localStorage.removeItem(storageKey);
        localStorage.removeItem(timestampKey);
      } catch {
        // Ignore
      }
      setState({
        data: null,
        isLoading: false,
        isSyncing: false,
        lastSyncedAt: null,
        error: null,
        isStale: true,
      });
    },
  };
}
