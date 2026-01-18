import { supabase } from '../config/supabase.js';
import logger from '../config/logger.js';
import { getMarketplaceCrypto } from '../services/marketplace/marketplace.crypto.js';
import type {
  MarketplaceConfig,
  MarketplaceConfigInput,
  MarketplaceConfigUpdate,
  MarketplaceStatus,
} from '../services/marketplace/marketplace.types.js';

export class MarketplaceConfigsRepository {
  private readonly tableName = 'marketplace_configs';

  /**
   * Get all configs with provider data.
   */
  async getAll(): Promise<MarketplaceConfig[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        provider:marketplace_providers(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch marketplace configs', { error });
      throw error;
    }

    return data || [];
  }

  /**
   * Get all active configs.
   */
  async getAllActive(): Promise<MarketplaceConfig[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        provider:marketplace_providers(*)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch active marketplace configs', { error });
      throw error;
    }

    return data || [];
  }

  /**
   * Get all connected configs (for sync operations).
   */
  async getAllConnected(): Promise<MarketplaceConfig[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        provider:marketplace_providers(*)
      `)
      .eq('is_active', true)
      .eq('status', 'connected')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch connected marketplace configs', { error });
      throw error;
    }

    return data || [];
  }

  /**
   * Get config by ID with provider data.
   */
  async getById(id: string): Promise<MarketplaceConfig | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        provider:marketplace_providers(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      logger.error('Failed to fetch marketplace config by id', { error, id });
      throw error;
    }

    return data;
  }

  /**
   * Get config by provider ID.
   */
  async getByProviderId(providerId: string): Promise<MarketplaceConfig | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        provider:marketplace_providers(*)
      `)
      .eq('provider_id', providerId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      logger.error('Failed to fetch marketplace config by provider id', { error, providerId });
      throw error;
    }

    return data;
  }

  /**
   * Get config by provider code.
   */
  async getByProviderCode(code: string): Promise<MarketplaceConfig | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        provider:marketplace_providers!inner(*)
      `)
      .eq('provider.code', code)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      logger.error('Failed to fetch marketplace config by provider code', { error, code });
      throw error;
    }

    return data;
  }

  /**
   * Create a new config with encrypted credentials.
   */
  async create(input: MarketplaceConfigInput): Promise<MarketplaceConfig> {
    const crypto = getMarketplaceCrypto();
    const encryptedCredentials = crypto.encryptCredentials(input.credentials);

    const { data, error } = await supabase
      .from(this.tableName)
      .insert({
        provider_id: input.provider_id,
        environment: input.environment || 'sandbox',
        credentials_encrypted: encryptedCredentials,
        commission_override: input.commission_override,
        price_markup_percent: input.price_markup_percent ?? 0,
        auto_sync_stock: input.auto_sync_stock ?? true,
        auto_sync_price: input.auto_sync_price ?? true,
        sync_interval_minutes: input.sync_interval_minutes ?? 30,
        status: 'disconnected',
      })
      .select(`
        *,
        provider:marketplace_providers(*)
      `)
      .single();

    if (error) {
      logger.error('Failed to create marketplace config', { error, providerId: input.provider_id });
      throw error;
    }

    return data;
  }

  /**
   * Update config (with optional credential re-encryption).
   */
  async update(id: string, input: MarketplaceConfigUpdate): Promise<MarketplaceConfig> {
    const updates: Record<string, unknown> = {};

    // Only encrypt credentials if they're being updated
    if (input.credentials) {
      const crypto = getMarketplaceCrypto();
      updates.credentials_encrypted = crypto.encryptCredentials(input.credentials);
    }

    // Copy other fields
    if (input.environment !== undefined) updates.environment = input.environment;
    if (input.commission_override !== undefined) updates.commission_override = input.commission_override;
    if (input.price_markup_percent !== undefined) updates.price_markup_percent = input.price_markup_percent;
    if (input.auto_sync_stock !== undefined) updates.auto_sync_stock = input.auto_sync_stock;
    if (input.auto_sync_price !== undefined) updates.auto_sync_price = input.auto_sync_price;
    if (input.sync_interval_minutes !== undefined) updates.sync_interval_minutes = input.sync_interval_minutes;
    if (input.is_active !== undefined) updates.is_active = input.is_active;

    const { data, error } = await supabase
      .from(this.tableName)
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        provider:marketplace_providers(*)
      `)
      .single();

    if (error) {
      logger.error('Failed to update marketplace config', { error, id });
      throw error;
    }

    return data;
  }

  /**
   * Update tokens after OAuth flow or token refresh.
   */
  async updateTokens(
    id: string,
    accessToken: string,
    refreshToken?: string,
    expiresAt?: Date
  ): Promise<MarketplaceConfig> {
    const crypto = getMarketplaceCrypto();

    const updates: Record<string, unknown> = {
      access_token_encrypted: crypto.encryptToken(accessToken),
      status: 'connected',
      status_message: null,
    };

    if (refreshToken) {
      updates.refresh_token_encrypted = crypto.encryptToken(refreshToken);
    }

    if (expiresAt) {
      updates.token_expires_at = expiresAt.toISOString();
    }

    const { data, error } = await supabase
      .from(this.tableName)
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        provider:marketplace_providers(*)
      `)
      .single();

    if (error) {
      logger.error('Failed to update marketplace tokens', { error, id });
      throw error;
    }

    return data;
  }

  /**
   * Update status and message.
   */
  async updateStatus(
    id: string,
    status: MarketplaceStatus,
    message?: string | null
  ): Promise<MarketplaceConfig> {
    const { data, error } = await supabase
      .from(this.tableName)
      .update({
        status,
        status_message: message ?? null,
      })
      .eq('id', id)
      .select(`
        *,
        provider:marketplace_providers(*)
      `)
      .single();

    if (error) {
      logger.error('Failed to update marketplace config status', { error, id, status });
      throw error;
    }

    return data;
  }

  /**
   * Update last sync timestamp.
   */
  async updateLastSync(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      logger.error('Failed to update last sync timestamp', { error, id });
      throw error;
    }
  }

  /**
   * Delete config and all related data (cascades to mappings and logs).
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Failed to delete marketplace config', { error, id });
      throw error;
    }
  }

  /**
   * Get decrypted credentials for a config.
   * WARNING: Only use when actually needed for API calls.
   */
  async getDecryptedCredentials(id: string): Promise<Record<string, string> | null> {
    const config = await this.getById(id);
    if (!config) return null;

    const crypto = getMarketplaceCrypto();
    return crypto.decryptCredentials(config.credentials_encrypted);
  }

  /**
   * Get decrypted access token for a config.
   */
  async getDecryptedAccessToken(id: string): Promise<string | null> {
    const config = await this.getById(id);
    if (!config || !config.access_token_encrypted) return null;

    const crypto = getMarketplaceCrypto();
    return crypto.decryptToken(config.access_token_encrypted);
  }

  /**
   * Get decrypted refresh token for a config.
   */
  async getDecryptedRefreshToken(id: string): Promise<string | null> {
    const config = await this.getById(id);
    if (!config || !config.refresh_token_encrypted) return null;

    const crypto = getMarketplaceCrypto();
    return crypto.decryptToken(config.refresh_token_encrypted);
  }

  /**
   * Check if token needs refresh.
   */
  async needsTokenRefresh(id: string, bufferMinutes: number = 5): Promise<boolean> {
    const config = await this.getById(id);
    if (!config || !config.token_expires_at) return false;

    const expiresAt = new Date(config.token_expires_at);
    const bufferMs = bufferMinutes * 60 * 1000;
    return Date.now() > expiresAt.getTime() - bufferMs;
  }
}

export const marketplaceConfigsRepository = new MarketplaceConfigsRepository();
