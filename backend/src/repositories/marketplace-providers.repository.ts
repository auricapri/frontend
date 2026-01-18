import { supabase } from '../config/supabase.js';
import logger from '../config/logger.js';
import type { MarketplaceProvider } from '../services/marketplace/marketplace.types.js';

export class MarketplaceProvidersRepository {
  private readonly tableName = 'marketplace_providers';

  /**
   * Get all active marketplace providers.
   */
  async getAllActive(): Promise<MarketplaceProvider[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      logger.error('Failed to fetch active marketplace providers', { error });
      throw error;
    }

    return data || [];
  }

  /**
   * Get all marketplace providers (including inactive).
   */
  async getAll(): Promise<MarketplaceProvider[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .order('name');

    if (error) {
      logger.error('Failed to fetch all marketplace providers', { error });
      throw error;
    }

    return data || [];
  }

  /**
   * Get a provider by ID.
   */
  async getById(id: string): Promise<MarketplaceProvider | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      logger.error('Failed to fetch marketplace provider by id', { error, id });
      throw error;
    }

    return data;
  }

  /**
   * Get a provider by code.
   */
  async getByCode(code: string): Promise<MarketplaceProvider | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('code', code)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      logger.error('Failed to fetch marketplace provider by code', { error, code });
      throw error;
    }

    return data;
  }

  /**
   * Create a new provider (admin only - typically for custom integrations).
   */
  async create(provider: Partial<MarketplaceProvider>): Promise<MarketplaceProvider> {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert(provider)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create marketplace provider', { error, provider });
      throw error;
    }

    return data;
  }

  /**
   * Update a provider.
   */
  async update(id: string, updates: Partial<MarketplaceProvider>): Promise<MarketplaceProvider> {
    const { data, error } = await supabase
      .from(this.tableName)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update marketplace provider', { error, id, updates });
      throw error;
    }

    return data;
  }

  /**
   * Toggle provider active status.
   */
  async toggleActive(id: string, isActive: boolean): Promise<MarketplaceProvider> {
    return this.update(id, { is_active: isActive });
  }
}

export const marketplaceProvidersRepository = new MarketplaceProvidersRepository();
