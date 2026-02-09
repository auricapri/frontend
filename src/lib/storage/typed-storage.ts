/**
 * Typed LocalStorage Wrapper
 *
 * Provides type-safe access to localStorage with serialization and validation.
 */

export interface StorageOptions<T> {
  /** Storage key */
  key: string;
  /** Default value when key doesn't exist */
  defaultValue: T;
  /** Optional TTL in milliseconds */
  ttl?: number;
  /** Custom serializer */
  serialize?: (value: T) => string;
  /** Custom deserializer */
  deserialize?: (raw: string) => T;
  /** Validator function */
  validate?: (value: unknown) => value is T;
  /** Storage version for migrations */
  version?: number;
}

interface StorageWrapper<T> {
  timestamp: number;
  version: number;
  data: T;
}

const STORAGE_PREFIX = 'auricapri_';

/**
 * Create a typed storage accessor
 */
export function createStorage<T>(options: StorageOptions<T>) {
  const {
    key,
    defaultValue,
    ttl,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    validate,
    version = 1,
  } = options;

  const fullKey = `${STORAGE_PREFIX}${key}`;

  return {
    /**
     * Get value from storage
     */
    get(): T {
      try {
        const raw = localStorage.getItem(fullKey);
        if (!raw) return defaultValue;

        const wrapper = JSON.parse(raw) as StorageWrapper<unknown>;

        // Check version
        if (wrapper.version !== version) {
          localStorage.removeItem(fullKey);
          return defaultValue;
        }

        // Check TTL
        if (ttl && Date.now() - wrapper.timestamp > ttl) {
          localStorage.removeItem(fullKey);
          return defaultValue;
        }

        const data = deserialize(JSON.stringify(wrapper.data));

        // Validate if validator provided
        if (validate && !validate(data)) {
          localStorage.removeItem(fullKey);
          return defaultValue;
        }

        return data;
      } catch {
        localStorage.removeItem(fullKey);
        return defaultValue;
      }
    },

    /**
     * Set value in storage
     */
    set(value: T): void {
      try {
        const wrapper: StorageWrapper<T> = {
          timestamp: Date.now(),
          version,
          data: JSON.parse(serialize(value)),
        };
        localStorage.setItem(fullKey, JSON.stringify(wrapper));
      } catch (error) {
        console.warn(`Failed to set storage key "${key}":`, error);
      }
    },

    /**
     * Update value using a function
     */
    update(updater: (current: T) => T): void {
      const current = this.get();
      this.set(updater(current));
    },

    /**
     * Remove value from storage
     */
    remove(): void {
      localStorage.removeItem(fullKey);
    },

    /**
     * Check if key exists and is valid
     */
    exists(): boolean {
      try {
        const raw = localStorage.getItem(fullKey);
        if (!raw) return false;

        const wrapper = JSON.parse(raw) as StorageWrapper<unknown>;

        if (wrapper.version !== version) return false;
        if (ttl && Date.now() - wrapper.timestamp > ttl) return false;

        return true;
      } catch {
        return false;
      }
    },

    /**
     * Get metadata about the stored value
     */
    getMetadata(): { timestamp: number; version: number; size: number } | null {
      try {
        const raw = localStorage.getItem(fullKey);
        if (!raw) return null;

        const wrapper = JSON.parse(raw) as StorageWrapper<unknown>;
        return {
          timestamp: wrapper.timestamp,
          version: wrapper.version,
          size: raw.length,
        };
      } catch {
        return null;
      }
    },
  };
}

/**
 * Create a storage accessor for arrays with helper methods
 */
export function createArrayStorage<T>(options: StorageOptions<T[]>) {
  const storage = createStorage({ ...options, defaultValue: options.defaultValue || [] });

  return {
    ...storage,

    /**
     * Add item to array
     */
    push(item: T): void {
      storage.update((arr) => [...arr, item]);
    },

    /**
     * Remove item by predicate
     */
    removeWhere(predicate: (item: T) => boolean): void {
      storage.update((arr) => arr.filter((item) => !predicate(item)));
    },

    /**
     * Find item by predicate
     */
    find(predicate: (item: T) => boolean): T | undefined {
      return storage.get().find(predicate);
    },

    /**
     * Check if item exists
     */
    some(predicate: (item: T) => boolean): boolean {
      return storage.get().some(predicate);
    },

    /**
     * Update item by predicate
     */
    updateWhere(predicate: (item: T) => boolean, updater: (item: T) => T): void {
      storage.update((arr) => arr.map((item) => (predicate(item) ? updater(item) : item)));
    },

    /**
     * Get array length
     */
    length(): number {
      return storage.get().length;
    },
  };
}

/**
 * Create a storage accessor for objects with merge support
 */
export function createObjectStorage<T extends Record<string, unknown>>(
  options: StorageOptions<T>
) {
  const storage = createStorage(options);

  return {
    ...storage,

    /**
     * Merge partial update into stored object
     */
    merge(partial: Partial<T>): void {
      storage.update((obj) => ({ ...obj, ...partial }));
    },

    /**
     * Get a specific field
     */
    getField<K extends keyof T>(field: K): T[K] {
      return storage.get()[field];
    },

    /**
     * Set a specific field
     */
    setField<K extends keyof T>(field: K, value: T[K]): void {
      storage.update((obj) => ({ ...obj, [field]: value }));
    },
  };
}

// Pre-defined storage accessors for common use cases
export const storageAccessors = {
  /**
   * User preferences storage
   */
  preferences: createObjectStorage({
    key: 'user_preferences',
    defaultValue: {
      theme: 'system' as 'light' | 'dark' | 'system',
      locale: 'pt' as 'pt' | 'en' | 'es',
      notifications: true,
      analytics: true,
    },
    version: 1,
  }),

  /**
   * Recently viewed products
   */
  recentlyViewed: createArrayStorage({
    key: 'recently_viewed',
    defaultValue: [] as string[],
    ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
    version: 1,
  }),

  /**
   * Search history
   */
  searchHistory: createArrayStorage({
    key: 'search_history',
    defaultValue: [] as string[],
    ttl: 30 * 24 * 60 * 60 * 1000, // 30 days
    version: 1,
  }),

  /**
   * Dismissed alerts/banners
   */
  dismissedAlerts: createArrayStorage({
    key: 'dismissed_alerts',
    defaultValue: [] as string[],
    version: 1,
  }),

  /**
   * Last sync timestamps
   */
  syncTimestamps: createObjectStorage({
    key: 'sync_timestamps',
    defaultValue: {} as Record<string, number>,
    version: 1,
  }),
};
