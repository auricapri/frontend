import { supabase } from '../../utils/supabase';
import { Collection } from '../../types';

export class CollectionsRepository {
  async getAllActive(): Promise<Collection[]> {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('is_active', true);
    
    if (error) throw error;
    return (data || []) as Collection[];
  }

  async getAll(): Promise<Collection[]> {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return (data || []) as Collection[];
  }

  async getById(id: string): Promise<Collection | null> {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Collection | null;
  }

  async getCollectionProducts(): Promise<Array<{ product_id: string; collection_id: string }>> {
    const { data, error } = await supabase
      .from('collection_products')
      .select('*');
    
    if (error) throw error;
    return (data || []) as Array<{ product_id: string; collection_id: string }>;
  }

  async create(collection: Partial<Collection>): Promise<Collection> {
    const { data, error } = await supabase
      .from('collections')
      .insert(collection)
      .select()
      .single();
    
    if (error) throw error;
    return data as Collection;
  }

  async update(id: string, updates: Partial<Collection>): Promise<Collection> {
    const { data, error } = await supabase
      .from('collections')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Collection;
  }
}

