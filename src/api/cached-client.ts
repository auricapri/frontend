import { apiClient } from './client';
import { cacheService, CacheConfigs, CacheConfig } from '../services/cache.service';

interface CachedRequestOptions {
  cacheConfig?: CacheConfig;
  cacheKey?: string;
  invalidatePattern?: string | string[];
  skipCache?: boolean;
}

class CachedApiClient {
  private getCacheKey(endpoint: string, method: string = 'GET'): string {
    return `api:${method}:${endpoint}`;
  }

  async get<T>(endpoint: string, options?: CachedRequestOptions): Promise<T> {
    const cacheKey = options?.cacheKey || this.getCacheKey(endpoint, 'GET');
    const config = options?.cacheConfig;

    if (options?.skipCache || !config) {
      return apiClient.get<T>(endpoint);
    }

    return cacheService.getOrFetch<T>(
      cacheKey,
      () => apiClient.get<T>(endpoint),
      config
    );
  }

  async post<T>(endpoint: string, data?: unknown, options?: CachedRequestOptions): Promise<T> {
    const result = await apiClient.post<T>(endpoint, data);

    if (options?.invalidatePattern) {
      const patterns = Array.isArray(options.invalidatePattern)
        ? options.invalidatePattern
        : [options.invalidatePattern];

      for (const pattern of patterns) {
        await cacheService.invalidatePattern(pattern);
      }
    }

    return result;
  }

  async put<T>(endpoint: string, data?: unknown, options?: CachedRequestOptions): Promise<T> {
    const result = await apiClient.put<T>(endpoint, data);

    if (options?.invalidatePattern) {
      const patterns = Array.isArray(options.invalidatePattern)
        ? options.invalidatePattern
        : [options.invalidatePattern];

      for (const pattern of patterns) {
        await cacheService.invalidatePattern(pattern);
      }
    }

    return result;
  }

  async delete<T>(endpoint: string, options?: CachedRequestOptions): Promise<T> {
    const result = await apiClient.delete<T>(endpoint);

    if (options?.invalidatePattern) {
      const patterns = Array.isArray(options.invalidatePattern)
        ? options.invalidatePattern
        : [options.invalidatePattern];

      for (const pattern of patterns) {
        await cacheService.invalidatePattern(pattern);
      }
    }

    return result;
  }

  async patch<T>(endpoint: string, data?: unknown, options?: CachedRequestOptions): Promise<T> {
    const result = await apiClient.patch<T>(endpoint, data);

    if (options?.invalidatePattern) {
      const patterns = Array.isArray(options.invalidatePattern)
        ? options.invalidatePattern
        : [options.invalidatePattern];

      for (const pattern of patterns) {
        await cacheService.invalidatePattern(pattern);
      }
    }

    return result;
  }

  async downloadFile(endpoint: string, filename: string): Promise<void> {
    return apiClient.downloadFile(endpoint, filename);
  }

  async invalidateCache(pattern: string): Promise<void> {
    await cacheService.invalidatePattern(pattern);
  }

  async clearCache(): Promise<void> {
    await cacheService.clear();
  }

  getCacheStats() {
    return cacheService.getStats();
  }
}

export const cachedApiClient = new CachedApiClient();

export { CacheConfigs };
export type { CachedRequestOptions };

