export type PerfSample = {
  ok: boolean;
  status: number;
  ms: number;
};

export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

export function summarize(samples: PerfSample[]) {
  const latencies = samples.map(s => s.ms);
  const okCount = samples.filter(s => s.ok).length;
  const errCount = samples.length - okCount;
  return {
    count: samples.length,
    ok: okCount,
    errors: errCount,
    errorRate: samples.length > 0 ? errCount / samples.length : 0,
    avgMs: samples.length > 0 ? latencies.reduce((a, b) => a + b, 0) / samples.length : 0,
    p50Ms: percentile(latencies, 50),
    p95Ms: percentile(latencies, 95),
    p99Ms: percentile(latencies, 99),
    minMs: latencies.length > 0 ? Math.min(...latencies) : 0,
    maxMs: latencies.length > 0 ? Math.max(...latencies) : 0,
  };
}

export async function runLoad(options: {
  totalRequests: number;
  concurrency: number;
  fn: (i: number) => Promise<PerfSample>;
}): Promise<PerfSample[]> {
  const { totalRequests, concurrency, fn } = options;
  const results: PerfSample[] = [];
  let next = 0;

  const workers = new Array(Math.max(1, concurrency)).fill(0).map(async () => {
    while (true) {
      const i = next;
      next += 1;
      if (i >= totalRequests) break;
      results.push(await fn(i));
    }
  });

  await Promise.all(workers);
  return results;
}

