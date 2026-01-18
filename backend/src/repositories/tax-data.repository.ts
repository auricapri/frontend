import { supabase } from '../config/supabase.js';
import logger from '../config/logger.js';

type QueueStatus = 'pending' | 'processing' | 'done' | 'failed';

export interface TaxCacheEntry<T> {
  key: string;
  payload: T;
  sourceVersion: string | null;
  expiresAt: Date;
}

export interface TaxQueueJob {
  id: string;
  job_type: string;
  payload: unknown;
  status: QueueStatus;
  attempts: number;
  max_attempts: number;
  run_after: string;
  last_error: string | null;
}

export class TaxDataRepository {
  async getCache<T>(key: string, now: Date = new Date()): Promise<TaxCacheEntry<T> | null> {
    const { data, error } = await supabase
      .from('tax_data_cache')
      .select('key, payload, source_version, expires_at')
      .eq('key', key)
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.warn('Failed to read tax cache', { key, error });
      return null;
    }
    if (!data) return null;

    const expiresAt = new Date(data.expires_at);
    if (expiresAt.getTime() <= now.getTime()) {
      return null;
    }

    return {
      key: data.key,
      payload: data.payload as T,
      sourceVersion: (data.source_version ?? null) as string | null,
      expiresAt,
    };
  }

  async setCache<T>(input: {
    key: string;
    payload: T;
    ttlMs: number;
    sourceVersion?: string | null;
    now?: Date;
  }): Promise<void> {
    const now = input.now ?? new Date();
    const expiresAt = new Date(now.getTime() + input.ttlMs);

    const { error } = await supabase
      .from('tax_data_cache')
      .upsert(
        {
          key: input.key,
          payload: input.payload as unknown,
          source_version: input.sourceVersion ?? null,
          expires_at: expiresAt.toISOString(),
          updated_at: now.toISOString(),
        },
        { onConflict: 'key' }
      );

    if (error) {
      logger.warn('Failed to write tax cache', { key: input.key, error });
    }
  }

  async upsertVersion(name: string, version: string): Promise<void> {
    const { error } = await supabase
      .from('tax_data_versions')
      .upsert({ name, version, updated_at: new Date().toISOString() }, { onConflict: 'name' });

    if (error) {
      logger.warn('Failed to upsert tax data version', { name, error });
    }
  }

  async getVersion(name: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('tax_data_versions')
      .select('version')
      .eq('name', name)
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.warn('Failed to read tax data version', { name, error });
      return null;
    }
    return data?.version ?? null;
  }

  async enqueueJob(jobType: string, payload: unknown, runAfter: Date = new Date(), maxAttempts = 5): Promise<void> {
    const { error } = await supabase.from('tax_sync_queue').insert({
      job_type: jobType,
      payload: payload as unknown,
      status: 'pending',
      attempts: 0,
      max_attempts: maxAttempts,
      run_after: runAfter.toISOString(),
      last_error: null,
    });

    if (error) {
      logger.warn('Failed to enqueue tax sync job', { jobType, error });
    }
  }

  async listDueJobs(limit = 20): Promise<TaxQueueJob[]> {
    const { data, error } = await supabase
      .from('tax_sync_queue')
      .select('id, job_type, payload, status, attempts, max_attempts, run_after, last_error')
      .eq('status', 'pending')
      .lte('run_after', new Date().toISOString())
      .order('run_after', { ascending: true })
      .limit(limit);

    if (error) {
      logger.warn('Failed to list due tax jobs', { error });
      return [];
    }
    return (data ?? []) as TaxQueueJob[];
  }

  async markJobProcessing(id: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('tax_sync_queue')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();

    if (error) {
      logger.warn('Failed to mark tax job processing', { id, error });
      return false;
    }
    return !!data;
  }

  async markJobDone(id: string): Promise<void> {
    const { error } = await supabase
      .from('tax_sync_queue')
      .update({ status: 'done', updated_at: new Date().toISOString(), last_error: null })
      .eq('id', id);

    if (error) {
      logger.warn('Failed to mark tax job done', { id, error });
    }
  }

  async markJobFailed(id: string, errorMessage: string, nextRunAfter: Date | null): Promise<void> {
    const now = new Date();
    const { data, error } = await supabase
      .from('tax_sync_queue')
      .select('attempts, max_attempts')
      .eq('id', id)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      logger.warn('Failed to load tax job attempts', { id, error });
      return;
    }

    const attempts = Number(data.attempts ?? 0) + 1;
    const maxAttempts = Number(data.max_attempts ?? 5);
    const status: QueueStatus = attempts >= maxAttempts ? 'failed' : 'pending';

    const { error: updateError } = await supabase
      .from('tax_sync_queue')
      .update({
        status,
        attempts,
        last_error: errorMessage,
        run_after: (nextRunAfter ?? now).toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      logger.warn('Failed to mark tax job failed', { id, updateError });
    }
  }
}

