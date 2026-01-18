import { supabase } from '../config/supabase.js';

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string | null;
  record_id: string | null;
  metadata: any;
  ip_address: string | null;
  created_at: string;
}

export class AuditLogsRepository {
  async create(data: {
    user_id?: string | null;
    action: string;
    table_name?: string | null;
    record_id?: string | null;
    metadata?: any;
    ip_address?: string | null;
  }): Promise<AuditLog> {
    const { data: row, error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: data.user_id ?? null,
        action: data.action,
        table_name: data.table_name ?? null,
        record_id: data.record_id ?? null,
        metadata: data.metadata ?? null,
        ip_address: data.ip_address ?? null,
      })
      .select('*')
      .single();

    if (error) throw error;
    return row as AuditLog;
  }

  async getVariantPriceHistory(params: {
    variantId: string;
    limit?: number;
    offset?: number;
  }): Promise<AuditLog[]> {
    const limit = params.limit && params.limit > 0 && params.limit <= 100 ? params.limit : 50;
    const offset = params.offset && params.offset >= 0 ? params.offset : 0;

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('table_name', 'product_variants')
      .eq('record_id', params.variantId)
      .in('action', ['create_variant_price', 'update_variant_price'])
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return (data || []) as AuditLog[];
  }
}
