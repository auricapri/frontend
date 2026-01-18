import { Request, Response, NextFunction } from 'express';
import { User } from '@supabase/supabase-js';
import { supabase } from '../../config/supabase.js';
import { UsersRepository } from '../../repositories/users.repository.js';
import logger from '../../config/logger.js';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: User;
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
  headers: Request['headers'];
  params: Request['params'];
  body: Request['body'];
  query: Request['query'];
  ip: Request['ip'];
  get: Request['get'];
}

/**
 * Middleware to authenticate requests using Supabase JWT tokens
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          message: 'Missing or invalid authorization header',
        },
      });
    }

    const token = authHeader.substring(7);

    // Verify token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: {
          message: 'Invalid or expired token',
        },
      });
    }

    // Attach user info to request
    req.userId = user.id;
    req.user = user;

    next();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    return res.status(401).json({
      error: {
        message: errorMessage,
      },
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const {
        data: { user },
      } = await supabase.auth.getUser(token);

      if (user) {
        req.userId = user.id;
        req.user = user;
      }
    }

    next();
  } catch (error: unknown) {
    logger.warn('Optional auth error', { error });
    // Continue without authentication
    next();
  }
};

/**
 * Middleware to require admin role - must be used after authenticate
 */
export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: {
          message: 'Authentication required',
        },
      });
    }

    const usersRepo = new UsersRepository();
    const profile = await usersRepo.getProfile(req.userId);

    if (!profile) {
      return res.status(403).json({
        error: {
          message: 'Profile not found',
        },
      });
    }

    // Check if user has admin role
    // Using explicit cast only if necessary for legacy fields, but prefer typed 'role'
    const isAdmin = profile.role === 'admin';

    if (!isAdmin) {
      return res.status(403).json({
        error: {
          message: 'Admin access required',
        },
      });
    }

    next();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Admin verification failed', { error: message });
    return res.status(403).json({
      error: {
        message: 'Admin verification failed',
      },
    });
  }
};

/**
 * Middleware to require authentication - alias for authenticate
 */
export const requireAuth = authenticate;

/**
 * Middleware to require delivery role - must be used after authenticate
 */
export const requireDelivery = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: {
          message: 'Authentication required',
        },
      });
    }

    const usersRepo = new UsersRepository();
    const profile = await usersRepo.getProfile(req.userId);

    if (!profile) {
      return res.status(403).json({
        error: {
          message: 'Profile not found',
        },
      });
    }

    const isDelivery = profile.role === 'delivery';
    const isAdmin = profile.role === 'admin';

    if (!isDelivery && !isAdmin) {
      return res.status(403).json({
        error: {
          message: 'Delivery or admin access required',
        },
      });
    }

    next();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Delivery verification failed', { error: message });
    return res.status(403).json({
      error: {
        message: 'Delivery verification failed',
      },
    });
  }
};
