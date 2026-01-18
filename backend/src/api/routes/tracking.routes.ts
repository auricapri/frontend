import { Router, Request, Response } from 'express';
import { TrackingService } from '../../services/tracking.service.js';
import { trackingPixelRequestsTotal } from '../../config/metrics.js';
import { trackingRateLimiter } from '../middleware/rate-limit.middleware.js';

const router = Router();
const trackingService = new TrackingService();

router.use(trackingRateLimiter);

const PIXEL_GIF = Buffer.from(
  '47494638396101000100800000000000ffffff21f90401000000002c00000000010001000002024401003b',
  'hex'
);

function getClientIp(req: Request): string | null {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].split(',')[0].trim();
  }
  return req.socket.remoteAddress ?? null;
}

router.get('/pixel.gif', (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Content-Length', String(PIXEL_GIF.length));
  res.setHeader('Connection', 'close');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

  res.status(200).end(PIXEL_GIF);

  const eventTypeRaw = typeof req.query.event === 'string' ? req.query.event : (typeof req.query.event_type === 'string' ? req.query.event_type : 'page_view');
  const isBot = trackingService.isBotUserAgent(req.get('user-agent') ?? '');
  const normalized = (() => {
    const v = eventTypeRaw.toLowerCase().trim();
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
    return allowed.has(v) ? v : 'page_view';
  })();
  trackingPixelRequestsTotal.inc({ event_type: normalized, is_bot: String(isBot) }, 1);

  setImmediate(() => {
    const geoLat = typeof req.query.lat === 'string' ? Number(req.query.lat) : NaN;
    const geoLon = typeof req.query.lon === 'string' ? Number(req.query.lon) : NaN;
    const geoConsent = typeof req.query.geoConsent === 'string'
      ? (req.query.geoConsent === '1' || req.query.geoConsent.toLowerCase() === 'true')
      : null;

    void trackingService.trackFromPixelRequest({
      eventType: normalized,
      userId: typeof req.query.userId === 'string' ? req.query.userId : null,
      sessionId: typeof req.query.sessionId === 'string' ? req.query.sessionId : null,
      productId: typeof req.query.productId === 'string' ? req.query.productId : null,
      campaignId: typeof req.query.campaignId === 'string' ? req.query.campaignId : null,
      metadata: typeof req.query.metadata === 'string' ? req.query.metadata : null,
      geoLat: Number.isFinite(geoLat) ? geoLat : null,
      geoLon: Number.isFinite(geoLon) ? geoLon : null,
      geoConsent,
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent') ?? null,
      referer: req.get('referer') ?? null,
    });
  });
});

/**
 * @swagger
 * /api/tracking/event:
 *   post:
 *     summary: Registrar evento de tracking
 *     tags: [Tracking]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *               userId:
 *                 type: string
 *                 format: uuid
 *               sessionId:
 *                 type: string
 *               productId:
 *                 type: string
 *                 format: uuid
 *               campaignId:
 *                 type: string
 *                 format: uuid
 *               metadata:
 *                 type: object
 *               consent:
 *                 type: boolean
 *     responses:
 *       204:
 *         description: Evento registrado com sucesso
 */
router.post('/event', (req: Request, res: Response) => {
  res.status(204).end();

  const body = req.body as Record<string, unknown> | null;
  setImmediate(() => {
    void trackingService.trackFromEventRequest({
      eventType: typeof body?.event === 'string' ? body.event : (typeof body?.event_type === 'string' ? (body.event_type as string) : 'page_view'),
      userId: typeof body?.userId === 'string' ? (body.userId as string) : null,
      sessionId: typeof body?.sessionId === 'string' ? (body.sessionId as string) : null,
      productId: typeof body?.productId === 'string' ? (body.productId as string) : null,
      campaignId: typeof body?.campaignId === 'string' ? (body.campaignId as string) : null,
      metadata: body?.metadata ?? null,
      consent: body?.consent ?? null,
      ipAddress: getClientIp(req),
      userAgent: req.get('user-agent') ?? null,
      referer: req.get('referer') ?? null,
    });
  });
});

export default router;
