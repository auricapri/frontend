import * as promClient from 'prom-client';

export const metricsRegistry = new promClient.Registry();
promClient.collectDefaultMetrics({ register: metricsRegistry });

export const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [metricsRegistry],
});

export const httpRequestDurationMs = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP request duration in milliseconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [5, 10, 25, 50, 100, 150, 200, 250, 300, 500, 800, 1200, 2000, 5000],
  registers: [metricsRegistry],
});

export const trackingPixelRequestsTotal = new promClient.Counter({
  name: 'tracking_pixel_requests_total',
  help: 'Total tracking pixel requests',
  labelNames: ['event_type', 'is_bot'],
  registers: [metricsRegistry],
});

export const trackingEventsTotal = new promClient.Counter({
  name: 'tracking_events_total',
  help: 'Total processed tracking events',
  labelNames: ['event_type'],
  registers: [metricsRegistry],
});

export const trackingQueueSize = new promClient.Gauge({
  name: 'tracking_queue_size',
  help: 'Tracking queue size',
  registers: [metricsRegistry],
});

export const trackingProcessingDurationMs = new promClient.Histogram({
  name: 'tracking_processing_duration_ms',
  help: 'Tracking processing duration in milliseconds',
  buckets: [5, 10, 25, 50, 100, 200, 500, 1000, 2000, 5000],
  registers: [metricsRegistry],
});

export const supabaseRequestsTotal = new promClient.Counter({
  name: 'supabase_requests_total',
  help: 'Total Supabase HTTP requests',
  labelNames: ['method', 'table', 'status_code'],
  registers: [metricsRegistry],
});

export const supabaseResponseBytesTotal = new promClient.Counter({
  name: 'supabase_response_bytes_total',
  help: 'Total response bytes from Supabase',
  labelNames: ['table'],
  registers: [metricsRegistry],
});

export const supabaseRequestDurationMs = new promClient.Histogram({
  name: 'supabase_request_duration_ms',
  help: 'Supabase request duration in milliseconds',
  labelNames: ['method', 'table', 'status_code'],
  buckets: [5, 10, 25, 50, 100, 200, 500, 1000, 2000, 5000, 10000],
  registers: [metricsRegistry],
});

export const supabaseInflightRequests = new promClient.Gauge({
  name: 'supabase_inflight_requests',
  help: 'Number of inflight Supabase HTTP requests',
  registers: [metricsRegistry],
});

export const supabaseEgressBudgetUsageRatio = new promClient.Gauge({
  name: 'supabase_egress_budget_usage_ratio',
  help: 'Rolling-hour Supabase egress usage ratio against configured budget',
  registers: [metricsRegistry],
});
