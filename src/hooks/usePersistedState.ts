/**
 * Persisted State Hook
 *
 * React hook for state that persists to localStorage.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createStorage, type StorageOptions } from '../lib/storage';

/**
 * Use state that persists to localStorage
 */
export function usePersistedState<T>(options: StorageOptions<T>) {
  const storageRef = useRef(createStorage(options));
  const [state, setStateInternal] = useState<T>(() => storageRef.current.get());

  // Sync state to storage when it changes
  const setState = useCallback((value: T | ((prev: T) => T)) => {
    setStateInternal((prev) => {
      const next = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
      storageRef.current.set(next);
      return next;
    });
  }, []);

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `auricapri_${options.key}`) {
        setStateInternal(storageRef.current.get());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [options.key]);

  const reset = useCallback(() => {
    storageRef.current.remove();
    setStateInternal(options.defaultValue);
  }, [options.defaultValue]);

  return [state, setState, reset] as const;
}

/**
 * Use persisted array state with helper methods
 */
export function usePersistedArray<T>(options: StorageOptions<T[]>) {
  const [items, setItems, reset] = usePersistedState({
    ...options,
    defaultValue: options.defaultValue || [],
  });

  const push = useCallback(
    (item: T) => {
      setItems((arr) => [...arr, item]);
    },
    [setItems]
  );

  const remove = useCallback(
    (predicate: (item: T) => boolean) => {
      setItems((arr) => arr.filter((item) => !predicate(item)));
    },
    [setItems]
  );

  const update = useCallback(
    (predicate: (item: T) => boolean, updater: (item: T) => T) => {
      setItems((arr) => arr.map((item) => (predicate(item) ? updater(item) : item)));
    },
    [setItems]
  );

  const find = useCallback(
    (predicate: (item: T) => boolean) => {
      return items.find(predicate);
    },
    [items]
  );

  return {
    items,
    setItems,
    push,
    remove,
    update,
    find,
    reset,
    length: items.length,
  };
}

/**
 * Use persisted object state with merge support
 */
export function usePersistedObject<T extends Record<string, unknown>>(options: StorageOptions<T>) {
  const [state, setState, reset] = usePersistedState(options);

  const merge = useCallback(
    (partial: Partial<T>) => {
      setState((prev) => ({ ...prev, ...partial }));
    },
    [setState]
  );

  const setField = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setState((prev) => ({ ...prev, [field]: value }));
    },
    [setState]
  );

  return {
    state,
    setState,
    merge,
    setField,
    reset,
  };
}
