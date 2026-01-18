import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';
import logger from './logger.js';
import {
  supabaseEgressBudgetUsageRatio,
  supabaseInflightRequests,
  supabaseRequestDurationMs,
  supabaseRequestsTotal,
  supabaseResponseBytesTotal,
} from './metrics.js';

class Semaphore {
  private available: number;
  private waiters: Array<() => void> = [];

  constructor(permits: number) {
    this.available = Math.max(0, permits);
  }

  get queued(): number {
    return this.waiters.length;
  }

  async acquire(maxQueue: number): Promise<() => void> {
    if (this.available > 0) {
      this.available -= 1;
      return () => this.release();
    }
    if (this.waiters.length >= maxQueue) {
      throw new Error('Supabase request queue overflow');
    }
    await new Promise<void>((resolve) => {
      this.waiters.push(resolve);
    });
    this.available -= 1;
    return () => this.release();
  }

  private release() {
    this.available += 1;
    const next = this.waiters.shift();
    if (next) next();
  }
}

const semaphore = new Semaphore(env.supabaseMonitoring.maxConcurrentRequests);

type RollingBuckets = {
  bytesPerMinute: number[];
  lastMinute: number;
  lastWarnAtMs: number;
};

const rolling: RollingBuckets = {
  bytesPerMinute: Array.from({ length: 60 }, () => 0),
  lastMinute: Math.floor(Date.now() / 60000),
  lastWarnAtMs: 0,
};

function rotateBuckets(nowMinute: number) {
  const diff = Math.min(60, Math.max(0, nowMinute - rolling.lastMinute));
  if (diff === 0) return;
  for (let i = 1; i <= diff; i += 1) {
    const idx = (rolling.lastMinute + i) % 60;
    rolling.bytesPerMinute[idx] = 0;
  }
  rolling.lastMinute = nowMinute;
}

function sumRollingHour(): number {
  return rolling.bytesPerMinute.reduce((acc, n) => acc + n, 0);
}

function parseSupabaseTable(url: URL): string {
  if (!url.pathname.includes('/rest/v1/')) return 'unknown';
  const parts = url.pathname.split('/rest/v1/');
  const after = parts[1] || '';
  const table = after.split('/')[0] || 'unknown';
  return table || 'unknown';
}

const baseFetch = globalThis.fetch.bind(globalThis);

async function instrumentedFetch(input: any, init?: any): Promise<Response> {
  const urlStr =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : (input && typeof input.url === 'string')
          ? input.url
          : String(input);
  const url = new URL(urlStr);
  const isSupabase = url.origin === new URL(env.supabase.url).origin;

  if (!isSupabase) {
    return baseFetch(input as any, init);
  }

  const method = String(init?.method || (input && input.method) || 'GET').toUpperCase();
  const table = parseSupabaseTable(url);

  const release = await semaphore.acquire(env.supabaseMonitoring.maxQueuedRequests);
  supabaseInflightRequests.inc();
  const start = Date.now();

  try {
    const res = await baseFetch(input as any, init);
    const durationMs = Date.now() - start;

    const status = String(res.status);
    supabaseRequestsTotal.inc({ method, table, status_code: status }, 1);
    supabaseRequestDurationMs.observe({ method, table, status_code: status }, durationMs);

    const contentLength = res.headers.get('content-length');
    const bytes = contentLength ? Number(contentLength) : 0;
    if (Number.isFinite(bytes) && bytes > 0) {
      supabaseResponseBytesTotal.inc({ table }, bytes);

      const nowMinute = Math.floor(Date.now() / 60000);
      rotateBuckets(nowMinute);
      rolling.bytesPerMinute[nowMinute % 60] += bytes;

      const budget = env.supabaseMonitoring.egressBudgetBytesPerHour;
      if (budget > 0) {
        const used = sumRollingHour();
        const ratio = used / budget;
        supabaseEgressBudgetUsageRatio.set(ratio);

        const threshold = Math.min(100, Math.max(1, env.supabaseMonitoring.alertThresholdPercent)) / 100;
        const nowMs = Date.now();
        if (ratio >= threshold && nowMs - rolling.lastWarnAtMs > 60_000) {
          rolling.lastWarnAtMs = nowMs;
          logger.warn('Supabase egress approaching budget threshold', {
            usedBytesRollingHour: used,
            budgetBytesPerHour: budget,
            ratio,
            threshold,
          });
        }
      }
    }

    return res;
  } catch (error: unknown) {
    const durationMs = Date.now() - start;
    supabaseRequestsTotal.inc({ method, table, status_code: 'ERR' }, 1);
    supabaseRequestDurationMs.observe({ method, table, status_code: 'ERR' }, durationMs);
    throw error;
  } finally {
    supabaseInflightRequests.dec();
    release();
  }
}

/**
 * Supabase client for server-side operations.
 * Uses service role key for full database access.
 * NEVER expose this key to the frontend.
 */
export const supabase = createClient(
  env.supabase.url,
  env.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      fetch: instrumentedFetch,
    },
  }
);
