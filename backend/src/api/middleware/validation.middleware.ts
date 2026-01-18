import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import logger from '../../config/logger.js';

export interface ValidationSchema {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

export const validate = (schema: ValidationSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Validation error', {
          errors: error.errors,
          path: req.path,
          method: req.method,
        });
        res.status(400).json({
          error: {
            message: 'Validation error',
            details: error.errors.map(err => ({
              path: err.path.join('.'),
              message: err.message,
            })),
          },
        });
        return;
      }
      next(error);
    }
  };
};
