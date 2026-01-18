import { env } from '../config/env.js';
import logger from '../config/logger.js';
import { getRedisClientWithFallbackByKey } from '../config/redis.js';
import { fetchJsonWithRetry } from '../utils/http-client.js';

export interface WeatherData {
  temperatureC: number;
  weatherCode: number;
  windSpeedKmh: number;
  humidityPercent: number | null;
}

export class WeatherService {
  private readonly ttlSeconds = 60 * 60;

  private cacheKey(lat: number, lon: number): string {
    const rLat = Math.round(lat * 100) / 100;
    const rLon = Math.round(lon * 100) / 100;
    return `weather:v1:${rLat}:${rLon}`;
  }

  async getCurrentWeather(lat: number, lon: number): Promise<WeatherData | null> {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

    const key = this.cacheKey(lat, lon);
    
    try {
      const cached = await getRedisClientWithFallbackByKey(
        key,
        async (redis) => await redis.get(key),
        async () => null
      );
      
      if (cached) {
        try {
          return JSON.parse(cached) as WeatherData;
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
    } catch (error) {
      logger.debug('Failed to get weather from cache', { error });
    }

    try {
      const url = new URL('https://api.open-meteo.com/v1/forecast');
      url.searchParams.set('latitude', String(lat));
      url.searchParams.set('longitude', String(lon));
      url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m');

      const data = await fetchJsonWithRetry<{
        current?: {
          temperature_2m?: number;
          relative_humidity_2m?: number;
          weather_code?: number;
          wind_speed_10m?: number;
        };
      }>({
        url: url.toString(),
        timeoutMs: env.tax.requestTimeoutMs,
        maxRetries: env.tax.maxRetries,
      });

      const temp = Number(data.current?.temperature_2m);
      const code = Number(data.current?.weather_code);
      const wind = Number(data.current?.wind_speed_10m);
      const hum = data.current?.relative_humidity_2m;

      if (!Number.isFinite(temp) || !Number.isFinite(code) || !Number.isFinite(wind)) {
        return null;
      }

      const result: WeatherData = {
        temperatureC: temp,
        weatherCode: code,
        windSpeedKmh: wind,
        humidityPercent: typeof hum === 'number' && Number.isFinite(hum) ? hum : null,
      };

      await getRedisClientWithFallbackByKey(
        key,
        async (redis) => {
          await redis.setex(key, this.ttlSeconds, JSON.stringify(result));
        },
        async () => {
          logger.debug('Redis unavailable, weather result not cached', { key });
        }
      );

      return result;
    } catch (error: unknown) {
      logger.warn('Failed to fetch weather', { error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }
}

let singleton: WeatherService | null = null;
export function getWeatherService(): WeatherService {
  if (!singleton) singleton = new WeatherService();
  return singleton;
}
