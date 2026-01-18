import { describe, it, expect, vi, beforeEach } from 'vitest';

const redisStore = new Map<string, string>();

vi.mock('../../config/redis.js', () => {
  const client = {
    get: async (key: string) => redisStore.get(key) ?? null,
    setex: async (key: string, _ttl: number, value: string) => {
      redisStore.set(key, value);
    },
    del: async (key: string) => {
      redisStore.delete(key);
    },
    incr: async (key: string) => {
      const current = Number(redisStore.get(key) ?? '0');
      const next = Number.isFinite(current) ? current + 1 : 1;
      redisStore.set(key, String(next));
      return next;
    },
  };

  return {
    getRedisClientWithFallbackByKey: async <T>(
      _key: string,
      operation: (redis: any) => Promise<T>,
      fallback?: () => Promise<T>
    ) => {
      try {
        return await operation(client);
      } catch {
        if (fallback) return await fallback();
        throw new Error('Redis mock failed');
      }
    },
  };
});

import { bumpCacheNamespaceVersion, getCachedJson, getCacheNamespaceVersion } from '../../utils/cache.js';

describe('cache utils', () => {
  beforeEach(() => {
    redisStore.clear();
  });

  it('deduplicates concurrent loads', async () => {
    let calls = 0;

    const loader = async () => {
      calls += 1;
      return { ok: true };
    };

    const p1 = getCachedJson('k1', 60, loader);
    const p2 = getCachedJson('k1', 60, loader);

    const [a, b] = await Promise.all([p1, p2]);
    expect(a).toEqual({ ok: true });
    expect(b).toEqual({ ok: true });
    expect(calls).toBe(1);
  });

  it('caches values in redis', async () => {
    let calls = 0;

    const loader = async () => {
      calls += 1;
      return { value: 'x' };
    };

    const first = await getCachedJson('k2', 60, loader);
    const second = await getCachedJson('k2', 60, loader);

    expect(first).toEqual({ value: 'x' });
    expect(second).toEqual({ value: 'x' });
    expect(calls).toBe(1);
  });

  it('bumps namespace versions', async () => {
    const v1 = await getCacheNamespaceVersion('products');
    await bumpCacheNamespaceVersion('products');
    const v2 = await getCacheNamespaceVersion('products');
    expect(v2).not.toBe(v1);
  });
});

