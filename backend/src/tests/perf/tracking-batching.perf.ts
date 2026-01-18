import { describe, it, expect } from 'vitest';
import { TrackingQueueService } from '../../services/tracking-queue.service.js';

describe('tracking batching perf', () => {
  it('reduces insert calls by batching', async () => {
    const calls: number[] = [];

    const repo = {
      bulkInsertEvents: async (events: unknown[]) => {
        calls.push(events.length);
      },
    } as any;

    const svc = new TrackingQueueService({ redis: null, repo });

    const total = 1000;
    for (let i = 0; i < total; i += 1) {
      await svc.enqueue({
        event_type: 'page_view',
        user_id: null,
        session_id: `s${i % 50}`,
        ip_address: null,
        ip_hash: null,
        user_agent: 'Chrome',
        referer: null,
        device_type: 'desktop',
        is_bot: false,
        metadata: { path: '/x' },
      });
    }

    await svc.flushNow();

    expect(calls.reduce((a, b) => a + b, 0)).toBe(total);
    expect(calls.length).toBeLessThanOrEqual(5);
  });
});

