interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  etag?: string;
}

interface CacheConfig {
  ttl: number;
  maxSize?: number;
  persist?: boolean;
}

interface CacheStats {
  memoryEntries: number;
  memorySize: number;
  storageSize: number;
  hits: number;
  misses: number;
  evictions: number;
  errors: number;
}

type PendingRequest<T> = Promise<T>;

class CacheService {
  private memoryCache: Map<string, CacheEntry<unknown>> = new Map();
  private pendingRequests: Map<string, PendingRequest<unknown>> = new Map();
  private readonly STORAGE_PREFIX = 'auricapri_cache_v1_';
  private readonly MAX_STORAGE_SIZE = 4 * 1024 * 1024;
  private readonly MAX_MEMORY_ENTRIES = 100;
  private readonly MAX_MEMORY_SIZE = 10 * 1024 * 1024;
  private readonly MAX_ITEM_SIZE = 2 * 1024 * 1024;
  private stats: CacheStats = {
    memoryEntries: 0,
    memorySize: 0,
    storageSize: 0,
    hits: 0,
    misses: 0,
    evictions: 0,
    errors: 0,
  };
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (this.isInitialized) return;

    try {
      this.cleanupExpiredStorage();
      this.stats.storageSize = this.getStorageSize();
      this.isInitialized = true;
    } catch (error) {
      console.warn('Cache initialization error:', error);
      this.stats.errors++;
    }
  }

  private cleanupExpiredStorage(): void {
    try {
      const keysToRemove: string[] = [];
      const now = Date.now();

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.STORAGE_PREFIX)) {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              const entry = JSON.parse(value) as CacheEntry<unknown>;
              if (now - entry.timestamp > entry.ttl) {
                keysToRemove.push(key);
              }
            }
          } catch {
            keysToRemove.push(key);
          }
        }
      }

      for (const key of keysToRemove) {
        localStorage.removeItem(key);
      }
    } catch {
      this.stats.errors++;
    }
  }

  private getStorageKey(key: string): string {
    return `${this.STORAGE_PREFIX}${key}`;
  }

  private estimateSize(data: unknown): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return JSON.stringify(data).length * 2;
    }
  }

  private isExpired(entry: CacheEntry<unknown>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private evictLRU(): void {
    if (this.memoryCache.size === 0) return;

    const entries = Array.from(this.memoryCache.entries())
      .map(([key, entry]) => ({ key, entry, score: entry.lastAccessed }))
      .sort((a, b) => a.score - b.score);

    const toEvict = Math.max(1, Math.floor(this.memoryCache.size * 0.2));

    for (let i = 0; i < toEvict && i < entries.length; i++) {
      this.memoryCache.delete(entries[i].key);
      this.stats.memorySize -= entries[i].entry.size;
      this.stats.memoryEntries--;
      this.stats.evictions++;
    }
  }

  private evictBySize(): void {
    if (this.stats.memorySize <= this.MAX_MEMORY_SIZE) return;

    const entries = Array.from(this.memoryCache.entries())
      .map(([key, entry]) => ({ key, entry, score: entry.lastAccessed }))
      .sort((a, b) => a.score - b.score);

    for (const { key, entry } of entries) {
      if (this.stats.memorySize <= this.MAX_MEMORY_SIZE * 0.8) break;

      this.memoryCache.delete(key);
      this.stats.memorySize -= entry.size;
      this.stats.memoryEntries--;
      this.stats.evictions++;
    }
  }

  private getStorageSize(): number {
    let total = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.STORAGE_PREFIX)) {
          const value = localStorage.getItem(key);
          if (value) {
            total += key.length + value.length;
          }
        }
      }
    } catch {
      this.stats.errors++;
    }
    return total;
  }

  private evictOldestStorage(): void {
    const entries: Array<{ key: string; timestamp: number; size: number }> = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.STORAGE_PREFIX)) {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              const entry = JSON.parse(value) as CacheEntry<unknown>;
              entries.push({
                key,
                timestamp: entry.timestamp,
                size: key.length + value.length,
              });
            }
          } catch {
            localStorage.removeItem(key);
          }
        }
      }

      entries.sort((a, b) => a.timestamp - b.timestamp);

      for (const entry of entries) {
        if (this.getStorageSize() < this.MAX_STORAGE_SIZE * 0.7) break;
        localStorage.removeItem(entry.key);
      }
    } catch {
      this.stats.errors++;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const memoryEntry = this.memoryCache.get(key);

      if (memoryEntry) {
        if (this.isExpired(memoryEntry)) {
          this.memoryCache.delete(key);
          this.stats.memorySize -= memoryEntry.size;
          this.stats.memoryEntries--;
          this.stats.misses++;
          return null;
        }

        memoryEntry.lastAccessed = Date.now();
        memoryEntry.accessCount++;
        this.stats.hits++;
        return memoryEntry.data as T;
      }

      this.stats.misses++;

      const storageKey = this.getStorageKey(key);
      const stored = localStorage.getItem(storageKey);

      if (stored) {
        const entry = JSON.parse(stored) as CacheEntry<T>;

        if (!this.isExpired(entry)) {
          entry.lastAccessed = Date.now();
          entry.accessCount++;

          if (this.stats.memoryEntries < this.MAX_MEMORY_ENTRIES) {
            this.memoryCache.set(key, entry);
            this.stats.memoryEntries++;
            this.stats.memorySize += entry.size;
          }

          this.stats.hits++;
          return entry.data;
        }

        localStorage.removeItem(storageKey);
      }
    } catch (error) {
      this.stats.errors++;
      console.warn('Cache get error:', error);
    }

    return null;
  }

  async set<T>(key: string, data: T, config: CacheConfig, etag?: string): Promise<void> {
    try {
      const size = this.estimateSize(data);

      if (size > this.MAX_ITEM_SIZE) {
        return;
      }

      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: config.ttl,
        accessCount: 0,
        lastAccessed: Date.now(),
        size,
        etag,
      };

      if (this.memoryCache.size >= this.MAX_MEMORY_ENTRIES) {
        this.evictLRU();
      }

      if (this.stats.memorySize + size > this.MAX_MEMORY_SIZE) {
        this.evictBySize();
      }

      const existing = this.memoryCache.get(key);
      if (existing) {
        this.stats.memorySize -= existing.size;
      } else {
        this.stats.memoryEntries++;
      }

      this.memoryCache.set(key, entry);
      this.stats.memorySize += size;

      if (config.persist && size < 500 * 1024) {
        const storageKey = this.getStorageKey(key);

        if (this.getStorageSize() + size >= this.MAX_STORAGE_SIZE) {
          this.evictOldestStorage();
        }

        try {
          localStorage.setItem(storageKey, JSON.stringify(entry));
          this.stats.storageSize = this.getStorageSize();
        } catch (error) {
          if (error instanceof DOMException && error.name === 'QuotaExceededError') {
            this.evictOldestStorage();
            try {
              localStorage.setItem(storageKey, JSON.stringify(entry));
              this.stats.storageSize = this.getStorageSize();
            } catch {
              this.stats.errors++;
            }
          } else {
            this.stats.errors++;
          }
        }
      }
    } catch (error) {
      this.stats.errors++;
      console.warn('Cache set error:', error);
    }
  }

  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending as Promise<T>;
    }

    const promise = (async () => {
      try {
        const data = await fetcher();
        await this.set(key, data, config);
        return data;
      } finally {
        this.pendingRequests.delete(key);
      }
    })();

    this.pendingRequests.set(key, promise);
    return promise;
  }

  async invalidate(key: string): Promise<void> {
    try {
      const entry = this.memoryCache.get(key);
      if (entry) {
        this.memoryCache.delete(key);
        this.stats.memorySize -= entry.size;
        this.stats.memoryEntries--;
      }

      const storageKey = this.getStorageKey(key);
      localStorage.removeItem(storageKey);
      this.stats.storageSize = this.getStorageSize();
    } catch (error) {
      this.stats.errors++;
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const regex = new RegExp(pattern);
      const keysToDelete: string[] = [];

      for (const key of this.memoryCache.keys()) {
        if (regex.test(key)) {
          keysToDelete.push(key);
        }
      }

      for (const key of keysToDelete) {
        const entry = this.memoryCache.get(key);
        if (entry) {
          this.memoryCache.delete(key);
          this.stats.memorySize -= entry.size;
          this.stats.memoryEntries--;
        }
      }

      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.STORAGE_PREFIX)) {
          const cacheKey = key.replace(this.STORAGE_PREFIX, '');
          if (regex.test(cacheKey)) {
            keysToRemove.push(key);
          }
        }
      }

      for (const key of keysToRemove) {
        localStorage.removeItem(key);
      }

      this.stats.storageSize = this.getStorageSize();
    } catch (error) {
      this.stats.errors++;
    }
  }

  async clear(): Promise<void> {
    try {
      this.memoryCache.clear();
      this.pendingRequests.clear();
      this.stats.memoryEntries = 0;
      this.stats.memorySize = 0;

      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }

      for (const key of keysToRemove) {
        localStorage.removeItem(key);
      }

      this.stats.storageSize = 0;
    } catch (error) {
      this.stats.errors++;
    }
  }

  getStats(): CacheStats {
    return {
      ...this.stats,
      storageSize: this.getStorageSize(),
    };
  }

  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? this.stats.hits / total : 0;
  }
}

export const cacheService = new CacheService();

export const CacheConfigs = {
  PRODUCTS: { ttl: 5 * 60 * 1000, persist: true, maxSize: 2 * 1024 * 1024 },
  PRODUCT_DETAIL: { ttl: 10 * 60 * 1000, persist: true, maxSize: 500 * 1024 },
  CATEGORIES: { ttl: 30 * 60 * 1000, persist: true, maxSize: 100 * 1024 },
  COLLECTIONS: { ttl: 15 * 60 * 1000, persist: true, maxSize: 200 * 1024 },
  BANNERS: { ttl: 30 * 60 * 1000, persist: true, maxSize: 100 * 1024 },
  STORE_CONFIG: { ttl: 60 * 60 * 1000, persist: true, maxSize: 50 * 1024 },
  COUPONS: { ttl: 10 * 60 * 1000, persist: false, maxSize: 200 * 1024 },
  ASSETS: { ttl: 60 * 60 * 1000, persist: true, maxSize: 500 * 1024 },
  SIZE_GUIDES: { ttl: 60 * 60 * 1000, persist: true, maxSize: 200 * 1024 },
  ORDERS: { ttl: 2 * 60 * 1000, persist: false, maxSize: 500 * 1024 },
  COLLECTION_PRODUCTS: { ttl: 15 * 60 * 1000, persist: true, maxSize: 100 * 1024 },
} as const;

export type { CacheConfig, CacheStats };

