import { supabase } from '../config/supabase.js';
import type { Asset } from '../../shared/types/index.js';
import { bumpCacheNamespaceVersion, getCachedJson, getCacheNamespaceVersion } from '../utils/cache.js';

export type { Asset };

const ASSET_SELECT_FIELDS = 'id, name, cost_price, stock_quantity, min_stock_level, image_url, created_at';

export class AssetsRepository {
  async getAll(options?: { limit?: number; offset?: number }): Promise<Asset[]> {
    const limit = Math.min(Math.max(options?.limit || 20, 1), 100);
    const offset = Math.max(options?.offset || 0, 0);

    const v = await getCacheNamespaceVersion('assets');
    const key = `cache:assets:getAll:v1:${v}:${limit}:${offset}`;
    return await getCachedJson(key, 60, async () => {
      const query = supabase
        .from('assets')
        .select(ASSET_SELECT_FIELDS)
        .order('name')
        .range(offset, offset + limit - 1);
      
      const { data, error } = await query;
      
      if (error) throw error;
      return (data || []) as Asset[];
    });
  }

  async getByIds(ids: string[]): Promise<Asset[]> {
    if (!ids || ids.length === 0) return [];

    const v = await getCacheNamespaceVersion('assets');
    const key = `cache:assets:getByIds:v1:${v}:${ids.slice().sort().join(',')}`;
    return await getCachedJson(key, 60, async () => {
      const { data, error } = await supabase
        .from('assets')
        .select(ASSET_SELECT_FIELDS)
        .in('id', ids);

      if (error) throw error;
      return (data || []) as Asset[];
    });
  }

  async getById(id: string): Promise<Asset | null> {
    const v = await getCacheNamespaceVersion('assets');
    const key = `cache:assets:getById:v1:${v}:${id}`;
    return await getCachedJson(key, 300, async () => {
      const { data, error } = await supabase
        .from('assets')
        .select(ASSET_SELECT_FIELDS)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Asset | null;
    });
  }

  async updateStock(assetId: string, quantity: number): Promise<void> {
    const { error } = await supabase
      .from('assets')
      .update({ stock_quantity: Math.max(0, quantity) })
      .eq('id', assetId);
    
    if (error) throw error;
    await bumpCacheNamespaceVersion('assets');
  }

  async create(asset: Partial<Asset>): Promise<Asset> {
    const { data, error } = await supabase
      .from('assets')
      .insert(asset)
      .select(ASSET_SELECT_FIELDS)
      .single();
    
    if (error) throw error;
    await bumpCacheNamespaceVersion('assets');
    return data as Asset;
  }

  async update(id: string, updates: Partial<Asset>): Promise<Asset> {
    const { data, error } = await supabase
      .from('assets')
      .update(updates)
      .eq('id', id)
      .select(ASSET_SELECT_FIELDS)
      .single();
    
    if (error) throw error;
    await bumpCacheNamespaceVersion('assets');
    return data as Asset;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    await bumpCacheNamespaceVersion('assets');
  }
}
