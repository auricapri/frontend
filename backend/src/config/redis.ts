import Redis from 'ioredis';
import { env } from './env.js';
import logger from './logger.js';
import crypto from 'crypto';

interface RedisClients {
  primary: Redis | null;
  secondary: Redis | null;
}

let redisClients: RedisClients = {
  primary: null,
  secondary: null,
};

const createRedisClient = (url: string, label: string): Redis => {
  const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    reconnectOnError: (err: Error) => {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        return true;
      }
      return false;
    },
    enableOfflineQueue: false,
    lazyConnect: false,
  });

  client.on('connect', () => {
    logger.info(`Redis ${label} client connected`);
  });

  client.on('ready', () => {
    logger.info(`Redis ${label} client ready`);
  });

  client.on('error', (err: Error) => {
    logger.error(`Redis ${label} client error`, { error: err.message });
  });

  client.on('close', () => {
    logger.warn(`Redis ${label} client connection closed`);
  });

  client.on('reconnecting', () => {
    logger.info(`Redis ${label} client reconnecting`);
  });

  return client;
};

export const getRedisClient = (preferSecondary: boolean = false): Redis => {
  const hasPrimary = !!env.redis.primaryUrl;
  const hasSecondary = !!env.redis.secondaryUrl;

  if (!hasPrimary && !hasSecondary) {
    throw new Error('REDIS_URL_SERVER_PRIMARY or REDIS_URL environment variable is required');
  }

  if (preferSecondary && hasSecondary) {
    if (!redisClients.secondary) {
      try {
        redisClients.secondary = createRedisClient(env.redis.secondaryUrl, 'secondary');
      } catch (error) {
        logger.error('Failed to create Redis secondary client', { error });
        if (hasPrimary) {
          logger.warn('Falling back to primary Redis');
          return getRedisClient(false);
        }
        throw error;
      }
    }
    return redisClients.secondary;
  }

  if (hasPrimary) {
    if (!redisClients.primary) {
      try {
        redisClients.primary = createRedisClient(env.redis.primaryUrl, 'primary');
      } catch (error) {
        logger.error('Failed to create Redis primary client', { error });
        if (hasSecondary) {
          logger.warn('Falling back to secondary Redis');
          return getRedisClient(true);
        }
        throw error;
      }
    }
    return redisClients.primary;
  }

  throw new Error('No Redis server available');
};

function hashToBucket(key: string, buckets: number): number {
  const digest = crypto.createHash('sha256').update(key).digest();
  return digest[0] % buckets;
}

export function preferSecondaryForCacheKey(key: string): boolean {
  const hasSecondary = !!env.redis.secondaryUrl;
  if (!hasSecondary) return false;
  return hashToBucket(key, 2) === 1;
}

export const getRedisClientWithPreference = async <T>(
  preferSecondaryFirst: boolean,
  operation: (client: Redis) => Promise<T>,
  fallback?: () => Promise<T>
): Promise<T> => {
  const tryClient = async (client: Redis, label: string): Promise<T> => {
    try {
      return await operation(client);
    } catch (error) {
      logger.warn(`Redis ${label} operation failed`, { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  };

  const hasPrimary = !!env.redis.primaryUrl;
  const hasSecondary = !!env.redis.secondaryUrl;

  const order: Array<'primary' | 'secondary'> = preferSecondaryFirst
    ? ['secondary', 'primary']
    : ['primary', 'secondary'];

  for (const label of order) {
    if (label === 'primary' && hasPrimary) {
      try {
        return await tryClient(getRedisClient(false), 'primary');
      } catch {
        continue;
      }
    }
    if (label === 'secondary' && hasSecondary) {
      try {
        return await tryClient(getRedisClient(true), 'secondary');
      } catch {
        continue;
      }
    }
  }

  if (fallback) {
    logger.info('Using fallback function');
    return await fallback();
  }

  throw new Error('No Redis server available and no fallback provided');
};

export const getRedisClientWithFallback = async <T>(
  operation: (client: Redis) => Promise<T>,
  fallback?: () => Promise<T>
): Promise<T> => {
  return await getRedisClientWithPreference(false, operation, fallback);
};

export const getRedisClientWithFallbackByKey = async <T>(
  key: string,
  operation: (client: Redis) => Promise<T>,
  fallback?: () => Promise<T>
): Promise<T> => {
  const preferSecondary = preferSecondaryForCacheKey(key);
  return await getRedisClientWithPreference(preferSecondary, operation, fallback);
};

export const closeRedisConnection = async (): Promise<void> => {
  const promises: Promise<void>[] = [];

  if (redisClients.primary) {
    promises.push(
      redisClients.primary.quit().then(() => {
        redisClients.primary = null;
        logger.info('Redis primary connection closed');
      }).catch((error) => {
        logger.error('Error closing Redis primary connection', { error });
      })
    );
  }

  if (redisClients.secondary) {
    promises.push(
      redisClients.secondary.quit().then(() => {
        redisClients.secondary = null;
        logger.info('Redis secondary connection closed');
      }).catch((error) => {
        logger.error('Error closing Redis secondary connection', { error });
      })
    );
  }

  await Promise.all(promises);
};
