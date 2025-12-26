import { supabase } from '../../utils/supabase';
import { Product } from '../../types';

export class ProductsRepository {
  async getAllActive(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*, variants:product_variants(*)')
      .eq('is_active', true);
    
    if (error) throw error;
    return (data || []) as Product[];
  }

  async getAll(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*, variants:product_variants(*)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as Product[];
  }

  async getById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*, variants:product_variants(*)')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Product | null;
  }

  async updateStock(variantId: string, quantity: number): Promise<void> {
    const { error } = await supabase
      .from('product_variants')
      .update({ stock_quantity: Math.max(0, quantity) })
      .eq('id', variantId);
    
    if (error) throw error;
  }

  async create(product: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();
    
    if (error) throw error;
    return data as Product;
  }

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Product;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}

