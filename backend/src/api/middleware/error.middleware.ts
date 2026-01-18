import { Request, Response, NextFunction } from 'express';
import logger from '../../config/logger.js';
import { AuthenticatedRequest } from './auth.middleware.js';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error('Request error', {
    message,
    statusCode,
    code: err.code,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: (req as AuthenticatedRequest).userId,
    ip: req.ip,
  });

  res.status(statusCode).json({
    error: {
      message,
      code: err.code,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: {
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
};
