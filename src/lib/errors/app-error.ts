import { ErrorCode, ErrorCategory, getErrorCategory, isRetryableError, isNetworkError, isAuthError } from './error-codes';
import { getErrorMessage, type Locale, getLocaleFromNavigator } from './error-messages';

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface AppErrorOptions {
  code: ErrorCode;
  message: string;
  userMessage?: string;
  context?: Record<string, unknown>;
  cause?: Error | unknown;
  validationErrors?: ValidationError[];
}

export interface SerializedError {
  code: string;
  message: string;
  userMessage: string;
  category: string;
  timestamp: string;
  context?: Record<string, unknown>;
  validationErrors?: ValidationError[];
}

/**
 * Unified Application Error class
 *
 * Provides consistent error handling across the frontend application
 * with support for user-friendly messages, error codes, and categories.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly category: ErrorCategory;
  readonly context?: Record<string, unknown>;
  readonly cause?: Error | unknown;
  readonly validationErrors?: ValidationError[];
  readonly timestamp: Date;
  private readonly _userMessage?: string;

  constructor(options: AppErrorOptions) {
    super(options.message);
    this.name = 'AppError';
    this.code = options.code;
    this.category = getErrorCategory(options.code);
    this._userMessage = options.userMessage;
    this.context = options.context;
    this.cause = options.cause;
    this.validationErrors = options.validationErrors;
    this.timestamp = new Date();

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Get user-friendly message in the specified locale
   */
  getUserMessage(locale?: Locale): string {
    const loc = locale || getLocaleFromNavigator();
    return this._userMessage || getErrorMessage(this.code, loc);
  }

  /**
   * Check if this is a client error (4xx)
   */
  isClientError(): boolean {
    return [
      ErrorCategory.VALIDATION,
      ErrorCategory.AUTH,
      ErrorCategory.AUTHORIZATION,
      ErrorCategory.NOT_FOUND,
      ErrorCategory.CONFLICT,
    ].includes(this.category);
  }

  /**
   * Check if this is a server error (5xx)
   */
  isServerError(): boolean {
    return [
      ErrorCategory.SERVER,
      ErrorCategory.EXTERNAL,
      ErrorCategory.STORAGE,
    ].includes(this.category);
  }

  /**
   * Check if this error is retryable
   */
  isRetryable(): boolean {
    return isRetryableError(this.code);
  }

  /**
   * Check if this is a network error
   */
  isNetwork(): boolean {
    return isNetworkError(this.code);
  }

  /**
   * Check if this is an authentication error
   */
  isAuth(): boolean {
    return isAuthError(this.code);
  }

  /**
   * Serialize error for logging or API response
   */
  toJSON(locale?: Locale): SerializedError {
    return {
      code: this.code,
      message: this.message,
      userMessage: this.getUserMessage(locale),
      category: this.category,
      timestamp: this.timestamp.toISOString(),
      ...(this.context && { context: this.context }),
      ...(this.validationErrors && { validationErrors: this.validationErrors }),
    };
  }

  // ========== Factory Methods ==========

  /**
   * Create from any error type
   */
  static fromError(
    error: unknown,
    defaultCode: ErrorCode = ErrorCode.UNKNOWN_ERROR
  ): AppError {
    // Already an AppError
    if (error instanceof AppError) {
      return error;
    }

    // API response error (from backend)
    if (isApiError(error)) {
      return AppError.fromApiResponse(error);
    }

    // Axios/fetch network errors
    if (isNetworkErrorObject(error)) {
      return new AppError({
        code: getNetworkErrorCode(error),
        message: (error as Error).message || 'Network error',
        cause: error,
      });
    }

    // Standard Error
    if (error instanceof Error) {
      return new AppError({
        code: defaultCode,
        message: error.message,
        cause: error,
      });
    }

    // Unknown error
    return new AppError({
      code: defaultCode,
      message: String(error),
      cause: error,
    });
  }

  /**
   * Create from backend API response
   */
  static fromApiResponse(response: ApiErrorResponse): AppError {
    const errorData = response.response?.data?.error || response.data?.error || response;
    const code = (errorData.code as ErrorCode) || ErrorCode.UNKNOWN_ERROR;

    return new AppError({
      code: Object.values(ErrorCode).includes(code) ? code : ErrorCode.UNKNOWN_ERROR,
      message: errorData.message || 'Unknown error',
      userMessage: errorData.userMessage,
      context: (errorData as { context?: Record<string, unknown> }).context,
      validationErrors: (errorData as { validationErrors?: ValidationError[] }).validationErrors,
      cause: response,
    });
  }

  /**
   * Create a validation error
   */
  static validation(
    message: string,
    errors?: ValidationError[]
  ): AppError {
    return new AppError({
      code: ErrorCode.VALIDATION_ERROR,
      message,
      userMessage: message,
      validationErrors: errors,
    });
  }

  /**
   * Create a not found error
   */
  static notFound(resource: string, id?: string): AppError {
    return new AppError({
      code: ErrorCode.NOT_FOUND,
      message: `${resource} not found${id ? `: ${id}` : ''}`,
      context: { resource, ...(id && { id }) },
    });
  }

  /**
   * Create an unauthorized error
   */
  static unauthorized(message?: string): AppError {
    return new AppError({
      code: ErrorCode.AUTH_TOKEN_MISSING,
      message: message || 'Unauthorized',
    });
  }

  /**
   * Create a forbidden error
   */
  static forbidden(message?: string): AppError {
    return new AppError({
      code: ErrorCode.FORBIDDEN,
      message: message || 'Forbidden',
    });
  }

  /**
   * Create a network error
   */
  static network(message?: string): AppError {
    return new AppError({
      code: ErrorCode.NETWORK_ERROR,
      message: message || 'Network error',
    });
  }
}

// ========== Type Guards and Helpers ==========

interface ApiErrorResponse {
  response?: {
    data?: {
      error?: {
        code?: string;
        message?: string;
        userMessage?: string;
        context?: Record<string, unknown>;
        validationErrors?: ValidationError[];
      };
    };
  };
  data?: {
    error?: {
      code?: string;
      message?: string;
      userMessage?: string;
      context?: Record<string, unknown>;
      validationErrors?: ValidationError[];
    };
  };
  code?: string;
  message?: string;
  userMessage?: string;
}

function isApiError(error: unknown): error is ApiErrorResponse {
  if (!error || typeof error !== 'object') return false;
  const e = error as ApiErrorResponse;
  return !!(
    e.response?.data?.error ||
    e.data?.error ||
    (e.code && e.message)
  );
}

function isNetworkErrorObject(error: unknown): boolean {
  if (!error) return false;
  const errorStr = String(error).toLowerCase();
  const msg = (error as Error)?.message?.toLowerCase() || '';

  return (
    errorStr.includes('network error') ||
    errorStr.includes('failed to fetch') ||
    errorStr.includes('networkerror') ||
    msg.includes('timeout') ||
    msg.includes('econnrefused') ||
    msg.includes('enotfound') ||
    (error as { code?: string })?.code === 'ECONNABORTED' ||
    (error as { code?: string })?.code === 'ERR_NETWORK'
  );
}

function getNetworkErrorCode(error: unknown): ErrorCode {
  const msg = ((error as Error)?.message || '').toLowerCase();

  if (msg.includes('timeout') || (error as { code?: string })?.code === 'ECONNABORTED') {
    return ErrorCode.CONNECTION_TIMEOUT;
  }

  if (msg.includes('offline') || msg.includes('no internet')) {
    return ErrorCode.NO_INTERNET;
  }

  return ErrorCode.NETWORK_ERROR;
}

/**
 * Check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Utility to format error for display
 */
export function formatErrorForDisplay(error: unknown, locale?: Locale): string {
  if (error instanceof AppError) {
    return error.getUserMessage(locale);
  }
  return AppError.fromError(error).getUserMessage(locale);
}

/**
 * Utility for logging errors
 */
export function logError(error: unknown, context?: string): void {
  const appError = error instanceof AppError ? error : AppError.fromError(error);
  const contextStr = context ? `[${context}] ` : '';

  console.error(
    `${contextStr}AppError [${appError.code}]: ${appError.message}`,
    appError.toJSON()
  );

  if (appError.cause) {
    console.error('Caused by:', appError.cause);
  }
}
