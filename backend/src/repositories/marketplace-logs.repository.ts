import { supabase } from '../config/supabase.js';
import logger from '../config/logger.js';
import type {
  MarketplaceSyncLog,
  SyncLogInput,
  SyncLogQuery,
  SyncAction,
  SyncLogStatus,
} from '../services/marketplace/marketplace.types.js';

export class MarketplaceLogsRepository {
  private readonly tableName = 'marketplace_sync_logs';

  /**
   * Get logs with optional filters.
   */
  async findAll(query: SyncLogQuery = {}): Promise<MarketplaceSyncLog[]> {
    let queryBuilder = supabase
      .from(this.tableName)
      .select(`
        *,
        config:marketplace_configs(
          id,
          environment,
          status,
          provider:marketplace_providers(code, name)
        )
      `);

    if (query.config_id) {
      queryBuilder = queryBuilder.eq('config_id', query.config_id);
    }

    if (query.mapping_id) {
      queryBuilder = queryBuilder.eq('mapping_id', query.mapping_id);
    }

    if (query.action) {
      queryBuilder = queryBuilder.eq('action', query.action);
    }

    if (query.status) {
      queryBuilder = queryBuilder.eq('status', query.status);
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
      logger.error('Failed to fetch marketplace logs', { error, query });
      throw error;
    }

    return data || [];
  }

  /**
   * Get log by ID.
   */
  async getById(id: string): Promise<MarketplaceSyncLog | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        config:marketplace_configs(
          id,
          environment,
          status,
          provider:marketplace_providers(code, name)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      logger.error('Failed to fetch marketplace log by id', { error, id });
      throw error;
    }

    return data;
  }

  /**
   * Get recent logs for a config.
   */
  async getRecentByConfig(configId: string, limit: number = 50): Promise<MarketplaceSyncLog[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        config:marketplace_configs(
          id,
          environment,
          status,
          provider:marketplace_providers(code, name)
        )
      `)
      .eq('config_id', configId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Failed to fetch recent logs by config', { error, configId });
      throw error;
    }

    return data || [];
  }

  /**
   * Get error logs for a config.
   */
  async getErrorsByConfig(configId: string, limit: number = 50): Promise<MarketplaceSyncLog[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        config:marketplace_configs(
          id,
          environment,
          status,
          provider:marketplace_providers(code, name)
        )
      `)
      .eq('config_id', configId)
      .eq('status', 'error')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Failed to fetch error logs by config', { error, configId });
      throw error;
    }

    return data || [];
  }

  /**
   * Get logs for a mapping.
   */
  async getByMappingId(mappingId: string, limit: number = 20): Promise<MarketplaceSyncLog[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        config:marketplace_configs(
          id,
          environment,
          status,
          provider:marketplace_providers(code, name)
        )
      `)
      .eq('mapping_id', mappingId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Failed to fetch logs by mapping', { error, mappingId });
      throw error;
    }

    return data || [];
  }

  /**
   * Create a new log entry.
   */
  async create(input: SyncLogInput): Promise<MarketplaceSyncLog> {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert({
        config_id: input.config_id,
        mapping_id: input.mapping_id || null,
        action: input.action,
        status: input.status,
        request_payload: input.request_payload || null,
        response_payload: input.response_payload || null,
        error_message: input.error_message || null,
        duration_ms: input.duration_ms || null,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create marketplace log', { error, input });
      throw error;
    }

    return data;
  }

  /**
   * Log a successful operation.
   */
  async logSuccess(
    configId: string,
    action: SyncAction,
    durationMs?: number,
    mappingId?: string,
    requestPayload?: Record<string, unknown>,
    responsePayload?: Record<string, unknown>
  ): Promise<MarketplaceSyncLog> {
    return this.create({
      config_id: configId,
      mapping_id: mappingId,
      action,
      status: 'success',
      duration_ms: durationMs,
      request_payload: requestPayload,
      response_payload: responsePayload,
    });
  }

  /**
   * Log a failed operation.
   */
  async logError(
    configId: string,
    action: SyncAction,
    errorMessage: string,
    durationMs?: number,
    mappingId?: string,
    requestPayload?: Record<string, unknown>,
    responsePayload?: Record<string, unknown>
  ): Promise<MarketplaceSyncLog> {
    return this.create({
      config_id: configId,
      mapping_id: mappingId,
      action,
      status: 'error',
      error_message: errorMessage,
      duration_ms: durationMs,
      request_payload: requestPayload,
      response_payload: responsePayload,
    });
  }

  /**
   * Log a partial success operation.
   */
  async logPartial(
    configId: string,
    action: SyncAction,
    errorMessage: string,
    durationMs?: number,
    mappingId?: string,
    requestPayload?: Record<string, unknown>,
    responsePayload?: Record<string, unknown>
  ): Promise<MarketplaceSyncLog> {
    return this.create({
      config_id: configId,
      mapping_id: mappingId,
      action,
      status: 'partial',
      error_message: errorMessage,
      duration_ms: durationMs,
      request_payload: requestPayload,
      response_payload: responsePayload,
    });
  }

  /**
   * Get statistics for a config.
   */
  async getStatsByConfig(
    configId: string,
    since?: Date
  ): Promise<{
    total: number;
    success: number;
    error: number;
    partial: number;
    byAction: Record<SyncAction, { total: number; success: number; error: number }>;
  }> {
    let query = supabase
      .from(this.tableName)
      .select('action, status')
      .eq('config_id', configId);

    if (since) {
      query = query.gte('created_at', since.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to get log stats', { error, configId });
      throw error;
    }

    const stats = {
      total: 0,
      success: 0,
      error: 0,
      partial: 0,
      byAction: {} as Record<SyncAction, { total: number; success: number; error: number }>,
    };

    for (const row of data || []) {
      stats.total++;
      const status = row.status as SyncLogStatus;
      const action = row.action as SyncAction;

      if (status === 'success') stats.success++;
      else if (status === 'error') stats.error++;
      else if (status === 'partial') stats.partial++;

      if (!stats.byAction[action]) {
        stats.byAction[action] = { total: 0, success: 0, error: 0 };
      }
      stats.byAction[action].total++;
      if (status === 'success') stats.byAction[action].success++;
      else if (status === 'error') stats.byAction[action].error++;
    }

    return stats;
  }

  /**
   * Delete old logs (cleanup job).
   */
  async deleteOlderThan(days: number, configId?: string): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    let query = supabase
      .from(this.tableName)
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    if (configId) {
      query = query.eq('config_id', configId);
    }

    const { data, error } = await query.select('id');

    if (error) {
      logger.error('Failed to delete old logs', { error, days, configId });
      throw error;
    }

    return data?.length || 0;
  }
}

export const marketplaceLogsRepository = new MarketplaceLogsRepository();
