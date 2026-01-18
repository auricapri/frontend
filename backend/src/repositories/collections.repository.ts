import { supabase } from '../config/supabase.js';
import { bumpCacheNamespaceVersion, getCachedJson, getCacheNamespaceVersion } from '../utils/cache.js';

export interface Collection {
  id: string;
  name: string | { [key: string]: string };
  description?: string | { [key: string]: string };
  slug: string;
  image_url?: string;
  is_active: boolean;
  seo_metadata?: Record<string, unknown>;
  deleted_at?: string | null;
  deleted_by?: string | null;
}

const COLLECTION_SELECT_FIELDS = 'id, name, description, slug, image_url, is_active, seo_metadata, deleted_at, deleted_by';

export class CollectionsRepository {
  async getAllActive(options?: { limit?: number; offset?: number }): Promise<Collection[]> {
    const limit = Math.min(Math.max(options?.limit || 20, 1), 100);
    const offset = Math.max(options?.offset || 0, 0);

    const v = await getCacheNamespaceVersion('collections');
    const key = `cache:collections:getAllActive:v1:${v}:${limit}:${offset}`;
    return await getCachedJson(key, 60, async () => {
      const query = supabase
        .from('collections')
        .select(COLLECTION_SELECT_FIELDS)
        .eq('is_active', true)
        .is('deleted_at', null)
        .range(offset, offset + limit - 1);
      
      const { data, error } = await query;
      
      if (error) throw error;
      return (data || []) as Collection[];
    });
  }

  async getAll(options?: { limit?: number; offset?: number }): Promise<Collection[]> {
    const limit = Math.min(Math.max(options?.limit || 20, 1), 100);
    const offset = Math.max(options?.offset || 0, 0);

    const v = await getCacheNamespaceVersion('collections');
    const key = `cache:collections:getAll:v1:${v}:${limit}:${offset}`;
    return await getCachedJson(key, 60, async () => {
      const query = supabase
        .from('collections')
        .select(COLLECTION_SELECT_FIELDS)
        .is('deleted_at', null)
        .order('name')
        .range(offset, offset + limit - 1);
      
      const { data, error } = await query;
      
      if (error) throw error;
      return (data || []) as Collection[];
    });
  }

  async getById(id: string): Promise<Collection | null> {
    const v = await getCacheNamespaceVersion('collections');
    const key = `cache:collections:getById:v1:${v}:${id}`;
    return await getCachedJson(key, 300, async () => {
      const { data, error } = await supabase
        .from('collections')
        .select(COLLECTION_SELECT_FIELDS)
        .eq('id', id)
        .is('deleted_at', null)
        .single();
      
      if (error) throw error;
      return data as Collection | null;
    });
  }

  async getCollectionProducts(): Promise<Array<{ product_id: string; collection_id: string }>> {
    const v = await getCacheNamespaceVersion('collections');
    const key = `cache:collections:getCollectionProducts:v1:${v}`;
    return await getCachedJson(key, 120, async () => {
      const { data, error } = await supabase
        .from('collection_products')
        .select('product_id, collection_id');
      
      if (error) throw error;
      return (data || []) as Array<{ product_id: string; collection_id: string }>;
    });
  }

  async create(collection: Partial<Collection>): Promise<Collection> {
    // Strip out virtual/computed fields that don't exist in the database
    const { _associatedProductIds, ...collectionData } = collection as any;

    const { data, error } = await supabase
      .from('collections')
      .insert(collectionData)
      .select(COLLECTION_SELECT_FIELDS)
      .single();

    if (error) throw error;
    await bumpCacheNamespaceVersion('collections');
    return data as Collection;
  }

  async update(id: string, updates: Partial<Collection>): Promise<Collection> {
    // Strip out virtual/computed fields that don't exist in the database
    const { _associatedProductIds, ...updateData } = updates as any;

    const { data, error } = await supabase
      .from('collections')
      .update(updateData)
      .eq('id', id)
      .select(COLLECTION_SELECT_FIELDS)
      .single();

    if (error) throw error;
    await bumpCacheNamespaceVersion('collections');
    return data as Collection;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    await bumpCacheNamespaceVersion('collections');
  }
}
