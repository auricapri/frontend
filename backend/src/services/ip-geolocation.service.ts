import logger from '../config/logger.js';
import { getRedisClientWithFallbackByKey } from '../config/redis.js';
import { fetchJsonWithRetry } from '../utils/http-client.js';

export interface IpGeoResult {
  lat: number;
  lon: number;
  city: string;
  region: string;
  country: string;
}

interface IpApiResponse {
  status: string;
  city?: string;
  regionName?: string;
  country?: string;
  lat?: number;
  lon?: number;
}

export class IpGeolocationService {
  private readonly ttlSeconds = 24 * 60 * 60; // 24 horas

  private cacheKey(ip: string): string {
    return `ip-geo:v1:${ip}`;
  }

  private isPrivateIp(ip: string): boolean {
    if (!ip) return true;

    // IPv6 localhost
    if (ip === '::1' || ip === '::ffff:127.0.0.1') return true;

    // IPv4 localhost and private ranges
    if (ip === '127.0.0.1' || ip === 'localhost') return true;
    if (ip.startsWith('192.168.')) return true;
    if (ip.startsWith('10.')) return true;
    if (ip.startsWith('172.16.') || ip.startsWith('172.17.') ||
        ip.startsWith('172.18.') || ip.startsWith('172.19.') ||
        ip.startsWith('172.20.') || ip.startsWith('172.21.') ||
        ip.startsWith('172.22.') || ip.startsWith('172.23.') ||
        ip.startsWith('172.24.') || ip.startsWith('172.25.') ||
        ip.startsWith('172.26.') || ip.startsWith('172.27.') ||
        ip.startsWith('172.28.') || ip.startsWith('172.29.') ||
        ip.startsWith('172.30.') || ip.startsWith('172.31.')) return true;

    return false;
  }

  async getLocationByIp(ip: string): Promise<IpGeoResult | null> {
    // Ignorar IPs privados/localhost
    if (this.isPrivateIp(ip)) {
      logger.debug('Skipping IP geolocation for private IP', { ip });
      return null;
    }

    const key = this.cacheKey(ip);

    // Verificar cache
    try {
      const cached = await getRedisClientWithFallbackByKey(
        key,
        async (redis) => await redis.get(key),
        async () => null
      );

      if (cached) {
        try {
          return JSON.parse(cached) as IpGeoResult;
        } catch {
          // Cache inválido, deletar
          await getRedisClientWithFallbackByKey(
            key,
            async (redis) => { await redis.del(key); },
            async () => {}
          );
        }
      }
    } catch (error) {
      logger.debug('Failed to get IP geo from cache', { error });
    }

    // Buscar da API ip-api.com (gratuita, 45 req/min)
    try {
      const data = await fetchJsonWithRetry<IpApiResponse>({
        url: `http://ip-api.com/json/${ip}?fields=status,city,regionName,country,lat,lon`,
        method: 'GET',
        timeoutMs: 5000,
        maxRetries: 1
      });

      if (data.status !== 'success') {
        logger.debug('IP API returned non-success status', { ip, status: data.status });
        return null;
      }

      const lat = Number(data.lat);
      const lon = Number(data.lon);

      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        logger.debug('Invalid coordinates from IP API', { ip, lat, lon });
        return null;
      }

      const result: IpGeoResult = {
        lat,
        lon,
        city: data.city || 'Unknown',
        region: data.regionName || 'Unknown',
        country: data.country || 'Unknown'
      };

      // Salvar no cache
      await getRedisClientWithFallbackByKey(
        key,
        async (redis) => {
          await redis.setex(key, this.ttlSeconds, JSON.stringify(result));
        },
        async () => {
          logger.debug('Redis unavailable, IP geo result not cached', { key });
        }
      );

      logger.debug('IP geolocation resolved', { ip, city: result.city, country: result.country });
      return result;
    } catch (error: unknown) {
      logger.warn('Failed to fetch IP geolocation', {
        ip,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }
}

let singleton: IpGeolocationService | null = null;
export function getIpGeolocationService(): IpGeolocationService {
  if (!singleton) singleton = new IpGeolocationService();
  return singleton;
}
