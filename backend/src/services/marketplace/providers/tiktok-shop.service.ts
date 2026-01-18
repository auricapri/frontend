import { MarketplaceBaseService, MarketplaceApiError, measureDuration } from '../marketplace.base.js';
import logger from '../../../config/logger.js';
import type {
  MarketplaceConfig,
  TokenResponse,
  ExternalProduct,
  ProductPayload,
  CategoryMapping,
} from '../marketplace.types.js';
import crypto from 'crypto';

/**
 * TikTok Shop API Response Types
 */
interface TikTokTokenResponse {
  code: number;
  message: string;
  data: {
    access_token: string;
    access_token_expire_in: number;
    refresh_token: string;
    refresh_token_expire_in: number;
    open_id: string;
    seller_name: string;
    seller_base_region: string;
  };
}

interface TikTokProduct {
  product_id: string;
  product_name: string;
  description: string;
  category_id: string;
  brand_id?: string;
  images: Array<{ uri: string; height: number; width: number }>;
  skus: Array<{
    id: string;
    seller_sku: string;
    original_price: string;
    stock_infos: Array<{ warehouse_id: string; available_stock: number }>;
  }>;
  product_status: number;
  create_time: number;
  update_time: number;
}

interface TikTokShop {
  shop_id: string;
  shop_name: string;
  region: string;
  seller_type: string;
}

interface TikTokOrder {
  order_id: string;
  order_status: string;
  create_time: number;
  update_time: number;
  buyer_message: string;
  payment_info: {
    total_amount: string;
    currency: string;
  };
  line_items: Array<{
    product_id: string;
    product_name: string;
    sku_id: string;
    quantity: number;
    original_price: string;
  }>;
  shipping_info: {
    shipping_type: string;
    tracking_number?: string;
  };
}

/**
 * TikTok Shop marketplace service implementation.
 * API Docs: https://partner.tiktokshop.com/docv2/page/6507ead7b99d5302be949ba9
 */
export class TikTokShopService extends MarketplaceBaseService {
  readonly code = 'tiktok_shop';
  readonly name = 'TikTok Shop';

  private openId: string | null = null;
  private shopId: string | null = null;

  constructor(config: MarketplaceConfig) {
    super(config);
  }

  /**
   * Generate signature for TikTok Shop API requests.
   * TikTok Shop requires HMAC-SHA256 signature for all requests.
   */
  private generateSignature(path: string, params: Record<string, string>, timestamp: number): string {
    const secret = this.credentials.app_secret;

    // Sort params alphabetically
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}${params[key]}`)
      .join('');

    // Build string to sign: secret + path + sorted_params + secret
    const stringToSign = `${secret}${path}${sortedParams}${secret}`;

    return crypto
      .createHmac('sha256', secret)
      .update(stringToSign)
      .digest('hex');
  }

  /**
   * Make authenticated request to TikTok Shop API.
   */
  protected async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    options: {
      body?: unknown;
      query?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const timestamp = Math.floor(Date.now() / 1000);
    const baseParams: Record<string, string> = {
      app_key: this.credentials.app_key,
      timestamp: String(timestamp),
    };

    if (this.accessToken) {
      baseParams.access_token = this.accessToken;
    }

    if (this.shopId) {
      baseParams.shop_id = this.shopId;
    }

    // Merge with query params
    const allParams = { ...baseParams, ...options.query };

    // Generate signature
    const sign = this.generateSignature(path, allParams, timestamp);
    allParams.sign = sign;

    // Build URL
    const queryString = new URLSearchParams(allParams).toString();
    const url = `${this.baseUrl}${path}?${queryString}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (options.body && (method === 'POST' || method === 'PUT')) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, fetchOptions);
    const data = await response.json() as { code: number; message: string; data: T };

    if (data.code !== 0) {
      throw new MarketplaceApiError(
        `TikTok Shop API error: ${data.message}`,
        data.code,
        data
      );
    }

    return data.data;
  }

  /**
   * Get OAuth authorization URL.
   * @param redirectUri - The redirect URI for OAuth callback
   * @param state - Optional state parameter for CSRF protection
   * @param _codeChallenge - PKCE code_challenge (not used by TikTok Shop)
   */
  async getAuthUrl(redirectUri: string, state?: string, _codeChallenge?: string): Promise<string> {
    const oauth = this.provider.required_fields.oauth;
    if (!oauth) {
      throw new Error('OAuth configuration not found for TikTok Shop');
    }

    const params = new URLSearchParams({
      app_key: this.credentials.app_key,
      state: state || '',
    });

    return `${oauth.auth_url}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token.
   * @param code - The authorization code from OAuth provider
   * @param _redirectUri - The redirect URI (not used by TikTok Shop)
   * @param _codeVerifier - PKCE code_verifier (not used by TikTok Shop)
   */
  async exchangeCodeForToken(code: string, _redirectUri: string, _codeVerifier?: string): Promise<TokenResponse> {
    const startTime = Date.now();

    try {
      const oauth = this.provider.required_fields.oauth;
      if (!oauth) {
        throw new Error('OAuth configuration not found');
      }

      const timestamp = Math.floor(Date.now() / 1000);
      const params: Record<string, string> = {
        app_key: this.credentials.app_key,
        app_secret: this.credentials.app_secret,
        auth_code: code,
        grant_type: 'authorized_code',
      };

      const queryString = new URLSearchParams(params).toString();
      const url = `${oauth.token_url}?${queryString}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json() as { code: number; message: string };
        throw new MarketplaceApiError(
          `Token exchange failed: ${error.message}`,
          response.status,
          error
        );
      }

      const result = await response.json() as TikTokTokenResponse;

      if (result.code !== 0) {
        throw new MarketplaceApiError(
          `Token exchange failed: ${result.message}`,
          result.code,
          result
        );
      }

      const data = result.data;

      // Save tokens
      await this.saveTokens(
        data.access_token,
        data.refresh_token,
        data.access_token_expire_in
      );
      this.openId = data.open_id;

      await this.logSuccess('exchange_token', measureDuration(startTime));
      await this.updateStatus('connected');

      // Get shop info
      await this.getAuthorizedShops();

      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.access_token_expire_in,
        token_type: 'Bearer',
      };
    } catch (error) {
      await this.logError('exchange_token', error as Error, measureDuration(startTime));
      await this.updateStatus('error', (error as Error).message);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token.
   */
  async refreshToken(): Promise<TokenResponse> {
    const startTime = Date.now();

    try {
      const oauth = this.provider.required_fields.oauth;
      if (!oauth) {
        throw new Error('OAuth configuration not found');
      }

      const { getMarketplaceCrypto } = await import('../marketplace.crypto.js');
      const cryptoService = getMarketplaceCrypto();

      if (!this.config.refresh_token_encrypted) {
        throw new Error('No refresh token available');
      }

      const refreshTokenValue = cryptoService.decryptToken(this.config.refresh_token_encrypted);

      const params: Record<string, string> = {
        app_key: this.credentials.app_key,
        app_secret: this.credentials.app_secret,
        refresh_token: refreshTokenValue,
        grant_type: 'refresh_token',
      };

      const queryString = new URLSearchParams(params).toString();
      const url = `${oauth.token_url}?${queryString}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json() as { code: number; message: string };
        throw new MarketplaceApiError(
          `Token refresh failed: ${error.message}`,
          response.status,
          error
        );
      }

      const result = await response.json() as TikTokTokenResponse;

      if (result.code !== 0) {
        throw new MarketplaceApiError(
          `Token refresh failed: ${result.message}`,
          result.code,
          result
        );
      }

      const data = result.data;

      // Save new tokens
      await this.saveTokens(
        data.access_token,
        data.refresh_token,
        data.access_token_expire_in
      );

      await this.logSuccess('refresh_token', measureDuration(startTime));

      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.access_token_expire_in,
        token_type: 'Bearer',
      };
    } catch (error) {
      await this.logError('refresh_token', error as Error, measureDuration(startTime));
      throw error;
    }
  }

  /**
   * Get authorized shops.
   */
  async getAuthorizedShops(): Promise<TikTokShop[]> {
    const result = await this.request<{ shops: TikTokShop[] }>('GET', '/authorization/202309/shops');

    if (result.shops && result.shops.length > 0) {
      // Use first shop as default
      this.shopId = result.shops[0].shop_id;
    }

    return result.shops;
  }

  /**
   * Test connection by fetching shop info.
   */
  async testConnection(): Promise<boolean> {
    const startTime = Date.now();

    try {
      const shops = await this.getAuthorizedShops();

      logger.info('TikTok Shop connection test successful', {
        shopCount: shops.length,
        shops: shops.map(s => ({ id: s.shop_id, name: s.shop_name, region: s.region })),
      });

      await this.logSuccess('test_connection', measureDuration(startTime));
      await this.updateStatus('connected');

      return true;
    } catch (error) {
      await this.logError('test_connection', error as Error, measureDuration(startTime));
      await this.updateStatus('error', (error as Error).message);
      return false;
    }
  }

  /**
   * Get categories mapping for product creation.
   */
  async getCategoriesMapping(): Promise<CategoryMapping[]> {
    try {
      interface CategoryResponse {
        categories: Array<{
          id: string;
          local_name: string;
          parent_id: string;
          is_leaf: boolean;
        }>;
      }

      const result = await this.request<CategoryResponse>('GET', '/product/202309/categories');

      return result.categories.map(cat => ({
        local_id: '',
        external_id: cat.id,
        name: cat.local_name,
        path: [cat.local_name],
      }));
    } catch (error) {
      logger.error('Failed to fetch TikTok Shop categories', { error });
      throw error;
    }
  }

  /**
   * Create a product on TikTok Shop.
   */
  async createProduct(payload: ProductPayload): Promise<ExternalProduct> {
    const startTime = Date.now();

    try {
      // Build TikTok Shop product structure
      const ttProduct = {
        product_name: payload.title.substring(0, 255),
        description: payload.description.substring(0, 10000),
        category_id: payload.category_id,
        images: payload.images.map(url => ({ uri: url })),
        skus: [{
          seller_sku: payload.sku,
          original_price: String(Math.round(payload.price * 100)), // Price in cents
          stock_infos: [{
            available_stock: payload.stock,
          }],
        }],
      };

      interface CreateProductResponse {
        product_id: string;
      }

      const created = await this.request<CreateProductResponse>('POST', '/product/202309/products', {
        body: ttProduct,
      });

      await this.logSuccess('create_product', measureDuration(startTime), undefined, {
        sku: payload.sku,
        title: payload.title,
      }, {
        external_id: created.product_id,
      });

      return {
        id: created.product_id,
        sku: payload.sku,
        url: `https://shop.tiktok.com/view/product/${created.product_id}`,
        title: payload.title,
        price: payload.price,
        stock: payload.stock,
        status: 'pending',
      };
    } catch (error) {
      await this.logError('create_product', error as Error, measureDuration(startTime), undefined, {
        sku: payload.sku,
        title: payload.title,
      });
      throw error;
    }
  }

  /**
   * Update an existing product.
   */
  async updateProduct(externalId: string, payload: ProductPayload): Promise<ExternalProduct> {
    const startTime = Date.now();

    try {
      const updates: Record<string, unknown> = {
        product_id: externalId,
      };

      if (payload.title) {
        updates.product_name = payload.title.substring(0, 255);
      }

      if (payload.description) {
        updates.description = payload.description.substring(0, 10000);
      }

      if (payload.images && payload.images.length > 0) {
        updates.images = payload.images.map(url => ({ uri: url }));
      }

      await this.request('PUT', '/product/202309/products', {
        body: updates,
      });

      await this.logSuccess('update_product', measureDuration(startTime), undefined, {
        external_id: externalId,
        updates: Object.keys(updates),
      });

      return {
        id: externalId,
        url: `https://shop.tiktok.com/view/product/${externalId}`,
        title: payload.title,
        price: payload.price,
        stock: payload.stock,
        status: 'active',
      };
    } catch (error) {
      await this.logError('update_product', error as Error, measureDuration(startTime), undefined, {
        external_id: externalId,
      });
      throw error;
    }
  }

  /**
   * Delete (deactivate) a product.
   */
  async deleteProduct(externalId: string): Promise<void> {
    const startTime = Date.now();

    try {
      await this.request('POST', '/product/202309/products/deactivate', {
        body: {
          product_ids: [externalId],
        },
      });

      await this.logSuccess('delete_product', measureDuration(startTime), undefined, {
        external_id: externalId,
      });
    } catch (error) {
      await this.logError('delete_product', error as Error, measureDuration(startTime), undefined, {
        external_id: externalId,
      });
      throw error;
    }
  }

  /**
   * Get product by external ID.
   */
  async getProduct(externalId: string): Promise<ExternalProduct | null> {
    try {
      const product = await this.request<TikTokProduct>('GET', `/product/202309/products/${externalId}`);

      const firstSku = product.skus?.[0];
      const price = firstSku ? parseFloat(firstSku.original_price) / 100 : 0;
      const stock = firstSku?.stock_infos?.[0]?.available_stock || 0;

      return {
        id: product.product_id,
        url: `https://shop.tiktok.com/view/product/${product.product_id}`,
        title: product.product_name,
        price,
        stock,
        status: product.product_status === 4 ? 'active' : 'inactive',
      };
    } catch (error) {
      if (error instanceof MarketplaceApiError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Update stock quantity.
   */
  async updateStock(externalId: string, quantity: number): Promise<void> {
    const startTime = Date.now();

    try {
      // First get the product to find SKU ID
      const product = await this.getProduct(externalId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Get full product details for SKU ID
      const fullProduct = await this.request<TikTokProduct>('GET', `/product/202309/products/${externalId}`);
      const firstSku = fullProduct.skus?.[0];

      if (!firstSku) {
        throw new Error('No SKU found for product');
      }

      await this.request('POST', '/product/202309/inventory/update', {
        body: {
          product_id: externalId,
          skus: [{
            id: firstSku.id,
            stock_infos: [{
              available_stock: quantity,
            }],
          }],
        },
      });

      await this.logSuccess('update_stock', measureDuration(startTime), undefined, {
        external_id: externalId,
        quantity,
      });
    } catch (error) {
      await this.logError('update_stock', error as Error, measureDuration(startTime), undefined, {
        external_id: externalId,
        quantity,
      });
      throw error;
    }
  }

  /**
   * Get current stock quantity.
   */
  async getStock(externalId: string): Promise<number> {
    const product = await this.getProduct(externalId);
    return product?.stock || 0;
  }

  /**
   * Update product price.
   */
  async updatePrice(externalId: string, price: number): Promise<void> {
    const startTime = Date.now();

    try {
      const fullProduct = await this.request<TikTokProduct>('GET', `/product/202309/products/${externalId}`);
      const firstSku = fullProduct.skus?.[0];

      if (!firstSku) {
        throw new Error('No SKU found for product');
      }

      await this.request('PUT', '/product/202309/products/prices', {
        body: {
          product_id: externalId,
          skus: [{
            id: firstSku.id,
            original_price: String(Math.round(price * 100)),
          }],
        },
      });

      await this.logSuccess('update_price', measureDuration(startTime), undefined, {
        external_id: externalId,
        price,
      });
    } catch (error) {
      await this.logError('update_price', error as Error, measureDuration(startTime), undefined, {
        external_id: externalId,
        price,
      });
      throw error;
    }
  }

  // ============================================
  // ORDERS METHODS
  // ============================================

  /**
   * Get seller's orders.
   */
  async getOrders(params: {
    status?: string;
    since?: Date;
    until?: Date;
    limit?: number;
    offset?: number;
  } = {}): Promise<TikTokOrder[]> {
    const query: Record<string, string> = {
      page_size: String(params.limit || 20),
    };

    if (params.status) {
      query.order_status = params.status;
    }

    if (params.since) {
      query.create_time_ge = String(Math.floor(params.since.getTime() / 1000));
    }

    if (params.until) {
      query.create_time_lt = String(Math.floor(params.until.getTime() / 1000));
    }

    interface OrdersResponse {
      orders: TikTokOrder[];
      total_count: number;
    }

    const response = await this.request<OrdersResponse>('POST', '/order/202309/orders/search', {
      body: query,
    });

    return response.orders;
  }

  /**
   * Get a specific order by ID.
   */
  async getOrder(orderId: string): Promise<TikTokOrder> {
    interface OrderDetailResponse {
      orders: TikTokOrder[];
    }

    const response = await this.request<OrderDetailResponse>('POST', '/order/202309/orders', {
      body: {
        order_ids: [orderId],
      },
    });

    if (!response.orders || response.orders.length === 0) {
      throw new MarketplaceApiError('Order not found', 404, {});
    }

    return response.orders[0];
  }
}

export default TikTokShopService;
