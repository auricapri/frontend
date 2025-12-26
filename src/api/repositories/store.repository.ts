import { supabase } from '../../utils/supabase';
import { Category, Banner, StoreConfig, SizeGuide } from '../../types';

export class StoreRepository {
  async getAllCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true);
    
    if (error) throw error;
    return (data || []) as Category[];
  }

  async getAllBanners(): Promise<Banner[]> {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    
    if (error) throw error;
    return (data || []) as Banner[];
  }

  async getConfig(): Promise<StoreConfig | null> {
    const { data, error } = await supabase
      .from('store_config')
      .select('*')
      .limit(1)
      .maybeSingle();
    
    if (error) throw error;
    return data as StoreConfig | null;
  }

  async getAllSizeGuides(): Promise<SizeGuide[]> {
    const { data, error } = await supabase
      .from('size_guides')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return (data || []) as SizeGuide[];
  }

  async updateConfig(config: Partial<StoreConfig>): Promise<StoreConfig> {
    const { data, error } = await supabase
      .from('store_config')
      .update(config)
      .eq('id', config.id || 'main')
      .select()
      .single();
    
    if (error) throw error;
    return data as StoreConfig;
  }
}

