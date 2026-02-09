/**
 * Unified Error System for Auricapri Frontend
 *
 * This module provides consistent error handling across the application.
 *
 * @example
 * // Handling API errors
 * import { AppError, formatErrorForDisplay } from '@/lib/errors';
 *
 * try {
 *   await api.createOrder(orderData);
 * } catch (error) {
 *   const appError = AppError.fromError(error);
 *   toast.error(appError.getUserMessage());
 *
 *   if (appError.isAuth()) {
 *     // Redirect to login
 *   }
 * }
 *
 * @example
 * // Creating custom errors
 * import { AppError, ErrorCode } from '@/lib/errors';
 *
 * throw new AppError({
 *   code: ErrorCode.CART_EMPTY,
 *   message: 'Cannot checkout with empty cart',
 *   context: { userId: user.id },
 * });
 */

export {
  ErrorCode,
  ErrorCategory,
  ErrorCodeToCategory,
  getErrorCategory,
  isAuthError,
  isNetworkError,
  isRetryableError,
} from './error-codes';

export {
  ErrorMessages,
  CategoryMessages,
  getErrorMessage,
  getCategoryMessage,
  getLocaleFromNavigator,
  type Locale,
} from './error-messages';

export {
  AppError,
  isAppError,
  formatErrorForDisplay,
  logError,
  type AppErrorOptions,
  type ValidationError,
  type SerializedError,
} from './app-error';
