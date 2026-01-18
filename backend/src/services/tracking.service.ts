import crypto from 'crypto';
import logger from '../config/logger.js';
import { TrackingQueueService, getTrackingQueueService } from './tracking-queue.service.js';
import { getWeatherService } from './weather.service.js';

const BOT_USER_AGENTS = [
  'Googlebot', 'Bingbot', 'Slurp', 'DuckDuckBot', 'Baiduspider',
  'YandexBot', 'Sogou', 'Exabot', 'facebot', 'ia_archiver',
  'FacebookExternalHit', 'LinkedInBot', 'TwitterBot', 'WhatsApp',
  'Applebot', 'Pingdom', 'UptimeRobot', 'StatusCake', 'NewRelic',
  'AhrefsBot', 'SemrushBot', 'MJ12bot', 'DotBot', 'Barkrowler',
];

export interface TrackingPixelRequestInput {
  eventType: string;
  userId: string | null;
  sessionId: string | null;
  productId: string | null;
  campaignId: string | null;
  metadata: string | null;
  geoLat: number | null;
  geoLon: number | null;
  geoConsent: boolean | null;
  ipAddress: string | null;
  userAgent: string | null;
  referer: string | null;
}

export interface TrackingEventRequestInput {
  eventType: string;
  userId: string | null;
  sessionId: string | null;
  productId: string | null;
  campaignId: string | null;
  metadata: unknown;
  consent: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  referer: string | null;
}

function safeJsonParse(raw: string, maxLen: number): Record<string, unknown> | null {
  if (!raw) return null;
  if (raw.length > maxLen) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

function optimizeMetadata(metadata: Record<string, unknown> | null, productId: string | null, campaignId: string | null): Record<string, unknown> | null {
  if (!metadata && !productId && !campaignId) return null;
  
  const optimized: Record<string, unknown> = {};
  if (productId) optimized.productId = productId;
  if (campaignId) optimized.campaignId = campaignId;
  
  const metadataStr = JSON.stringify(optimized);
  if (metadataStr.length > 128) {
    return productId || campaignId ? { ...(productId ? { productId } : {}), ...(campaignId ? { campaignId } : {}) } : null;
  }
  
  return Object.keys(optimized).length > 0 ? optimized : null;
}

function sanitizeText(input: string | null, maxLen: number): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (trimmed.length === 0) return null;
  return trimmed.slice(0, maxLen);
}

function extractBrowserName(userAgent: string | null): string | null {
  if (!userAgent) return null;
  const ua = userAgent.toLowerCase();
  if (ua.includes('chrome') && !ua.includes('edg')) return 'Chrome';
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
  if (ua.includes('edg')) return 'Edge';
  if (ua.includes('opera') || ua.includes('opr')) return 'Opera';
  return 'Other';
}

function detectDeviceType(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
  const ua = userAgent.toLowerCase();
  if (ua.includes('ipad') || ua.includes('tablet')) return 'tablet';
  if (ua.includes('mobi') || ua.includes('android')) return 'mobile';
  return 'desktop';
}

function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function normalizeEventType(eventType: string): string {
  const normalized = eventType.toLowerCase().trim();
  if (!normalized) return 'page_view';

  const allowed = new Set([
    'page_view',
    'product_view',
    'email_open',
    'email_click',
    'cart_add',
    'cart_remove',
    'checkout_start',
    'purchase',
    'view',
    'click',
  ]);

  return allowed.has(normalized) ? normalized : 'page_view';
}

function toTempBucket(tempC: number): string {
  if (!Number.isFinite(tempC)) return 'unknown';
  if (tempC <= 10) return 'cold';
  if (tempC <= 20) return 'mild';
  if (tempC <= 28) return 'warm';
  return 'hot';
}

function parseConsentGeolocation(consent: unknown): boolean {
  if (!consent || typeof consent !== 'object' || Array.isArray(consent)) return false;
  const obj = consent as Record<string, unknown>;
  return obj.geolocation === true;
}

function extractGeo(meta: Record<string, unknown> | null): { lat: number; lon: number } | null {
  if (!meta) return null;
  const geo = meta.geo;
  if (!geo || typeof geo !== 'object' || Array.isArray(geo)) return null;
  const obj = geo as Record<string, unknown>;
  const lat = typeof obj.lat === 'number' ? obj.lat : Number(obj.lat);
  const lon = typeof obj.lon === 'number' ? obj.lon : Number(obj.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon };
}

export class TrackingService {
  private queue: TrackingQueueService;
  private weather = getWeatherService();

  constructor(queue?: TrackingQueueService) {
    this.queue = queue ?? getTrackingQueueService();
  }

  isBotUserAgent(userAgent: string): boolean {
    if (!userAgent) return false;
    return BOT_USER_AGENTS.some(bot => userAgent.includes(bot));
  }

  async trackFromPixelRequest(input: TrackingPixelRequestInput): Promise<void> {
    const eventType = normalizeEventType(input.eventType);
    const userAgentRaw = input.userAgent;
    const isBot = this.isBotUserAgent(userAgentRaw ?? '');
    if (isBot) return;
    
    const userAgent = extractBrowserName(userAgentRaw);
    const deviceType = detectDeviceType(userAgentRaw ?? '');

    const sessionId = sanitizeText(input.sessionId, 128) ?? crypto.randomUUID();
    const userId = sanitizeText(input.userId, 64);
    const productId = sanitizeText(input.productId, 128);
    const campaignId = sanitizeText(input.campaignId, 128);
    
    const metadataObj = input.metadata ? safeJsonParse(input.metadata, 128) : null;
    const path = metadataObj?.path as string | undefined || null;
    const baseMetadata = optimizeMetadata(metadataObj, productId, campaignId);

    let weatherMeta: Record<string, unknown> | null = null;
    if (input.geoConsent === true && Number.isFinite(input.geoLat) && Number.isFinite(input.geoLon)) {
      const weather = await this.weather.getCurrentWeather(input.geoLat as number, input.geoLon as number);
      if (weather) {
        weatherMeta = {
          weatherCode: weather.weatherCode,
          tempBucket: toTempBucket(weather.temperatureC),
        };
      }
    }

    const metadata = (() => {
      const merged: Record<string, unknown> = { ...(baseMetadata ?? {}) };
      if (path) merged.path = path;
      if (weatherMeta) Object.assign(merged, weatherMeta);
      return Object.keys(merged).length > 0 ? merged : null;
    })();

    const ipRaw = sanitizeText(input.ipAddress, 128);
    const ipHash = ipRaw ? sha256Hex(ipRaw) : null;

    this.queue.enqueue({
      event_type: eventType,
      user_id: userId,
      session_id: sessionId,
      ip_address: null,
      ip_hash: ipHash,
      user_agent: userAgent,
      referer: null,
      device_type: deviceType,
      is_bot: false,
      metadata,
    }).catch((error: unknown) => {
      logger.warn('Failed to enqueue tracking event', { error: error instanceof Error ? error.message : String(error) });
    });
  }

  async trackFromEventRequest(input: TrackingEventRequestInput): Promise<void> {
    const eventType = normalizeEventType(input.eventType);
    const userAgentRaw = input.userAgent;
    const isBot = this.isBotUserAgent(userAgentRaw ?? '');
    if (isBot) return;
    
    const userAgent = extractBrowserName(userAgentRaw);
    const deviceType = detectDeviceType(userAgentRaw ?? '');

    const sessionId = sanitizeText(input.sessionId, 128) ?? crypto.randomUUID();
    const userId = sanitizeText(input.userId, 64);
    const productId = sanitizeText(input.productId, 128);
    const campaignId = sanitizeText(input.campaignId, 128);

    const metaObj = input.metadata && typeof input.metadata === 'object' && !Array.isArray(input.metadata)
      ? (input.metadata as Record<string, unknown>)
      : null;
    const path = metaObj?.path as string | undefined || null;
    const baseMetadata = optimizeMetadata(metaObj, productId, campaignId);

    let weatherMeta: Record<string, unknown> | null = null;
    if (parseConsentGeolocation(input.consent)) {
      const geo = extractGeo(metaObj);
      if (geo) {
        const weather = await this.weather.getCurrentWeather(geo.lat, geo.lon);
        if (weather) {
          weatherMeta = {
            weatherCode: weather.weatherCode,
            tempBucket: toTempBucket(weather.temperatureC),
          };
        }
      }
    }

    const metadata = (() => {
      const merged: Record<string, unknown> = { ...(baseMetadata ?? {}) };
      if (path) merged.path = path;
      if (weatherMeta) Object.assign(merged, weatherMeta);
      return Object.keys(merged).length > 0 ? merged : null;
    })();

    const ipRaw = sanitizeText(input.ipAddress, 128);
    const ipHash = ipRaw ? sha256Hex(ipRaw) : null;

    this.queue.enqueue({
      event_type: eventType,
      user_id: userId,
      session_id: sessionId,
      ip_address: null,
      ip_hash: ipHash,
      user_agent: userAgent,
      referer: null,
      device_type: deviceType,
      is_bot: false,
      metadata: metadata as Record<string, unknown> | null,
    }).catch((error: unknown) => {
      logger.warn('Failed to enqueue tracking event', { error: error instanceof Error ? error.message : String(error) });
    });
  }
}
