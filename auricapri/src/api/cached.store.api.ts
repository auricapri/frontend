import { cachedApiClient, CacheConfigs } from './cached-client';
import { Category, Banner, StoreConfig, SizeGuide, Product, Collection, Coupon, Asset } from '../types';

export type StoreBootstrapResponse = {
  products: Product[];
  categories: Category[];
  collections: Collection[];
  banners: Banner[];
  config: StoreConfig | null;
  relations: Array<{ product_id: string; collection_id: string }>;
  coupons: Coupon[];
  assets: Asset[];
  sizeGuides: SizeGuide[];
};

export class CachedStoreApi {
  async getBootstrap(): Promise<StoreBootstrapResponse> {
    return cachedApiClient.get<StoreBootstrapResponse>('/store/bootstrap', {
      cacheConfig: CacheConfigs.STORE_BOOTSTRAP,
      cacheKey: 'api:store:bootstrap',
    });
  }

  async getAllCategories(): Promise<Category[]> {
    return cachedApiClient.get<Category[]>('/store/categories', {
      cacheConfig: CacheConfigs.CATEGORIES,
      cacheKey: 'api:store:categories',
    });
  }

  async getAllBanners(): Promise<Banner[]> {
    return cachedApiClient.get<Banner[]>('/store/banners', {
      cacheConfig: CacheConfigs.BANNERS,
      cacheKey: 'api:store:banners',
    });
  }

  async getConfig(): Promise<StoreConfig | null> {
    return cachedApiClient.get<StoreConfig | null>('/store/config', {
      cacheConfig: CacheConfigs.STORE_CONFIG,
      cacheKey: 'api:store:config',
    });
  }

  async getAllSizeGuides(): Promise<SizeGuide[]> {
    return cachedApiClient.get<SizeGuide[]>('/store/size-guides', {
      cacheConfig: CacheConfigs.SIZE_GUIDES,
      cacheKey: 'api:store:size-guides',
    });
  }

  async updateConfig(config: Partial<StoreConfig>): Promise<StoreConfig> {
    return cachedApiClient.put<StoreConfig>('/store/config', config, {
      invalidatePattern: ['api:store:config'],
    });
  }
}
