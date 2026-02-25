import { useState, useCallback, useRef } from 'react';

interface UseTabDataOptions<T> {
  /** Unique key for this data set */
  key: string;
  /** Async function to fetch data */
  fetcher: () => Promise<T>;
  /** Cache TTL in milliseconds (default: 5 minutes) */
  cacheTTL?: number;
}

interface UseTabDataReturn<T> {
  /** The fetched data */
  data: T | null;
  /** Whether currently loading */
  loading: boolean;
  /** Error if fetch failed */
  error: Error | null;
  /** Fetch data (uses cache if available) */
  fetch: (force?: boolean) => Promise<void>;
  /** Force refresh ignoring cache */
  refresh: () => Promise<void>;
  /** Check if data is stale */
  isStale: boolean;
  /** Last fetch timestamp */
  lastFetchTime: number | null;
}

// Global cache store for cross-component data sharing
const globalCache = new Map<string, { data: unknown; timestamp: number }>();

export function useTabData<T>({
  key,
  fetcher,
  cacheTTL = 5 * 60 * 1000 // 5 minutes default
}: UseTabDataOptions<T>): UseTabDataReturn<T> {
  const [data, setData] = useState<T | null>(() => {
    // Initialize from global cache if available
    const cached = globalCache.get(key);
    if (cached && Date.now() - cached.timestamp < cacheTTL) {
      return cached.data as T;
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const lastFetchRef = useRef<number | null>(globalCache.get(key)?.timestamp ?? null);

  const fetchData = useCallback(async (force = false) => {
    const now = Date.now();
    const cached = globalCache.get(key);

    // Use cache if available and not stale
    if (!force && cached && (now - cached.timestamp) < cacheTTL) {
      if (data !== cached.data) {
        setData(cached.data as T);
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      setData(result);

      // Update global cache
      globalCache.set(key, { data: result, timestamp: now });
      lastFetchRef.current = now;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err);
      console.error(`[useTabData] Error fetching ${key}:`, err);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, cacheTTL, data]);

  const refresh = useCallback(() => fetchData(true), [fetchData]);

  const isStale = (() => {
    const cached = globalCache.get(key);
    if (!cached) return true;
    return Date.now() - cached.timestamp > cacheTTL;
  })();

  return {
    data,
    loading,
    error,
    fetch: fetchData,
    refresh,
    isStale,
    lastFetchTime: lastFetchRef.current
  };
}

/**
 * Clear cache for a specific key or all keys
 */
export function clearTabDataCache(key?: string) {
  if (key) {
    globalCache.delete(key);
  } else {
    globalCache.clear();
  }
}

/**
 * Prefetch data into cache (useful for hover prefetch)
 */
export async function prefetchTabData<T>(
  key: string,
  fetcher: () => Promise<T>,
  cacheTTL = 5 * 60 * 1000
): Promise<void> {
  const cached = globalCache.get(key);
  if (cached && Date.now() - cached.timestamp < cacheTTL) {
    return; // Already cached
  }

  try {
    const result = await fetcher();
    globalCache.set(key, { data: result, timestamp: Date.now() });
  } catch (e) {
    console.error(`[prefetchTabData] Error prefetching ${key}:`, e);
  }
}
