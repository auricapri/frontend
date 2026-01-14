import { Page, TestInfo, expect } from '@playwright/test';

export type FlowStepMetric = {
  name: string;
  ms: number;
  ok: boolean;
  meta?: Record<string, any>;
};

export type ApiRequestMetric = {
  url: string;
  method: string;
  status?: number;
  ok: boolean;
  ms: number;
};

export function createFlowRecorder(testInfo: TestInfo) {
  const steps: FlowStepMetric[] = [];

  async function step<T>(name: string, fn: () => Promise<T>, meta?: Record<string, any>) {
    const start = performance.now();
    try {
      const result = await fn();
      steps.push({ name, ms: performance.now() - start, ok: true, meta });
      return result;
    } catch (err) {
      steps.push({ name, ms: performance.now() - start, ok: false, meta: { ...(meta || {}), error: String(err) } });
      throw err;
    }
  }

  async function screenshot(page: Page, name: string) {
    const path = testInfo.outputPath(`${name}.png`);
    await page.screenshot({ path, fullPage: true });
    await testInfo.attach(name, { path, contentType: 'image/png' });
  }

  async function flush(name = 'flow-metrics') {
    const outPath = testInfo.outputPath(`${name}.json`);
    await testInfo.attach(name, {
      body: Buffer.from(JSON.stringify({ steps }, null, 2), 'utf8'),
      contentType: 'application/json',
    });
    return outPath;
  }

  return { steps, step, screenshot, flush };
}

export function trackApiRequests(page: Page, options?: { onlyApi?: boolean }) {
  const startedAt = new WeakMap<any, number>();
  const requests: ApiRequestMetric[] = [];

  const shouldTrack = (url: string) => {
    if (options?.onlyApi === false) return true;
    return url.includes('/api/') || url.endsWith('/health') || url.includes('/metrics');
  };

  page.on('request', req => {
    if (!shouldTrack(req.url())) return;
    startedAt.set(req, performance.now());
  });

  page.on('requestfinished', async req => {
    if (!shouldTrack(req.url())) return;
    const start = startedAt.get(req) ?? performance.now();
    const ms = performance.now() - start;
    try {
      const res = await req.response();
      const status = res?.status();
      requests.push({ url: req.url(), method: req.method(), status, ok: !!res && res.ok(), ms });
    } catch {
      requests.push({ url: req.url(), method: req.method(), ok: false, ms });
    }
  });

  page.on('requestfailed', req => {
    if (!shouldTrack(req.url())) return;
    const start = startedAt.get(req) ?? performance.now();
    const ms = performance.now() - start;
    requests.push({ url: req.url(), method: req.method(), ok: false, ms });
  });

  async function attach(testInfo: TestInfo, name = 'api-requests') {
    await testInfo.attach(name, {
      body: Buffer.from(JSON.stringify({ requests }, null, 2), 'utf8'),
      contentType: 'application/json',
    });
  }

  return { requests, attach };
}

export async function ensureAtLeastOneVisible(locator: ReturnType<Page['locator']>) {
  await expect(locator.first()).toBeVisible();
}
