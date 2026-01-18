import logger from '../config/logger.js';

export interface FetchWithRetryOptions {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeoutMs: number;
  maxRetries: number;
  retryBaseDelayMs?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function shouldRetry(status: number): boolean {
  return status === 408 || status === 429 || (status >= 500 && status <= 599);
}

export async function fetchJsonWithRetry<T>(opts: FetchWithRetryOptions): Promise<T> {
  const retryBaseDelayMs = opts.retryBaseDelayMs ?? 250;

  let lastError: unknown = null;
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), opts.timeoutMs);

    try {
      const res = await fetch(opts.url, {
        method: opts.method ?? 'GET',
        headers: { Accept: 'application/json', ...(opts.headers ?? {}) },
        body: opts.body,
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        const message = `HTTP ${res.status} ${res.statusText}`;

        if (attempt < opts.maxRetries && shouldRetry(res.status)) {
          const jitter = Math.floor(Math.random() * 100);
          const delay = retryBaseDelayMs * Math.pow(2, attempt) + jitter;
          logger.warn('HTTP retryable failure', { url: opts.url, attempt, status: res.status, delay, body: text.slice(0, 200) });
          await sleep(delay);
          continue;
        }

        throw new Error(`${message} ${text ? `- ${text.slice(0, 500)}` : ''}`.trim());
      }

      const json = (await res.json()) as T;
      return json;
    } catch (err) {
      lastError = err;

      const isAbort = err instanceof Error && err.name === 'AbortError';
      if (attempt < opts.maxRetries) {
        const jitter = Math.floor(Math.random() * 100);
        const delay = retryBaseDelayMs * Math.pow(2, attempt) + jitter;
        logger.warn('HTTP request failed, retrying', { url: opts.url, attempt, delay, isAbort, error: err instanceof Error ? err.message : String(err) });
        await sleep(delay);
        continue;
      }

      break;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

