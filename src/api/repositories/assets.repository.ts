import { supabase } from '../../utils/supabase';
import { Asset } from '../../types';

export class AssetsRepository {
  async getAll(): Promise<Asset[]> {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return (data || []) as Asset[];
  }

  async getById(id: string): Promise<Asset | null> {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Asset | null;
  }

  async updateStock(assetId: string, quantity: number): Promise<void> {
    const { error } = await supabase
      .from('assets')
      .update({ stock_quantity: Math.max(0, quantity) })
      .eq('id', assetId);
    
    if (error) throw error;
  }

  async create(asset: Partial<Asset>): Promise<Asset> {
    const { data, error } = await supabase
      .from('assets')
      .insert(asset)
      .select()
      .single();
    
    if (error) throw error;
    return data as Asset;
  }

  async update(id: string, updates: Partial<Asset>): Promise<Asset> {
    const { data, error } = await supabase
      .from('assets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Asset;
  }
}

