import type { Request, Response, NextFunction } from 'express';
import { env } from '../../config/env.js';
import { getRedisClientWithFallbackByKey, getRedisClientWithPreference } from '../../config/redis.js';
import { gzip as gzipCb, gunzip as gunzipCb } from 'zlib';
import { promisify } from 'util';

const hasRedis = !!(env.redis.primaryUrl || env.redis.secondaryUrl || env.redis.url);

const MAX_CACHE_VALUE_BYTES = 120_000;
const MAX_CACHE_COMPRESSED_BYTES = 220_000;

const gzip = promisify(gzipCb);
const gunzip = promisify(gunzipCb);

async function decodeCachedPayload(raw: string): Promise<string> {
  if (!raw.startsWith('gz:')) return raw;
  const b64 = raw.slice(3);
  const compressed = Buffer.from(b64, 'base64');
  const decompressed = await gunzip(compressed);
  return decompressed.toString('utf8');
}

async function encodeCachedPayload(payload: string): Promise<string | null> {
  const payloadBytes = Buffer.byteLength(payload, 'utf8');
  if (payloadBytes <= MAX_CACHE_VALUE_BYTES) return payload;

  const compressed = await gzip(Buffer.from(payload, 'utf8'));
  if (compressed.byteLength > MAX_CACHE_COMPRESSED_BYTES) return null;
  return `gz:${compressed.toString('base64')}`;
}

function buildKey(prefix: string, req: Request): string {
  return `${prefix}:${req.method}:${req.originalUrl}`;
}

export function cacheJson(options: {
  prefix: string;
  ttlSeconds: number;
  cacheControl: string;
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', options.cacheControl);

    if (!hasRedis || req.method !== 'GET') {
      return next();
    }

    const key = buildKey(options.prefix, req);

    try {
      const cached = await getRedisClientWithFallbackByKey(
        key,
        async (redis) => await redis.get(key),
        async () => null
      );
      
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        res.type('application/json');
        const decoded = await decodeCachedPayload(cached);
        return res.status(200).send(decoded);
      }

      const originalJson = (res as any).json.bind(res);
      (res as any).json = (body: unknown) => {
        const payload = JSON.stringify(body);
        void encodeCachedPayload(payload).then((encoded) => {
          if (!encoded) return;
          return getRedisClientWithFallbackByKey(
            key,
            async (redis) => {
              await redis.setex(key, options.ttlSeconds, encoded);
            },
            async () => {}
          );
        }).catch(() => {});
        res.setHeader('X-Cache', 'MISS');
        return originalJson(body);
      };

      return next();
    } catch {
      return next();
    }
  };
}

export async function invalidateCacheByPrefix(prefix: string): Promise<number> {
  if (!hasRedis) return 0;

  const hasPrimary = !!env.redis.primaryUrl;
  const hasSecondary = !!env.redis.secondaryUrl;

  const invalidateOn = async (preferSecondaryFirst: boolean): Promise<number> => {
    let cursor = '0';
    let removed = 0;
    const match = `${prefix}:*`;

    try {
      do {
        const result = await getRedisClientWithPreference(
          preferSecondaryFirst,
          async (redis) => {
            return await redis.scan(cursor, 'MATCH', match, 'COUNT', '100');
          },
          async () => ['0', []] as [string, string[]]
        );

        cursor = result[0];
        const keys = result[1];
        if (keys.length > 0) {
          await getRedisClientWithPreference(
            preferSecondaryFirst,
            async (redis) => {
              await redis.del(...keys);
            },
            async () => {}
          );
          removed += keys.length;
        }
      } while (cursor !== '0');
    } catch {
      return removed;
    }

    return removed;
  };

  if (hasPrimary && hasSecondary) {
    const [removedPrimary, removedSecondary] = await Promise.all([
      invalidateOn(false),
      invalidateOn(true),
    ]);
    return removedPrimary + removedSecondary;
  }

  if (hasSecondary && !hasPrimary) {
    return await invalidateOn(true);
  }

  return await invalidateOn(false);
}
