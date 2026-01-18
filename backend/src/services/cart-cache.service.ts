import { getRedisClientWithFallback } from '../config/redis.js';
import { CartRepository, type CartSession } from '../repositories/cart.repository.js';
import logger from '../config/logger.js';

const CART_TTL_SECONDS = 4 * 60 * 60;
const MAX_CART_CACHE_BYTES = 20_000;

export class CartCacheService {
  private cartRepo: CartRepository;

  constructor() {
    this.cartRepo = new CartRepository();
  }

  private getCacheKey(sessionKey: string): string {
    return `cart:${sessionKey}`;
  }

  async getCart(sessionKey: string): Promise<CartSession | null> {
    const cacheKey = this.getCacheKey(sessionKey);

    try {
      const cached = await getRedisClientWithFallback(
        async (redis) => await redis.get(cacheKey),
        async () => null
      );

      if (cached) {
        logger.debug('Cart cache hit', { sessionKey });
        return JSON.parse(cached) as CartSession;
      }

      logger.debug('Cart cache miss', { sessionKey });
      const cart = await this.cartRepo.getCart(sessionKey);

      if (cart) {
        const serialized = JSON.stringify(cart);
        const sizeBytes = Buffer.byteLength(serialized, 'utf8');
        if (sizeBytes > MAX_CART_CACHE_BYTES) {
          return cart;
        }
        await getRedisClientWithFallback(
          async (redis) => {
            await redis.setex(cacheKey, CART_TTL_SECONDS, serialized);
          },
          async () => {
            logger.warn('Redis unavailable, cart not cached', { sessionKey });
          }
        );
        logger.debug('Cart populated in cache', { sessionKey });
      }

      return cart;
    } catch (error) {
      logger.error('Error in cart cache get', { error, sessionKey });
      const cart = await this.cartRepo.getCart(sessionKey);
      return cart;
    }
  }

  async saveCart(sessionKey: string, cart: CartSession): Promise<void> {
    const cacheKey = this.getCacheKey(sessionKey);

    try {
      await this.cartRepo.saveCart(sessionKey, cart.items, cart.user_id || undefined);
      const serialized = JSON.stringify(cart);
      const sizeBytes = Buffer.byteLength(serialized, 'utf8');
      if (sizeBytes > MAX_CART_CACHE_BYTES) {
        logger.debug('Cart too large for cache', { sessionKey, sizeBytes });
        return;
      }
      await getRedisClientWithFallback(
        async (redis) => {
          await redis.setex(cacheKey, CART_TTL_SECONDS, serialized);
        },
        async () => {
          logger.warn('Redis unavailable, cart saved only to database', { sessionKey });
        }
      );
      
      logger.debug('Cart saved to cache and database', { sessionKey });
    } catch (error) {
      logger.error('Error saving cart to cache', { error, sessionKey });
      await this.cartRepo.saveCart(sessionKey, cart.items, cart.user_id || undefined);
    }
  }

  async deleteCart(sessionKey: string): Promise<void> {
    const cacheKey = this.getCacheKey(sessionKey);

    try {
      await getRedisClientWithFallback(
        async (redis) => {
          await redis.del(cacheKey);
        },
        async () => {
          logger.warn('Redis unavailable, cache not cleared', { sessionKey });
        }
      );
      
      await this.cartRepo.deleteCart(sessionKey);
      logger.debug('Cart deleted from cache and database', { sessionKey });
    } catch (error) {
      logger.error('Error deleting cart from cache', { error, sessionKey });
      await this.cartRepo.deleteCart(sessionKey);
    }
  }

  async refreshTTL(sessionKey: string): Promise<void> {
    const cacheKey = this.getCacheKey(sessionKey);

    try {
      await getRedisClientWithFallback(
        async (redis) => {
          const exists = await redis.exists(cacheKey);
          if (exists) {
            await redis.expire(cacheKey, CART_TTL_SECONDS);
            logger.debug('Cart cache TTL refreshed', { sessionKey });
          }
        },
        async () => {
          logger.debug('Redis unavailable, TTL not refreshed', { sessionKey });
        }
      );
    } catch (error) {
      logger.error('Error refreshing cart cache TTL', { error, sessionKey });
    }
  }
}
