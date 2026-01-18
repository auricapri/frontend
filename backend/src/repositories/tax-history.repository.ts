import { supabase } from '../config/supabase.js';
import logger from '../config/logger.js';

export class TaxHistoryRepository {
  async insert(entry: {
    requestHash: string;
    input: unknown;
    result: unknown;
    dataVersions?: Record<string, string | null> | null;
  }): Promise<void> {
    const { error } = await supabase.from('tax_calculation_history').insert({
      request_hash: entry.requestHash,
      input: entry.input as unknown,
      result: entry.result as unknown,
      data_versions: entry.dataVersions ?? null,
    });

    if (error) {
      logger.warn('Failed to insert tax history', { error });
    }
  }

  async deleteOlderThan(cutoff: Date): Promise<number> {
    const { data, error } = await supabase
      .from('tax_calculation_history')
      .delete()
      .lt('created_at', cutoff.toISOString())
      .select('id');

    if (error) {
      logger.warn('Failed to delete old tax history', { cutoff: cutoff.toISOString(), error });
      return 0;
    }

    return data?.length ?? 0;
  }
}

