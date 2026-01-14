import { test, expect, request } from '@playwright/test';
import fs from 'node:fs/promises';
import { runLoad, summarize, type PerfSample } from './perf-utils';

const apiBaseUrl = process.env.PERF_API_BASE_URL || 'http://localhost:3002';

const mode = process.env.PERF_MODE || 'quick';
const normalTotal = Number(process.env.PERF_NORMAL_TOTAL || (mode === 'full' ? 150 : 60));
const normalConcurrency = Number(process.env.PERF_NORMAL_CONCURRENCY || (mode === 'full' ? 15 : 10));
const peakTotal = Number(process.env.PERF_PEAK_TOTAL || normalTotal * 3);
const peakConcurrency = Number(process.env.PERF_PEAK_CONCURRENCY || normalConcurrency * 3);
const enduranceSeconds = Number(process.env.PERF_ENDURANCE_SECONDS || (mode === 'full' ? 60 : 30));

type EndpointCase = {
  name: string;
  method: 'GET' | 'POST';
  path: string;
  warmup: number;
  normal: { total: number; concurrency: number };
  peak3x: { total: number; concurrency: number };
  maxP95NormalMs: number;
  maxP95PeakMs: number;
  maxErrorRate: number;
};

const cases: EndpointCase[] = [
  {
    name: 'store_bootstrap',
    method: 'GET',
    path: '/api/store/bootstrap',
    warmup: 5,
    normal: { total: normalTotal, concurrency: normalConcurrency },
    peak3x: { total: peakTotal, concurrency: peakConcurrency },
    maxP95NormalMs: 250,
    maxP95PeakMs: 300,
    maxErrorRate: 0.01,
  },
  {
    name: 'products_list_active',
    method: 'GET',
    path: '/api/products',
    warmup: 5,
    normal: { total: normalTotal, concurrency: normalConcurrency },
    peak3x: { total: peakTotal, concurrency: peakConcurrency },
    maxP95NormalMs: 250,
    maxP95PeakMs: 300,
    maxErrorRate: 0.01,
  },
  {
    name: 'store_config',
    method: 'GET',
    path: '/api/store/config',
    warmup: 5,
    normal: { total: normalTotal, concurrency: normalConcurrency },
    peak3x: { total: peakTotal, concurrency: peakConcurrency },
    maxP95NormalMs: 200,
    maxP95PeakMs: 250,
    maxErrorRate: 0.01,
  },
  {
    name: 'collections_list',
    method: 'GET',
    path: '/api/collections',
    warmup: 5,
    normal: { total: normalTotal, concurrency: normalConcurrency },
    peak3x: { total: peakTotal, concurrency: peakConcurrency },
    maxP95NormalMs: 250,
    maxP95PeakMs: 300,
    maxErrorRate: 0.01,
  },
  {
    name: 'collections_relations',
    method: 'GET',
    path: '/api/collections/products/relations',
    warmup: 5,
    normal: { total: normalTotal, concurrency: normalConcurrency },
    peak3x: { total: peakTotal, concurrency: peakConcurrency },
    maxP95NormalMs: 250,
    maxP95PeakMs: 300,
    maxErrorRate: 0.01,
  },
  {
    name: 'coupons_list',
    method: 'GET',
    path: '/api/coupons',
    warmup: 5,
    normal: { total: normalTotal, concurrency: normalConcurrency },
    peak3x: { total: peakTotal, concurrency: peakConcurrency },
    maxP95NormalMs: 250,
    maxP95PeakMs: 300,
    maxErrorRate: 0.01,
  },
  {
    name: 'assets_list',
    method: 'GET',
    path: '/api/assets',
    warmup: 3,
    normal: { total: normalTotal, concurrency: normalConcurrency },
    peak3x: { total: peakTotal, concurrency: peakConcurrency },
    maxP95NormalMs: 250,
    maxP95PeakMs: 300,
    maxErrorRate: 0.01,
  },
  {
    name: 'store_size_guides',
    method: 'GET',
    path: '/api/store/size-guides',
    warmup: 3,
    normal: { total: normalTotal, concurrency: normalConcurrency },
    peak3x: { total: peakTotal, concurrency: peakConcurrency },
    maxP95NormalMs: 250,
    maxP95PeakMs: 300,
    maxErrorRate: 0.01,
  },
];

async function hit(ctx: any, c: EndpointCase): Promise<PerfSample> {
  const start = performance.now();
  try {
    const res = await ctx.fetch(c.path, { method: c.method });
    const ms = performance.now() - start;
    return { ok: res.ok(), status: res.status(), ms };
  } catch {
    const ms = performance.now() - start;
    return { ok: false, status: 0, ms };
  }
}

test.describe('Performance SLO (API)', () => {
  test('baseline + peak3x (p95 <250ms normal, SLO 300ms peak)', async ({}, testInfo) => {
    const ctx = await request.newContext({ baseURL: apiBaseUrl });
    const report: Record<string, any> = {
      generatedAt: new Date().toISOString(),
      apiBaseUrl,
      cases: {},
    };

    for (const c of cases) {
      for (let i = 0; i < c.warmup; i++) {
        await hit(ctx, c);
      }

      const normalSamples = await runLoad({
        totalRequests: c.normal.total,
        concurrency: c.normal.concurrency,
        fn: async () => hit(ctx, c),
      });
      const normal = summarize(normalSamples);

      const peakSamples = await runLoad({
        totalRequests: c.peak3x.total,
        concurrency: c.peak3x.concurrency,
        fn: async () => hit(ctx, c),
      });
      const peak3x = summarize(peakSamples);

      report.cases[c.name] = {
        path: c.path,
        method: c.method,
        normal,
        peak3x,
      };

      expect(normal.errorRate, `${c.name} normal errorRate`).toBeLessThanOrEqual(c.maxErrorRate);
      expect(peak3x.errorRate, `${c.name} peak3x errorRate`).toBeLessThanOrEqual(c.maxErrorRate);

      expect(normal.p95Ms, `${c.name} normal p95`).toBeLessThanOrEqual(c.maxP95NormalMs);
      expect(peak3x.p95Ms, `${c.name} peak3x p95`).toBeLessThanOrEqual(c.maxP95PeakMs);
    }

    const out = testInfo.outputPath('perf-endpoints-report.json');
    await fs.writeFile(out, JSON.stringify(report, null, 2), 'utf8');
    await testInfo.attach('perf-endpoints-report', {
      path: out,
      contentType: 'application/json',
    });

    await ctx.dispose();
  });

  test('endurance /store/bootstrap', async () => {
    const ctx = await request.newContext({ baseURL: apiBaseUrl });
    const endAt = Date.now() + enduranceSeconds * 1000;
    const samples: PerfSample[] = [];

    while (Date.now() < endAt) {
      const batch = await runLoad({
        totalRequests: 20,
        concurrency: 5,
        fn: async () => hit(ctx, cases[0]),
      });
      samples.push(...batch);
    }

    const s = summarize(samples);
    expect(s.errorRate).toBeLessThanOrEqual(0.01);
    expect(s.p95Ms).toBeLessThanOrEqual(300);
    await ctx.dispose();
  });
});
