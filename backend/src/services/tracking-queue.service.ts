import logger from '../config/logger.js';
import { env } from '../config/env.js';
import { getRedisClient } from '../config/redis.js';
import { TrackingRepository, type TrackingEventInsert } from '../repositories/tracking.repository.js';
import { trackingEventsTotal, trackingProcessingDurationMs, trackingQueueSize } from '../config/metrics.js';

interface QueuedEvent {
  event: TrackingEventInsert;
  enqueuedAt: number;
}

export class TrackingQueueService {
  private redis = (env.redis.primaryUrl || env.redis.secondaryUrl || env.redis.url) ? getRedisClient(false) : null;
  private repo = new TrackingRepository();
  private workerInterval: ReturnType<typeof setInterval> | null = null;
  private readonly queueKey = 'tracking:events:v1';
  private readonly batchSize = env.tracking.batchSize;
  private readonly intervalMs = env.tracking.intervalMs;
  private readonly maxQueueLen = env.tracking.maxQueueLen;
  private readonly maxMemoryQueueLen = 5000;
  private readonly maxEventAgeMs = 10 * 60 * 1000; // 10 minutes TTL for memory queue events
  private memoryQueue: QueuedEvent[] = [];
  private processing = false;

  constructor(options?: { redis?: any; repo?: TrackingRepository }) {
    if (options?.redis !== undefined) this.redis = options.redis;
    if (options?.repo) this.repo = options.repo;
  }

  async enqueue(event: TrackingEventInsert): Promise<void> {
    if (event.is_bot) return;

    if (!this.redis) {
      this.enqueueMemory(event);
      return;
    }

    try {
      const payload = JSON.stringify(event);
      const multi = this.redis.multi();
      multi.rpush(this.queueKey, payload);
      multi.ltrim(this.queueKey, -this.maxQueueLen, -1);
      await multi.exec();
    } catch (error) {
      logger.warn('Failed to enqueue tracking event to Redis, buffering in memory', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      this.enqueueMemory(event);
    }
  }

  startWorker(): void {
    if (this.workerInterval) return;

    this.workerInterval = setInterval(() => {
      this.tick().catch(error => {
        logger.error('Tracking worker batch failed', { error: error instanceof Error ? error.message : String(error) });
      });
    }, this.intervalMs);

    logger.info('Tracking queue worker started', { intervalMs: this.intervalMs, batchSize: this.batchSize, hasRedis: !!this.redis });
  }

  stopWorker(): void {
    if (this.workerInterval) {
      clearInterval(this.workerInterval);
      this.workerInterval = null;
      logger.info('Tracking queue worker stopped');
    }
  }

  async flushNow(): Promise<void> {
    await this.tick();
    while (this.memoryQueue.length > 0) {
      await this.tick();
    }
  }

  private enqueueMemory(event: TrackingEventInsert): void {
    const now = Date.now();

    // First, clean up expired events
    this.memoryQueue = this.memoryQueue.filter(q => now - q.enqueuedAt < this.maxEventAgeMs);

    // Then add new event
    this.memoryQueue.push({ event, enqueuedAt: now });

    // Enforce max queue length
    if (this.memoryQueue.length > this.maxMemoryQueueLen) {
      const dropped = this.memoryQueue.length - this.maxMemoryQueueLen;
      this.memoryQueue = this.memoryQueue.slice(-this.maxMemoryQueueLen);
      logger.warn('Tracking memory queue overflow, dropped oldest events', { dropped });
    }
  }

  private async tick(): Promise<void> {
    if (this.processing) return;
    this.processing = true;
    try {
      if (this.redis) {
        await this.processRedisBatch();
      }
      await this.processMemoryBatch();
    } finally {
      this.processing = false;
    }
  }

  private async processRedisBatch(): Promise<void> {
    if (!this.redis) return;

    const start = Date.now();
    const len = await this.redis.llen(this.queueKey);
    trackingQueueSize.set(len + this.memoryQueue.length);
    if (len === 0) return;

    const count = Math.min(this.batchSize, len);
    const multi = this.redis.multi();
    multi.lrange(this.queueKey, 0, count - 1);
    multi.ltrim(this.queueKey, count, -1);
    const results = await multi.exec();

    const items = (results?.[0]?.[1] ?? []) as string[];
    if (!Array.isArray(items) || items.length === 0) return;

    const events: TrackingEventInsert[] = [];
    for (const raw of items) {
      try {
        const parsed = JSON.parse(raw) as TrackingEventInsert;
        if (parsed && typeof parsed === 'object' && typeof parsed.event_type === 'string') {
          events.push(parsed);
        }
      } catch {
        continue;
      }
    }

    await this.repo.bulkInsertEvents(events);
    for (const ev of events) {
      trackingEventsTotal.inc({ event_type: ev.event_type }, 1);
    }
    trackingProcessingDurationMs.observe(Date.now() - start);
  }

  private async processMemoryBatch(): Promise<void> {
    const now = Date.now();

    // Clean up expired events before processing
    this.memoryQueue = this.memoryQueue.filter(q => now - q.enqueuedAt < this.maxEventAgeMs);

    const len = this.memoryQueue.length;
    if (!this.redis) trackingQueueSize.set(len);
    if (len === 0) return;

    const start = Date.now();
    const count = Math.min(this.batchSize, len);
    const queuedEvents = this.memoryQueue.splice(0, count);
    const events = queuedEvents.map(q => q.event);

    await this.repo.bulkInsertEvents(events);
    for (const ev of events) {
      trackingEventsTotal.inc({ event_type: ev.event_type }, 1);
    }
    trackingProcessingDurationMs.observe(Date.now() - start);
  }
}

let singleton: TrackingQueueService | null = null;
export function getTrackingQueueService(): TrackingQueueService {
  if (!singleton) singleton = new TrackingQueueService();
  return singleton;
}
