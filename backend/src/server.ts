import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './api/middleware/error.middleware.js';
import { versionMiddleware } from './api/middleware/version.middleware.js';
import { getVersion } from './config/version.js';
import { getSchedulerService } from './services/scheduler.service.js';
import { getTrackingQueueService } from './services/tracking-queue.service.js';
import { initializeMarketplaceEvents, cleanupMarketplaceEvents } from './services/marketplace/index.js';
import logger from './config/logger.js';
import { requestLogger } from './api/middleware/request-logger.middleware.js';
import { randomUUID } from 'crypto';
import { httpRequestDurationMs, httpRequestsTotal, metricsRegistry } from './config/metrics.js';
import { generalRateLimiter } from './api/middleware/rate-limit.middleware.js';
import { setupSwagger } from './api/middleware/swagger.middleware.js';

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Disable CSP to allow external assets like Mapbox and ESM.sh
}));

// CORS configuration
app.use(
  cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Check if origin is in allowed list
      const allowedOrigins = env.cors.allowedOrigins;
      const isAllowed = allowedOrigins.some(ao => origin === ao || origin.startsWith(ao));
      
      if (isAllowed || origin === env.cors.frontendUrl) {
        callback(null, true);
      } else {
        logger.warn('CORS blocked origin', { origin, allowedOrigins });
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Id'],
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  const incoming = req.get('x-request-id');
  const requestId = incoming && incoming.length > 0 ? incoming : randomUUID();
  (req as any).requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const routePath = (req as any).route?.path ? `${req.baseUrl}${(req as any).route.path}` : req.path;
    const labels = {
      method: req.method,
      route: routePath,
      status_code: String(res.statusCode),
    };
    httpRequestsTotal.inc(labels, 1);
    httpRequestDurationMs.observe(labels, durationMs);
  });
  next();
});

// Request logging middleware
app.use(requestLogger);

// General rate limiting
app.use(generalRateLimiter);

// Version middleware (must be before API routes)
app.use(versionMiddleware);

// Swagger documentation (must be before API routes)
if (env.server.nodeEnv !== 'production' || process.env.ENABLE_SWAGGER === 'true') {
  setupSwagger(app);
}

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/metrics', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', metricsRegistry.contentType);
  res.end(await metricsRegistry.metrics());
});

// API routes
import aiRoutes from './api/routes/ai.routes.js';
import productsRoutes from './api/routes/products.routes.js';
import ordersRoutes from './api/routes/orders.routes.js';
import usersRoutes from './api/routes/users.routes.js';
import storeRoutes from './api/routes/store.routes.js';
import couponsRoutes from './api/routes/coupons.routes.js';
import collectionsRoutes from './api/routes/collections.routes.js';
import assetsRoutes from './api/routes/assets.routes.js';
import authRoutes from './api/routes/auth.routes.js';
import pdfRoutes from './api/routes/pdf.routes.js';
import wishlistRoutes from './api/routes/wishlist.routes.js';
import guidesRoutes from './api/routes/guides.routes.js';
import bannersRoutes from './api/routes/banners.routes.js';
import shipmentsRoutes from './api/routes/shipments.routes.js';
import paymentsRoutes from './api/routes/payments.routes.js';
import returnsRoutes from './api/routes/returns.routes.js';
import notificationsRoutes from './api/routes/notifications.routes.js';
import userConsentsRoutes from './api/routes/user_consents.routes.js';
import dreamRoutes from './api/routes/dream.routes.js';
import productReviewsRoutes from './api/routes/product-reviews.routes.js';
import suppliersRoutes from './api/routes/suppliers.routes.js';
import deliveryRoutes from './api/routes/delivery.routes.js';
import pricingRoutes from './api/routes/pricing.routes.js';
import geocodingRoutes from './api/routes/geocoding.routes.js';
import logisticsRoutes from './api/routes/logistics.routes.js';
import cartRoutes from './api/routes/cart.routes.js';
import trackingRoutes from './api/routes/tracking.routes.js';
import weatherRoutes from './api/routes/weather.routes.js';
import marketingRoutes from './api/routes/marketing.routes.js';
import marketplaceRoutes from './api/routes/marketplace.routes.js';
import marketplaceWebhooksRoutes from './api/routes/marketplace-webhooks.routes.js';
import hotspotsRoutes from './api/routes/hotspots.routes.js';

app.use('/api/ai', aiRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/products', hotspotsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/guides', guidesRoutes);
app.use('/api/banners', bannersRoutes);
app.use('/api/shipments', shipmentsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/returns', returnsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/user-consents', userConsentsRoutes);
app.use('/api/dream', dreamRoutes);
app.use('/api/product-reviews', productReviewsRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/geocoding', geocodingRoutes);
app.use('/api/logistics', logisticsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/marketing', marketingRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/marketplace/webhooks', marketplaceWebhooksRoutes);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = env.server.port;

// Iniciar scheduler de limpeza
const schedulerService = getSchedulerService();
const trackingQueue = getTrackingQueueService();

app.listen(PORT, () => {
  logger.info('Server started', {
    port: PORT,
    environment: env.server.nodeEnv,
    frontendUrl: env.cors.frontendUrl,
    version: getVersion(),
  });

  schedulerService.startCleanupScheduler();
  trackingQueue.startWorker();
  initializeMarketplaceEvents();
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  schedulerService.stopCleanupScheduler();
  trackingQueue.stopWorker();
  cleanupMarketplaceEvents();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  schedulerService.stopCleanupScheduler();
  trackingQueue.stopWorker();
  cleanupMarketplaceEvents();
  process.exit(0);
});
