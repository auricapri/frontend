import { logger } from '../utils/logger';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
const PIXEL_URL = `${API_BASE_URL}/tracking/pixel.gif`;
const EVENT_URL = `${API_BASE_URL}/tracking/event`;

type TrackingEventType =
  | 'page_view'
  | 'product_view'
  | 'email_open'
  | 'email_click'
  | 'cart_add'
  | 'cart_remove'
  | 'checkout_start'
  | 'purchase';

type ConsentState = {
  analytics: boolean;
  geolocation: boolean;
};

type GeoCache = {
  lat: number;
  lon: number;
  ts: number;
};

function readGeoCache(maxAgeMs: number): GeoCache | null {
  const raw = localStorage.getItem('tracking_geo_cache');
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const obj = parsed as Record<string, unknown>;
    const lat = typeof obj.lat === 'number' ? obj.lat : Number(obj.lat);
    const lon = typeof obj.lon === 'number' ? obj.lon : Number(obj.lon);
    const ts = typeof obj.ts === 'number' ? obj.ts : Number(obj.ts);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(ts)) return null;
    if (Date.now() - ts > maxAgeMs) return null;
    return { lat, lon, ts };
  } catch {
    return null;
  }
}

function writeGeoCache(value: GeoCache): void {
  localStorage.setItem('tracking_geo_cache', JSON.stringify(value));
}

function getOrCreateSessionId(): string {
  const key = 'tracking_session_id';
  const existing = localStorage.getItem(key);
  if (existing && existing.length > 8) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
}

function safeJsonStringify(value: unknown, maxLen: number): string | null {
  try {
    const str = JSON.stringify(value);
    if (str.length > maxLen) return null;
    return str;
  } catch {
    return null;
  }
}

function optimizeMetadata(
  metadata: Record<string, unknown> | null,
  productId: string | null,
  campaignId: string | null
): Record<string, unknown> | null {
  const optimized: Record<string, unknown> = {};

  if (metadata) {
    Object.entries(metadata).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        optimized[key] = value;
        return;
      }
      if (Array.isArray(value)) {
        optimized[key] = value.slice(0, 20);
        return;
      }
      if (typeof value === 'object') {
        if (key === 'filters') {
          optimized[key] = value;
        }
      }
    });
  }

  if (productId) optimized.productId = productId;
  if (campaignId) optimized.campaignId = campaignId;

  const metadataStr = JSON.stringify(optimized);
  if (metadataStr.length > 512) {
    const slim: Record<string, unknown> = {};
    if (optimized.filters) slim.filters = optimized.filters;
    if (productId) slim.productId = productId;
    if (campaignId) slim.campaignId = campaignId;
    return Object.keys(slim).length > 0 ? slim : null;
  }

  return Object.keys(optimized).length > 0 ? optimized : null;
}

function readQueue(): unknown[] {
  const raw = localStorage.getItem('tracking_event_queue');
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(items: unknown[]): void {
  localStorage.setItem('tracking_event_queue', JSON.stringify(items.slice(-200)));
}

export class TrackingService {
  private inFlight = 0;
  private geoInFlight = false;
  private lastEventHash: string | null = null;
  private lastEventTs = 0;

  getConsent(): ConsentState {
    const raw = localStorage.getItem('tracking_consent');
    if (!raw) return { analytics: true, geolocation: false };
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return { analytics: true, geolocation: false };
      }
      const obj = parsed as Record<string, unknown>;
      return {
        analytics: obj.analytics !== false,
        geolocation: obj.geolocation === true,
      };
    } catch {
      return { analytics: true, geolocation: false };
    }
  }

  setConsent(consent: ConsentState): void {
    localStorage.setItem('tracking_consent', JSON.stringify(consent));
  }

  enqueueEvent(payload: Record<string, unknown>): void {
    const queue = readQueue();
    queue.push(payload);
    writeQueue(queue);
  }

  async flushQueue(): Promise<void> {
    if (!navigator.onLine) return;
    if (this.inFlight > 0) return;

    const queue = readQueue();
    if (queue.length === 0) return;

    this.inFlight += 1;
    try {
      const remaining: unknown[] = [];
      for (const item of queue) {
        const ok = await this.sendEvent(item as Record<string, unknown>);
        if (!ok) remaining.push(item);
      }
      writeQueue(remaining);
    } finally {
      this.inFlight -= 1;
    }
  }

  private async sendEvent(payload: Record<string, unknown>): Promise<boolean> {
    try {
      const eventUrl = new URL(EVENT_URL);
      const isSameOrigin = eventUrl.origin === window.location.origin;

      if (isSameOrigin && navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        const ok = navigator.sendBeacon(EVENT_URL, blob);
        return ok;
      }

      await fetch(EVENT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      });

      return true;
    } catch (error) {
      logger.warn('Tracking event send failed', error);
      return false;
    }
  }

  private sendPixel(params: Record<string, string>): void {
    const url = new URL(PIXEL_URL);
    Object.entries(params).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v);
    });
    const img = new Image();
    img.decoding = 'async';
    img.loading = 'eager';
    img.src = url.toString();
  }

  private primeGeoIfAllowed(consent: ConsentState): void {
    if (!consent.geolocation) return;
    if (this.geoInFlight) return;

    const cached = readGeoCache(60 * 60 * 1000);
    if (cached) return;

    if (!navigator.geolocation) return;
    this.geoInFlight = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        writeGeoCache({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          ts: Date.now(),
        });
        this.geoInFlight = false;
      },
      () => {
        this.geoInFlight = false;
      },
      { enableHighAccuracy: false, timeout: 2000, maximumAge: 60 * 60 * 1000 }
    );
  }


  async trackEvent(input: {
    event: TrackingEventType;
    userId?: string;
    productId?: string;
    campaignId?: string;
    metadata?: Record<string, unknown>;
    consent?: ConsentState;
    preferBeacon?: boolean;
  }): Promise<void> {
    const sessionId = getOrCreateSessionId();

    const consent = input.consent ?? this.getConsent();
    if (!consent.analytics) return;

    const path = window.location.pathname;
    const metadata = optimizeMetadata(input.metadata || null, input.productId || null, input.campaignId || null);
    this.primeGeoIfAllowed(consent);
    const geo = consent.geolocation ? readGeoCache(60 * 60 * 1000) : null;

    const signatureBase = JSON.stringify({
      event: input.event,
      productId: input.productId ?? null,
      campaignId: input.campaignId ?? null,
      path,
    });
    const now = Date.now();
    if (this.lastEventHash === signatureBase && now - this.lastEventTs < 3000) {
      return;
    }
    this.lastEventHash = signatureBase;
    this.lastEventTs = now;

    const payload: Record<string, unknown> = {
      event: input.event,
      userId: input.userId ?? null,
      sessionId,
      productId: input.productId ?? null,
      campaignId: input.campaignId ?? null,
      metadata: (() => {
        const filters = (() => {
          try {
            const url = new URL(window.location.href);
            const entries: Record<string, string | string[]> = {};
            url.searchParams.forEach((value, key) => {
              if (entries[key] === undefined) {
                entries[key] = value;
              } else {
                const current = entries[key];
                if (Array.isArray(current)) {
                  if (!current.includes(value)) entries[key] = [...current, value];
                } else if (current !== value) {
                  entries[key] = [current, value];
                }
              }
            });
            return Object.keys(entries).length > 0 ? entries : null;
          } catch {
            return null;
          }
        })();

        const base = metadata ? { ...metadata, path } : { path };
        if (filters) {
          (base as Record<string, unknown>).filters = filters;
        }
        if (geo) return { ...base, geo: { lat: geo.lat, lon: geo.lon } };
        return base;
      })(),
    };

    if (input.preferBeacon) {
      if (consent.geolocation && geo) {
        payload.consent = { geolocation: true };
      }
      const ok = await this.sendEvent(payload);
      if (!ok) this.enqueueEvent(payload);
    } else {
      if (input.event === 'page_view' && (path === '/' || path === '')) {
        return;
      }
      if (input.event === 'product_view' && !input.productId) {
        return;
      }

      const metadataStr = safeJsonStringify(payload.metadata, 512);
      this.sendPixel({
        event: payload.event as string,
        userId: (payload.userId as string | null) ?? '',
        sessionId,
        productId: (payload.productId as string | null) ?? '',
        campaignId: (payload.campaignId as string | null) ?? '',
        metadata: metadataStr ?? '',
        geoConsent: geo && consent.geolocation ? '1' : '',
        lat: geo && consent.geolocation ? String(geo.lat) : '',
        lon: geo && consent.geolocation ? String(geo.lon) : '',
      });
      if (navigator.onLine) {
        void this.flushQueue();
      }
    }
  }

  private lastTrackedPath: string | null = null;

  trackPageView(path: string, metadata?: Record<string, unknown>): void {
    if (this.lastTrackedPath === path) return;
    this.lastTrackedPath = path;
    void this.trackEvent({ event: 'page_view', metadata: { path, ...(metadata ?? {}) } });
  }

  // Desabilitado para reduzir requisições ao Supabase
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  trackProductView(_productId: string, _metadata?: Record<string, unknown>): void {
    // Desabilitado - usar apenas page_view e purchase
  }

  // Desabilitado para reduzir requisições ao Supabase
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  trackCartAdd(_productId: string, _variantId: string, _quantity: number): void {
    // Desabilitado - usar apenas page_view e purchase
  }

  // Desabilitado para reduzir requisições ao Supabase
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  trackCartRemove(_productId: string, _variantId: string): void {
    // Desabilitado - usar apenas page_view e purchase
  }

  // Desabilitado para reduzir requisições ao Supabase
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  trackCheckoutStart(_total: number, _itemsCount: number): void {
    // Desabilitado - usar apenas page_view e purchase
  }

  trackPurchase(orderId: string, total: number, items: Array<{ product_id: string; variant_id: string; quantity: number; price: number }>): void {
    void this.trackEvent({ event: 'purchase', metadata: { orderId, total, items }, preferBeacon: true });
  }
}

export const trackingService = new TrackingService();
