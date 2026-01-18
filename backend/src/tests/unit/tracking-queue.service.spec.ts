import { describe, it, expect } from 'vitest';
import { TrackingQueueService } from '../../services/tracking-queue.service.js';

describe('TrackingQueueService (memory fallback)', () => {
  it('buffers events and flushes in batches', async () => {
    const inserted: unknown[] = [];

    const repo = {
      bulkInsertEvents: async (events: unknown[]) => {
        inserted.push(...events);
      },
    } as any;

    const svc = new TrackingQueueService({ redis: null, repo });

    for (let i = 0; i < 25; i += 1) {
      await svc.enqueue({
        event_type: 'page_view',
        user_id: null,
        session_id: `s${i % 3}`,
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
    expect(inserted.length).toBe(25);
  });
});

