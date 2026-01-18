import logger from '../config/logger.js';
import { getRedisClientWithFallbackByKey } from '../config/redis.js';
import crypto from 'crypto';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface GeocodingResult {
  coordinates: Coordinates | null;
  error?: string;
}

interface DirectionsRoute {
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  } | null;
  distance: number;
  duration: number;
  error?: string;
}

interface DirectionsRouteWithSteps {
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  } | null;
  distance: number;
  duration: number;
  steps: any[];
  legs: Array<{
    steps: any[];
    distance: number;
    duration: number;
    summary?: string;
  }>;
  error?: string;
}

export class GeocodingService {
  private mapboxToken: string;
  private readonly CACHE_TTL_SECONDS = 24 * 60 * 60;
  private readonly MAX_CACHE_VALUE_BYTES = 40_000;

  constructor() {
    this.mapboxToken = process.env.MAPBOX_TOKEN || '';
  }

  private normalizeAddress(address: string): string {
    return address.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private sha256Hex(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  private roundCoord(n: number): number {
    return Math.round(n * 1000) / 1000;
  }

  private async fetchJson<T>(url: string, timeoutMs: number): Promise<{ ok: boolean; statusText: string; json?: T }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        return { ok: false, statusText: response.statusText };
      }
      const json = await response.json() as T;
      return { ok: true, statusText: response.statusText, json };
    } finally {
      clearTimeout(timeout);
    }
  }

  private async getCached<T>(key: string): Promise<T | null> {
    try {
      const raw = await getRedisClientWithFallbackByKey(
        key,
        async (redis) => await redis.get(key),
        async () => null
      );
      if (!raw) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    } catch {
      return null;
    }
  }

  private async setCached(key: string, value: unknown): Promise<void> {
    try {
      await getRedisClientWithFallbackByKey(
        key,
        async (redis) => {
          const payload = JSON.stringify(value);
          const sizeBytes = Buffer.byteLength(payload, 'utf8');
          if (sizeBytes > this.MAX_CACHE_VALUE_BYTES) return;
          await redis.setex(key, this.CACHE_TTL_SECONDS, payload);
        },
        async () => {
          logger.debug('Redis unavailable, geocoding result not cached', { key });
        }
      );
    } catch (error) {
      logger.debug('Failed to cache geocoding result', { key, error });
    }
  }

  async geocodeAddress(address: string): Promise<GeocodingResult> {
    const normalized = this.normalizeAddress(address);
    const cacheKey = `geocode:v1:${this.sha256Hex(normalized)}`;
    const cached = await this.getCached<GeocodingResult>(cacheKey);
    if (cached) return cached;

    try {
      if (!this.mapboxToken) {
        return { coordinates: null, error: 'MAPBOX_TOKEN not configured' };
      }

      const encodedAddress = encodeURIComponent(address);
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${this.mapboxToken}&limit=1&country=BR`;

      const response = await this.fetchJson<{ features?: Array<{ center: [number, number] }> }>(url, 5000);

      if (!response.ok || !response.json) {
        const result: GeocodingResult = {
          coordinates: null,
          error: `Geocoding failed: ${response.statusText}`
        };
        return result;
      }

      const data = response.json;

      if (!data.features || data.features.length === 0) {
        const result: GeocodingResult = {
          coordinates: null,
          error: 'No results found for address'
        };
        await this.setCached(cacheKey, result);
        return result;
      }
      
      const [longitude, latitude] = data.features[0].center;
      
      const result: GeocodingResult = {
        coordinates: { latitude, longitude }
      };
      
      await this.setCached(cacheKey, result);
      return result;
    } catch (error) {
      const result: GeocodingResult = {
        coordinates: null,
        error: error instanceof Error ? error.message : 'Unknown error during geocoding'
      };
      return result;
    }
  }

  async getDirectionsRoute(
    origin: Coordinates,
    destination: Coordinates,
    profile: 'driving' | 'walking' | 'cycling' = 'driving'
  ): Promise<DirectionsRoute> {
    const oLat = this.roundCoord(origin.latitude);
    const oLon = this.roundCoord(origin.longitude);
    const dLat = this.roundCoord(destination.latitude);
    const dLon = this.roundCoord(destination.longitude);
    const cacheKey = `directions:v1:${oLat},${oLon}:${dLat},${dLon}:${profile}`;
    const cached = await this.getCached<DirectionsRoute>(cacheKey);
    if (cached) return cached;

    try {
      if (!this.mapboxToken) {
        return { geometry: null, distance: 0, duration: 0, error: 'MAPBOX_TOKEN not configured' };
      }

      const originStr = `${origin.longitude},${origin.latitude}`;
      const destStr = `${destination.longitude},${destination.latitude}`;
      const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${originStr};${destStr}?access_token=${this.mapboxToken}&geometries=geojson&overview=full`;

      const response = await this.fetchJson<{ routes?: Array<{ geometry: DirectionsRoute['geometry']; distance: number; duration: number }> }>(url, 5000);

      if (!response.ok || !response.json) {
        const result: DirectionsRoute = {
          geometry: null,
          distance: 0,
          duration: 0,
          error: `Directions API failed: ${response.statusText}`
        };
        return result;
      }

      const data = response.json;

      if (!data.routes || data.routes.length === 0) {
        const result: DirectionsRoute = {
          geometry: null,
          distance: 0,
          duration: 0,
          error: 'No route found'
        };
        return result;
      }
      
      const route = data.routes[0];
      
      const result: DirectionsRoute = {
        geometry: route.geometry,
        distance: route.distance,
        duration: route.duration
      };
      
      await this.setCached(cacheKey, result);
      return result;
    } catch (error) {
      const result: DirectionsRoute = {
        geometry: null,
        distance: 0,
        duration: 0,
        error: error instanceof Error ? error.message : 'Unknown error during directions request'
      };
      return result;
    }
  }

  async getDirectionsRouteWithSteps(
    origin: Coordinates,
    destination: Coordinates,
    profile: 'driving' | 'walking' | 'cycling' = 'driving'
  ): Promise<DirectionsRouteWithSteps> {
    try {
      if (!this.mapboxToken) {
        return {
          geometry: null,
          distance: 0,
          duration: 0,
          steps: [],
          legs: [],
          error: 'MAPBOX_TOKEN not configured'
        };
      }

      const originStr = `${origin.longitude},${origin.latitude}`;
      const destStr = `${destination.longitude},${destination.latitude}`;
      const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${originStr};${destStr}?access_token=${this.mapboxToken}&geometries=geojson&overview=full&steps=true&annotations=distance,duration`;

      const response = await this.fetchJson<{
        routes?: Array<{
          geometry: DirectionsRouteWithSteps['geometry'];
          distance: number;
          duration: number;
          legs?: Array<{
            steps: any[];
            distance: number;
            duration: number;
            summary?: string;
          }>;
        }>;
      }>(url, 8000);

      if (!response.ok || !response.json) {
        return {
          geometry: null,
          distance: 0,
          duration: 0,
          steps: [],
          legs: [],
          error: `Directions API failed: ${response.statusText}`
        };
      }

      const data = response.json;

      if (!data.routes || data.routes.length === 0) {
        return {
          geometry: null,
          distance: 0,
          duration: 0,
          steps: [],
          legs: [],
          error: 'No route found'
        };
      }
      
      const route = data.routes[0];
      const leg = route.legs?.[0];
      
      return {
        geometry: route.geometry,
        distance: route.distance,
        duration: route.duration,
        steps: leg?.steps || [],
        legs: route.legs || []
      };
    } catch (error) {
      logger.warn('Directions request failed', { error });
      return {
        geometry: null,
        distance: 0,
        duration: 0,
        steps: [],
        legs: [],
        error: error instanceof Error ? error.message : 'Unknown error during directions request'
      };
    }
  }
}
