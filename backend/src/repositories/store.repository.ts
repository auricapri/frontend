import { supabase } from '../config/supabase.js';
import { bumpCacheNamespaceVersion, getCachedJson, getCacheNamespaceVersion } from '../utils/cache.js';

export interface Category {
  id: string;
  name: any;
  slug: string;
  image_url?: string;
  is_active: boolean;
  seo_metadata?: any;
}

export interface Banner {
  id?: string;
  title: any;
  image_url: any;
  link_url?: string;
  position: string;
  is_active: boolean;
  sort_order: number;
}

export interface StoreConfig {
  id?: string;
  brand_name: string;
  about_us?: any;
  about_us_image?: string;
  terms_of_service: any;
  privacy_policy: any;
  contact_email?: string;
  support_phone?: string;
  tax_id?: string;
  address?: string;
  financial_settings?: any;
  loyalty_program?: any;
}

export interface SizeGuide {
  id: string;
  name: string;
  image_url: string;
}

const CATEGORY_SELECT_FIELDS = 'id, name, slug, image_url, is_active, seo_metadata';
const BANNER_SELECT_FIELDS = 'id, title, image_url, link_url, position, is_active, sort_order';
const STORE_CONFIG_SELECT_FIELDS = 'id, brand_name, about_us, about_us_image, terms_of_service, privacy_policy, contact_email, support_phone, tax_id, address, financial_settings, loyalty_program';
const SIZE_GUIDE_SELECT_FIELDS = 'id, name, image_url';

export class StoreRepository {
  async getAllCategories(): Promise<Category[]> {
    const v = await getCacheNamespaceVersion('store');
    const key = `cache:store:getAllCategories:v1:${v}`;
    return await getCachedJson(key, 300, async () => {
      const { data, error } = await supabase
        .from('categories')
        .select(CATEGORY_SELECT_FIELDS)
        .eq('is_active', true);
      
      if (error) throw error;
      return (data || []) as Category[];
    });
  }

  async getAllCategoriesAdmin(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('slug');

    if (error) throw error;
    return (data || []) as Category[];
  }

  async createCategory(category: Partial<Category>): Promise<Category> {
    // Strip out virtual/computed fields that don't exist in the database
    const { _associatedProductIds, ...categoryData } = category as any;

    const { data, error } = await supabase
      .from('categories')
      .insert(categoryData)
      .select('*')
      .single();

    if (error) throw error;
    await bumpCacheNamespaceVersion('store');
    return data as Category;
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    // Strip out virtual/computed fields that don't exist in the database
    const { _associatedProductIds, ...updateData } = updates as any;

    const { data, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    await bumpCacheNamespaceVersion('store');
    return data as Category;
  }

  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await bumpCacheNamespaceVersion('store');
  }

  async getAllBanners(): Promise<Banner[]> {
    const v = await getCacheNamespaceVersion('store');
    const key = `cache:store:getAllBanners:v1:${v}`;
    return await getCachedJson(key, 300, async () => {
      const { data, error } = await supabase
        .from('banners')
        .select(BANNER_SELECT_FIELDS)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return (data || []) as Banner[];
    });
  }

  async getConfig(): Promise<StoreConfig | null> {
    const v = await getCacheNamespaceVersion('store');
    const key = `cache:store:getConfig:v1:${v}`;
    return await getCachedJson(key, 300, async () => {
      const { data, error } = await supabase
        .from('store_config')
        .select(STORE_CONFIG_SELECT_FIELDS)
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as StoreConfig | null;
    });
  }

  async getAllSizeGuides(): Promise<SizeGuide[]> {
    const v = await getCacheNamespaceVersion('store');
    const key = `cache:store:getAllSizeGuides:v1:${v}`;
    return await getCachedJson(key, 300, async () => {
      const { data, error } = await supabase
        .from('size_guides')
        .select(SIZE_GUIDE_SELECT_FIELDS)
        .order('name');
      
      if (error) throw error;
      return (data || []) as SizeGuide[];
    });
  }

  async updateConfig(config: Partial<StoreConfig>): Promise<StoreConfig> {
    const { data, error } = await supabase
      .from('store_config')
      .update(config)
      .eq('id', config.id || 'main')
      .select(STORE_CONFIG_SELECT_FIELDS)
      .single();
    
    if (error) throw error;
    await bumpCacheNamespaceVersion('store');
    return data as StoreConfig;
  }
}
