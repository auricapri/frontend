import logger from '../../config/logger.js';
import { marketplaceConfigsRepository } from '../../repositories/marketplace-configs.repository.js';
import { marketplaceLogsRepository } from '../../repositories/marketplace-logs.repository.js';
import { getMarketplaceCrypto, type MarketplaceCredentials } from './marketplace.crypto.js';
import type {
  MarketplaceConfig,
  MarketplaceProvider,
  TokenResponse,
  ExternalProduct,
  ProductPayload,
  CategoryMapping,
  SyncAction,
} from './marketplace.types.js';

/**
 * Interface that all marketplace provider services must implement.
 */
export interface IMarketplaceProvider {
  readonly code: string;
  readonly name: string;

  // Authentication
  getAuthUrl(redirectUri: string, state?: string, codeChallenge?: string): Promise<string>;
  exchangeCodeForToken(code: string, redirectUri: string, codeVerifier?: string): Promise<TokenResponse>;
  refreshToken(): Promise<TokenResponse>;

  // Products
  createProduct(payload: ProductPayload): Promise<ExternalProduct>;
  updateProduct(externalId: string, payload: ProductPayload): Promise<ExternalProduct>;
  deleteProduct(externalId: string): Promise<void>;
  getProduct(externalId: string): Promise<ExternalProduct | null>;

  // Stock
  updateStock(externalId: string, quantity: number): Promise<void>;
  getStock(externalId: string): Promise<number>;

  // Prices
  updatePrice(externalId: string, price: number): Promise<void>;

  // Utilities
  testConnection(): Promise<boolean>;
  getCategoriesMapping(): Promise<CategoryMapping[]>;
}

/**
 * Abstract base class for marketplace provider implementations.
 * Provides common functionality for authentication, logging, and error handling.
 */
export abstract class MarketplaceBaseService implements IMarketplaceProvider {
  abstract readonly code: string;
  abstract readonly name: string;

  protected config: MarketplaceConfig;
  protected provider: MarketplaceProvider;
  protected credentials: MarketplaceCredentials;
  protected accessToken: string | null = null;

  constructor(config: MarketplaceConfig) {
    if (!config.provider) {
      throw new Error('Config must include provider data');
    }
    this.config = config;
    this.provider = config.provider;

    // Decrypt credentials
    const crypto = getMarketplaceCrypto();
    this.credentials = crypto.decryptCredentials(config.credentials_encrypted);

    // Decrypt access token if available
    if (config.access_token_encrypted) {
      this.accessToken = crypto.decryptToken(config.access_token_encrypted);
    }
  }

  /**
   * Get the base URL for API calls.
   */
  protected get baseUrl(): string {
    return this.provider.base_url;
  }

  /**
   * Check if the current environment is production.
   */
  protected get isProduction(): boolean {
    return this.config.environment === 'production';
  }

  /**
   * Make an HTTP request with automatic token refresh and error handling.
   */
  protected async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    options: {
      body?: unknown;
      headers?: Record<string, string>;
      query?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const startTime = Date.now();

    // Check if token needs refresh
    if (this.config.token_expires_at) {
      const needsRefresh = await marketplaceConfigsRepository.needsTokenRefresh(this.config.id);
      if (needsRefresh && this.config.refresh_token_encrypted) {
        try {
          const tokenResponse = await this.refreshToken();
          this.accessToken = tokenResponse.access_token;
        } catch (error) {
          logger.error(`Failed to refresh token for ${this.code}`, { error, configId: this.config.id });
        }
      }
    }

    // Build URL with query params
    let url = `${this.baseUrl}${endpoint}`;
    if (options.query) {
      const params = new URLSearchParams(options.query);
      url += `?${params.toString()}`;
    }

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders(),
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        const errorBody = await response.text();
        let errorJson: unknown;
        try {
          errorJson = JSON.parse(errorBody);
        } catch {
          errorJson = { message: errorBody };
        }

        throw new MarketplaceApiError(
          `${this.code} API error: ${response.status} ${response.statusText}`,
          response.status,
          errorJson as Record<string, unknown>
        );
      }

      const data = await response.json() as T;

      logger.debug(`${this.code} API request successful`, {
        method,
        endpoint,
        duration,
        status: response.status,
      });

      return data;
    } catch (error) {
      const duration = Date.now() - startTime;

      if (error instanceof MarketplaceApiError) {
        logger.error(`${this.code} API error`, {
          method,
          endpoint,
          duration,
          status: error.statusCode,
          response: error.response,
        });
        throw error;
      }

      logger.error(`${this.code} request failed`, {
        method,
        endpoint,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  /**
   * Get authentication headers for API requests.
   * Override in subclass for provider-specific auth.
   */
  protected getAuthHeaders(): Record<string, string> {
    if (this.accessToken) {
      return { Authorization: `Bearer ${this.accessToken}` };
    }
    return {};
  }

  /**
   * Log a successful sync operation.
   */
  protected async logSuccess(
    action: SyncAction,
    durationMs: number,
    mappingId?: string,
    requestPayload?: Record<string, unknown>,
    responsePayload?: Record<string, unknown>
  ): Promise<void> {
    await marketplaceLogsRepository.logSuccess(
      this.config.id,
      action,
      durationMs,
      mappingId,
      requestPayload,
      responsePayload
    );
  }

  /**
   * Log a failed sync operation.
   */
  protected async logError(
    action: SyncAction,
    error: Error | string,
    durationMs?: number,
    mappingId?: string,
    requestPayload?: Record<string, unknown>,
    responsePayload?: Record<string, unknown>
  ): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : error;
    await marketplaceLogsRepository.logError(
      this.config.id,
      action,
      errorMessage,
      durationMs,
      mappingId,
      requestPayload,
      responsePayload
    );
  }

  /**
   * Update config status after operation.
   */
  protected async updateStatus(
    status: 'connected' | 'disconnected' | 'error',
    message?: string
  ): Promise<void> {
    await marketplaceConfigsRepository.updateStatus(this.config.id, status, message);
  }

  /**
   * Save new tokens after OAuth flow or refresh.
   */
  protected async saveTokens(
    accessToken: string,
    refreshToken?: string,
    expiresIn?: number
  ): Promise<void> {
    let expiresAt: Date | undefined;
    if (expiresIn) {
      expiresAt = new Date(Date.now() + expiresIn * 1000);
    }

    await marketplaceConfigsRepository.updateTokens(
      this.config.id,
      accessToken,
      refreshToken,
      expiresAt
    );

    // Update local state
    this.accessToken = accessToken;
  }

  // Abstract methods that must be implemented by each provider
  abstract getAuthUrl(redirectUri: string, state?: string, codeChallenge?: string): Promise<string>;
  abstract exchangeCodeForToken(code: string, redirectUri: string, codeVerifier?: string): Promise<TokenResponse>;
  abstract refreshToken(): Promise<TokenResponse>;
  abstract createProduct(payload: ProductPayload): Promise<ExternalProduct>;
  abstract updateProduct(externalId: string, payload: ProductPayload): Promise<ExternalProduct>;
  abstract deleteProduct(externalId: string): Promise<void>;
  abstract getProduct(externalId: string): Promise<ExternalProduct | null>;
  abstract updateStock(externalId: string, quantity: number): Promise<void>;
  abstract getStock(externalId: string): Promise<number>;
  abstract updatePrice(externalId: string, price: number): Promise<void>;
  abstract testConnection(): Promise<boolean>;
  abstract getCategoriesMapping(): Promise<CategoryMapping[]>;
}

/**
 * Custom error class for marketplace API errors.
 */
export class MarketplaceApiError extends Error {
  readonly statusCode: number;
  readonly response: Record<string, unknown>;

  constructor(message: string, statusCode: number, response: Record<string, unknown>) {
    super(message);
    this.name = 'MarketplaceApiError';
    this.statusCode = statusCode;
    this.response = response;
  }
}

/**
 * Helper to measure operation duration.
 */
export function measureDuration(startTime: number): number {
  return Date.now() - startTime;
}

export default MarketplaceBaseService;
