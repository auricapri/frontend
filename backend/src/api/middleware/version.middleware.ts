import { Request, Response, NextFunction } from 'express';
import { getVersion } from '../../config/version.js';
import logger from '../../config/logger.js';

let cachedVersion: string | null = null;

function getCachedVersion(): string {
  if (!cachedVersion) {
    cachedVersion = getVersion();
  }
  return cachedVersion;
}

export function versionMiddleware(req: Request, res: Response, next: NextFunction): void {
  const originalJson = res.json.bind(res);

  res.json = function (body?: any): Response {
    if (req.path.startsWith('/api/')) {
      if (body && typeof body === 'object' && !Array.isArray(body) && !('error' in body)) {
        try {
          return originalJson({ ...body, version: getCachedVersion() });
        } catch (error) {
          logger.error('Error adding version to response', {
            error: error instanceof Error ? error.message : String(error),
          });
          return originalJson(body);
        }
      }
    }
    return originalJson(body);
  };

  next();
}
