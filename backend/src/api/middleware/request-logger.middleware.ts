import { Request, Response, NextFunction } from 'express';
import logger from '../../config/logger.js';

const SLOW_REQUEST_MS = Number.parseInt(process.env.SLOW_REQUEST_MS || '300', 10);

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const requestId = (req as any).requestId || req.get('x-request-id');
    const logData = {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      durationMs: duration,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    if (res.statusCode >= 500) {
      logger.error('Request failed', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Request error', logData);
    } else if (duration >= SLOW_REQUEST_MS) {
      logger.warn('Slow request', logData);
    } else {
      logger.debug('Request completed', logData);
    }
  });

  next();
};
