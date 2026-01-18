import logger from '../config/logger.js';
import { getRedisClientWithFallbackByKey } from '../config/redis.js';

const inflight = new Map<string, Promise<unknown>>();

type NamespaceState = {
  value: string;
  expiresAtMs: number;
};

const namespaceVersions = new Map<string, NamespaceState>();

function nowMs(): number {
  return Date.now();
}

function namespaceKey(namespace: string): string {
  return `cache:ns:${namespace}:v1`;
}

export async function getCacheNamespaceVersion(namespace: string): Promise<string> {
  const cached = namespaceVersions.get(namespace);
  if (cached && cached.expiresAtMs > nowMs()) {
    return cached.value;
  }

  const key = namespaceKey(namespace);
  const value = await getRedisClientWithFallbackByKey(
    key,
    async (redis) => (await redis.get(key)) || '0',
    async () => '0'
  );

  namespaceVersions.set(namespace, { value, expiresAtMs: nowMs() + 1000 });
  return value;
}

export async function bumpCacheNamespaceVersion(namespace: string): Promise<void> {
  const key = namespaceKey(namespace);
  const value = await getRedisClientWithFallbackByKey(
    key,
    async (redis) => String(await redis.incr(key)),
    async () => String(nowMs())
  );

  namespaceVersions.set(namespace, { value, expiresAtMs: nowMs() + 1000 });
}

export async function getCachedJson<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>
): Promise<T> {
  const existing = inflight.get(key);
  if (existing) {
    return (await existing) as T;
  }

  const promise = (async () => {
    const cached = await getRedisClientWithFallbackByKey(
      key,
      async (redis) => await redis.get(key),
      async () => null
    );

    if (cached) {
      try {
        return JSON.parse(cached) as T;
      } catch {
        await getRedisClientWithFallbackByKey(
          key,
          async (redis) => {
            await redis.del(key);
          },
          async () => {}
        );
      }
    }

    const value = await loader();

    try {
      await getRedisClientWithFallbackByKey(
        key,
        async (redis) => {
          await redis.setex(key, Math.max(1, ttlSeconds), JSON.stringify(value));
        },
        async () => {}
      );
    } catch (error: unknown) {
      logger.debug('Failed to write cache', { key, error: error instanceof Error ? error.message : String(error) });
    }

    return value;
  })();

  inflight.set(key, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(key);
  }
}

