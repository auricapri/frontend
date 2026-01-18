import { supabase } from '../config/supabase.js';
import logger from '../config/logger.js';
import type {
  MarketplaceProductMapping,
  MappingInput,
  MappingUpdate,
  MappingQuery,
  SyncStatus,
} from '../services/marketplace/marketplace.types.js';

export class MarketplaceMappingsRepository {
  private readonly tableName = 'marketplace_product_mappings';

  /**
   * Get all mappings with optional filters.
   */
  async findAll(query: MappingQuery = {}): Promise<MarketplaceProductMapping[]> {
    let queryBuilder = supabase
      .from(this.tableName)
      .select(`
        *,
        config:marketplace_configs(
          *,
          provider:marketplace_providers(*)
        )
      `);

    if (query.config_id) {
      queryBuilder = queryBuilder.eq('config_id', query.config_id);
    }

    if (query.product_id) {
      queryBuilder = queryBuilder.eq('product_id', query.product_id);
    }

    if (query.variant_id) {
      queryBuilder = queryBuilder.eq('variant_id', query.variant_id);
    }

    if (query.sync_status) {
      queryBuilder = queryBuilder.eq('sync_status', query.sync_status);
    }

    queryBuilder = queryBuilder.order('created_at', { ascending: false });

    if (query.limit) {
      queryBuilder = queryBuilder.limit(query.limit);
    }

    if (query.offset) {
      queryBuilder = queryBuilder.range(query.offset, query.offset + (query.limit || 50) - 1);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      logger.error('Failed to fetch marketplace mappings', { error, query });
      throw error;
    }

    return data || [];
  }

  /**
   * Get mapping by ID.
   */
  async getById(id: string): Promise<MarketplaceProductMapping | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        config:marketplace_configs(
          *,
          provider:marketplace_providers(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      logger.error('Failed to fetch marketplace mapping by id', { error, id });
      throw error;
    }

    return data;
  }

  /**
   * Get mapping by config, product, and optional variant.
   */
  async getByProductAndConfig(
    configId: string,
    productId: string,
    variantId?: string | null
  ): Promise<MarketplaceProductMapping | null> {
    let query = supabase
      .from(this.tableName)
      .select(`
        *,
        config:marketplace_configs(
          *,
          provider:marketplace_providers(*)
        )
      `)
      .eq('config_id', configId)
      .eq('product_id', productId);

    if (variantId) {
      query = query.eq('variant_id', variantId);
    } else {
      query = query.is('variant_id', null);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      logger.error('Failed to fetch marketplace mapping', { error, configId, productId, variantId });
      throw error;
    }

    return data;
  }

  /**
   * Get all mappings for a product (across all marketplaces).
   */
  async getByProductId(productId: string): Promise<MarketplaceProductMapping[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        config:marketplace_configs(
          *,
          provider:marketplace_providers(*)
        )
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch mappings by product id', { error, productId });
      throw error;
    }

    return data || [];
  }

  /**
   * Get all mappings for a config (marketplace).
   */
  async getByConfigId(configId: string): Promise<MarketplaceProductMapping[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        config:marketplace_configs(
          *,
          provider:marketplace_providers(*)
        )
      `)
      .eq('config_id', configId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch mappings by config id', { error, configId });
      throw error;
    }

    return data || [];
  }

  /**
   * Get mappings pending sync.
   */
  async getPendingSync(configId?: string): Promise<MarketplaceProductMapping[]> {
    let query = supabase
      .from(this.tableName)
      .select(`
        *,
        config:marketplace_configs(
          *,
          provider:marketplace_providers(*)
        )
      `)
      .eq('sync_status', 'pending');

    if (configId) {
      query = query.eq('config_id', configId);
    }

    const { data, error } = await query.order('created_at');

    if (error) {
      logger.error('Failed to fetch pending sync mappings', { error, configId });
      throw error;
    }

    return data || [];
  }

  /**
   * Get mappings with errors.
   */
  async getWithErrors(configId?: string): Promise<MarketplaceProductMapping[]> {
    let query = supabase
      .from(this.tableName)
      .select(`
        *,
        config:marketplace_configs(
          *,
          provider:marketplace_providers(*)
        )
      `)
      .eq('sync_status', 'error');

    if (configId) {
      query = query.eq('config_id', configId);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch error mappings', { error, configId });
      throw error;
    }

    return data || [];
  }

  /**
   * Create a new mapping.
   */
  async create(input: MappingInput): Promise<MarketplaceProductMapping> {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert({
        config_id: input.config_id,
        product_id: input.product_id,
        variant_id: input.variant_id || null,
        external_product_id: input.external_product_id || null,
        external_sku: input.external_sku || null,
        external_url: input.external_url || null,
        marketplace_price: input.marketplace_price || null,
        marketplace_stock: input.marketplace_stock || null,
        sync_status: 'pending',
        metadata: input.metadata || null,
      })
      .select(`
        *,
        config:marketplace_configs(
          *,
          provider:marketplace_providers(*)
        )
      `)
      .single();

    if (error) {
      logger.error('Failed to create marketplace mapping', { error, input });
      throw error;
    }

    return data;
  }

  /**
   * Update a mapping.
   */
  async update(id: string, input: MappingUpdate): Promise<MarketplaceProductMapping> {
    const updates: Record<string, unknown> = {};

    if (input.external_product_id !== undefined) updates.external_product_id = input.external_product_id;
    if (input.external_sku !== undefined) updates.external_sku = input.external_sku;
    if (input.external_url !== undefined) updates.external_url = input.external_url;
    if (input.marketplace_price !== undefined) updates.marketplace_price = input.marketplace_price;
    if (input.marketplace_stock !== undefined) updates.marketplace_stock = input.marketplace_stock;
    if (input.sync_status !== undefined) updates.sync_status = input.sync_status;
    if (input.sync_error !== undefined) updates.sync_error = input.sync_error;
    if (input.metadata !== undefined) updates.metadata = input.metadata;

    const { data, error } = await supabase
      .from(this.tableName)
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        config:marketplace_configs(
          *,
          provider:marketplace_providers(*)
        )
      `)
      .single();

    if (error) {
      logger.error('Failed to update marketplace mapping', { error, id, input });
      throw error;
    }

    return data;
  }

  /**
   * Update sync status and optionally error message.
   */
  async updateSyncStatus(
    id: string,
    status: SyncStatus,
    error?: string | null
  ): Promise<MarketplaceProductMapping> {
    const updates: Record<string, unknown> = {
      sync_status: status,
      sync_error: error ?? null,
    };

    if (status === 'synced') {
      updates.last_sync_at = new Date().toISOString();
    }

    const { data, error: dbError } = await supabase
      .from(this.tableName)
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        config:marketplace_configs(
          *,
          provider:marketplace_providers(*)
        )
      `)
      .single();

    if (dbError) {
      logger.error('Failed to update mapping sync status', { error: dbError, id, status });
      throw dbError;
    }

    return data;
  }

  /**
   * Mark mapping as synced with external data.
   */
  async markSynced(
    id: string,
    externalProductId: string,
    externalUrl?: string,
    price?: number,
    stock?: number
  ): Promise<MarketplaceProductMapping> {
    const updates: Record<string, unknown> = {
      external_product_id: externalProductId,
      sync_status: 'synced',
      sync_error: null,
      last_sync_at: new Date().toISOString(),
    };

    if (externalUrl) updates.external_url = externalUrl;
    if (price !== undefined) updates.marketplace_price = price;
    if (stock !== undefined) updates.marketplace_stock = stock;

    const { data, error } = await supabase
      .from(this.tableName)
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        config:marketplace_configs(
          *,
          provider:marketplace_providers(*)
        )
      `)
      .single();

    if (error) {
      logger.error('Failed to mark mapping as synced', { error, id });
      throw error;
    }

    return data;
  }

  /**
   * Upsert mapping (create if not exists, update if exists).
   */
  async upsert(input: MappingInput): Promise<MarketplaceProductMapping> {
    const { data, error } = await supabase
      .from(this.tableName)
      .upsert(
        {
          config_id: input.config_id,
          product_id: input.product_id,
          variant_id: input.variant_id || null,
          external_product_id: input.external_product_id || null,
          external_sku: input.external_sku || null,
          external_url: input.external_url || null,
          marketplace_price: input.marketplace_price || null,
          marketplace_stock: input.marketplace_stock || null,
          metadata: input.metadata || null,
        },
        {
          onConflict: 'config_id,product_id,variant_id',
        }
      )
      .select(`
        *,
        config:marketplace_configs(
          *,
          provider:marketplace_providers(*)
        )
      `)
      .single();

    if (error) {
      logger.error('Failed to upsert marketplace mapping', { error, input });
      throw error;
    }

    return data;
  }

  /**
   * Delete a mapping.
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Failed to delete marketplace mapping', { error, id });
      throw error;
    }
  }

  /**
   * Delete all mappings for a product.
   */
  async deleteByProductId(productId: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('product_id', productId);

    if (error) {
      logger.error('Failed to delete mappings by product id', { error, productId });
      throw error;
    }
  }

  /**
   * Count mappings by status for a config.
   */
  async countByStatus(configId: string): Promise<Record<SyncStatus, number>> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('sync_status')
      .eq('config_id', configId);

    if (error) {
      logger.error('Failed to count mappings by status', { error, configId });
      throw error;
    }

    const counts: Record<SyncStatus, number> = {
      pending: 0,
      synced: 0,
      error: 0,
      paused: 0,
    };

    for (const row of data || []) {
      const status = row.sync_status as SyncStatus;
      counts[status] = (counts[status] || 0) + 1;
    }

    return counts;
  }
}

export const marketplaceMappingsRepository = new MarketplaceMappingsRepository();
