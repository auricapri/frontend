import { MarketplaceBaseService, MarketplaceApiError, measureDuration } from '../marketplace.base.js';
import logger from '../../../config/logger.js';
import type {
  MarketplaceConfig,
  TokenResponse,
  ExternalProduct,
  ProductPayload,
  CategoryMapping,
  MLVariation,
  MLProductPayload,
} from '../marketplace.types.js';

/**
 * Mercado Livre API Response Types
 */
interface MLTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  user_id: number;
  refresh_token: string;
}

interface MLProduct {
  id: string;
  site_id: string;
  title: string;
  price: number;
  currency_id: string;
  available_quantity: number;
  sold_quantity: number;
  listing_type_id: string;
  condition: string;
  permalink: string;
  status: string;
  pictures: Array<{ id: string; url: string; secure_url: string }>;
  attributes: Array<{ id: string; name: string; value_name: string }>;
  variations?: Array<{
    id: number;
    price: number;
    available_quantity: number;
    attribute_combinations: Array<{ id: string; name: string; value_name: string }>;
  }>;
}

interface MLCategory {
  id: string;
  name: string;
  path_from_root: Array<{ id: string; name: string }>;
  children_categories: Array<{ id: string; name: string }>;
}

interface MLUser {
  id: number;
  nickname: string;
  site_id: string;
  status: { site_status: string };
}

/**
 * Mercado Livre marketplace service implementation.
 * API Docs: https://developers.mercadolivre.com.br/pt_br/api-docs-pt-br
 */
export class MercadoLivreService extends MarketplaceBaseService {
  readonly code = 'mercado_livre';
  readonly name = 'Mercado Livre';

  private userId: number | null = null;

  constructor(config: MarketplaceConfig) {
    super(config);
  }

  /**
   * Get OAuth authorization URL.
   * @param redirectUri - The redirect URI for OAuth callback
   * @param state - Optional state parameter for CSRF protection
   * @param codeChallenge - PKCE code_challenge (SHA256 hash of code_verifier, base64url encoded)
   */
  async getAuthUrl(redirectUri: string, state?: string, codeChallenge?: string): Promise<string> {
    const oauth = this.provider.required_fields.oauth;
    if (!oauth) {
      throw new Error('OAuth configuration not found for Mercado Livre');
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.credentials.client_id,
      redirect_uri: redirectUri,
    });

    if (state) {
      params.set('state', state);
    }

    // PKCE is required by Mercado Livre
    if (codeChallenge) {
      params.set('code_challenge', codeChallenge);
      params.set('code_challenge_method', 'S256');
    }

    return `${oauth.auth_url}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token.
   * @param code - The authorization code from OAuth provider
   * @param redirectUri - The redirect URI used in authorization
   * @param codeVerifier - PKCE code_verifier (required by Mercado Livre)
   */
  async exchangeCodeForToken(code: string, redirectUri: string, codeVerifier?: string): Promise<TokenResponse> {
    const startTime = Date.now();

    try {
      const oauth = this.provider.required_fields.oauth;
      if (!oauth) {
        throw new Error('OAuth configuration not found');
      }

      const tokenParams: Record<string, string> = {
        grant_type: 'authorization_code',
        client_id: this.credentials.client_id,
        client_secret: this.credentials.client_secret,
        code,
        redirect_uri: redirectUri,
      };

      // PKCE code_verifier is required by Mercado Livre
      if (codeVerifier) {
        tokenParams.code_verifier = codeVerifier;
      }

      const response = await fetch(oauth.token_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(tokenParams),
      });

      if (!response.ok) {
        const error = await response.json() as { error: string; message: string };
        throw new MarketplaceApiError(
          `Token exchange failed: ${error.message || error.error}`,
          response.status,
          error
        );
      }

      const data = await response.json() as MLTokenResponse;

      // Save tokens
      await this.saveTokens(data.access_token, data.refresh_token, data.expires_in);
      this.userId = data.user_id;

      await this.logSuccess('refresh_token', measureDuration(startTime));
      await this.updateStatus('connected');

      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        token_type: data.token_type,
      };
    } catch (error) {
      await this.logError('refresh_token', error as Error, measureDuration(startTime));
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

      // Get refresh token from config
      const { getMarketplaceCrypto } = await import('../marketplace.crypto.js');
      const crypto = getMarketplaceCrypto();

      if (!this.config.refresh_token_encrypted) {
        throw new Error('No refresh token available');
      }

      const refreshToken = crypto.decryptToken(this.config.refresh_token_encrypted);

      const response = await fetch(oauth.token_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.credentials.client_id,
          client_secret: this.credentials.client_secret,
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        const error = await response.json() as { error: string; message: string };
        throw new MarketplaceApiError(
          `Token refresh failed: ${error.message || error.error}`,
          response.status,
          error
        );
      }

      const data = await response.json() as MLTokenResponse;

      // Save new tokens
      await this.saveTokens(data.access_token, data.refresh_token, data.expires_in);

      await this.logSuccess('refresh_token', measureDuration(startTime));

      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        token_type: data.token_type,
      };
    } catch (error) {
      await this.logError('refresh_token', error as Error, measureDuration(startTime));
      throw error;
    }
  }

  /**
   * Test connection by fetching user info.
   */
  async testConnection(): Promise<boolean> {
    const startTime = Date.now();

    try {
      const user = await this.request<MLUser>('GET', '/users/me');
      this.userId = user.id;

      logger.info('Mercado Livre connection test successful', {
        userId: user.id,
        nickname: user.nickname,
        siteId: user.site_id,
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
      // Get root categories for Brazil (MLB)
      const categories = await this.request<MLCategory[]>('GET', '/sites/MLB/categories');

      return categories.map(cat => ({
        local_id: '',
        external_id: cat.id,
        name: cat.name,
        path: [cat.name],
      }));
    } catch (error) {
      logger.error('Failed to fetch ML categories', { error });
      throw error;
    }
  }

  /**
   * Create a product on Mercado Livre.
   * Supports products with variations (sizes, colors).
   */
  async createProduct(payload: ProductPayload): Promise<ExternalProduct> {
    const startTime = Date.now();

    try {
      // Build base ML product structure
      const mlProduct: Record<string, unknown> = {
        title: payload.title.substring(0, 60), // ML has 60 char limit
        category_id: payload.category_id || 'MLB1000', // Default category
        currency_id: 'BRL',
        buying_mode: 'buy_it_now',
        condition: 'new',
        listing_type_id: 'gold_special', // Premium listing
        description: { plain_text: payload.description },
        pictures: payload.images.map(url => ({ source: url })),
        attributes: Object.entries(payload.attributes || {}).map(([key, value]) => ({
          id: key,
          value_name: String(value),
        })),
      };

      // Check if product has variations
      if (payload.variants && payload.variants.length > 0) {
        // Build ML variations array
        const variations: MLVariation[] = payload.variants.map(variant => ({
          attribute_combinations: Object.entries(variant.attributes).map(([key, value]) => ({
            id: key.toUpperCase(), // ML expects uppercase IDs like 'SIZE', 'COLOR'
            value_name: String(value),
          })),
          price: variant.price,
          available_quantity: variant.stock,
          seller_custom_field: variant.sku, // Store our SKU for reference
        }));

        mlProduct.variations = variations;
        // For products with variations, price and quantity come from variations
        mlProduct.price = variations[0].price;
        mlProduct.available_quantity = variations.reduce((sum, v) => sum + v.available_quantity, 0);
      } else {
        // Product without variations
        mlProduct.price = payload.price;
        mlProduct.available_quantity = payload.stock;
        mlProduct.seller_custom_field = payload.sku;
      }

      const created = await this.request<MLProduct>('POST', '/items', {
        body: mlProduct,
      });

      // Log variation IDs for future reference
      const variationIds = created.variations?.map(v => ({
        ml_id: v.id,
        sku: v.attribute_combinations.map(a => a.value_name).join('-'),
      }));

      await this.logSuccess('create_product', measureDuration(startTime), undefined, {
        sku: payload.sku,
        title: payload.title,
        has_variations: !!payload.variants?.length,
        variation_count: payload.variants?.length || 0,
      }, {
        external_id: created.id,
        permalink: created.permalink,
        variation_ids: variationIds,
      });

      return {
        id: created.id,
        sku: payload.sku,
        url: created.permalink,
        title: created.title,
        price: created.price,
        stock: created.available_quantity,
        status: created.status,
      };
    } catch (error) {
      await this.logError('create_product', error as Error, measureDuration(startTime), undefined, {
        sku: payload.sku,
        title: payload.title,
        has_variations: !!payload.variants?.length,
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
      const updates: Record<string, unknown> = {};

      if (payload.title) {
        updates.title = payload.title.substring(0, 60);
      }

      if (payload.price !== undefined) {
        updates.price = payload.price;
      }

      if (payload.stock !== undefined) {
        updates.available_quantity = payload.stock;
      }

      if (payload.description) {
        // Description update requires separate endpoint
        await this.request('PUT', `/items/${externalId}/description`, {
          body: { plain_text: payload.description },
        });
      }

      const updated = await this.request<MLProduct>('PUT', `/items/${externalId}`, {
        body: updates,
      });

      await this.logSuccess('update_product', measureDuration(startTime), undefined, {
        external_id: externalId,
        updates: Object.keys(updates),
      });

      return {
        id: updated.id,
        url: updated.permalink,
        title: updated.title,
        price: updated.price,
        stock: updated.available_quantity,
        status: updated.status,
      };
    } catch (error) {
      await this.logError('update_product', error as Error, measureDuration(startTime), undefined, {
        external_id: externalId,
      });
      throw error;
    }
  }

  /**
   * Delete (close) a product.
   */
  async deleteProduct(externalId: string): Promise<void> {
    const startTime = Date.now();

    try {
      // ML doesn't allow deletion, only closing
      await this.request('PUT', `/items/${externalId}`, {
        body: { status: 'closed' },
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
      const product = await this.request<MLProduct>('GET', `/items/${externalId}`);

      return {
        id: product.id,
        url: product.permalink,
        title: product.title,
        price: product.price,
        stock: product.available_quantity,
        status: product.status,
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
      await this.request('PUT', `/items/${externalId}`, {
        body: { available_quantity: quantity },
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
      await this.request('PUT', `/items/${externalId}`, {
        body: { price },
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

  /**
   * Pause product listing.
   */
  async pauseProduct(externalId: string): Promise<void> {
    await this.request('PUT', `/items/${externalId}`, {
      body: { status: 'paused' },
    });
  }

  /**
   * Activate product listing.
   */
  async activateProduct(externalId: string): Promise<void> {
    await this.request('PUT', `/items/${externalId}`, {
      body: { status: 'active' },
    });
  }

  /**
   * Get user's seller reputation.
   */
  async getSellerReputation(): Promise<{
    level: string;
    sales: number;
    rating: number;
  }> {
    if (!this.userId) {
      const user = await this.request<MLUser>('GET', '/users/me');
      this.userId = user.id;
    }

    interface UserReputation {
      seller_reputation: {
        level_id: string;
        transactions: { total: number };
        metrics: { rating: { average: number } };
      };
    }

    const user = await this.request<UserReputation>('GET', `/users/${this.userId}`);

    return {
      level: user.seller_reputation.level_id,
      sales: user.seller_reputation.transactions.total,
      rating: user.seller_reputation.metrics.rating.average,
    };
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
  } = {}): Promise<MLOrder[]> {
    if (!this.userId) {
      const user = await this.request<MLUser>('GET', '/users/me');
      this.userId = user.id;
    }

    const query: Record<string, string> = {
      seller: String(this.userId),
      sort: 'date_desc',
    };

    if (params.status) query.order__status = params.status;
    if (params.since) query['order.date_created.from'] = params.since.toISOString();
    if (params.until) query['order.date_created.to'] = params.until.toISOString();
    if (params.limit) query.limit = String(params.limit);
    if (params.offset) query.offset = String(params.offset);

    const response = await this.request<{ results: MLOrder[] }>('GET', '/orders/search', { query });
    return response.results;
  }

  /**
   * Get a specific order by ID.
   */
  async getOrder(orderId: string): Promise<MLOrder> {
    return this.request<MLOrder>('GET', `/orders/${orderId}`);
  }

  // ============================================
  // QUESTIONS METHODS
  // ============================================

  /**
   * Get questions for seller's products.
   */
  async getQuestions(params: {
    status?: 'UNANSWERED' | 'ANSWERED';
    itemId?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<MLQuestion[]> {
    if (!this.userId) {
      const user = await this.request<MLUser>('GET', '/users/me');
      this.userId = user.id;
    }

    const query: Record<string, string> = {
      seller_id: String(this.userId),
    };

    if (params.status) query.status = params.status;
    if (params.itemId) query.item = params.itemId;
    if (params.limit) query.limit = String(params.limit);
    if (params.offset) query.offset = String(params.offset);

    const response = await this.request<{ questions: MLQuestion[] }>('GET', '/questions/search', { query });
    return response.questions;
  }

  /**
   * Get a specific question by ID.
   */
  async getQuestion(questionId: string): Promise<MLQuestion> {
    return this.request<MLQuestion>('GET', `/questions/${questionId}`);
  }

  /**
   * Answer a question.
   */
  async answerQuestion(questionId: string, answer: string): Promise<void> {
    const startTime = Date.now();

    try {
      await this.request('POST', `/answers`, {
        body: {
          question_id: parseInt(questionId),
          text: answer,
        },
      });

      await this.logSuccess('answer_question', measureDuration(startTime), undefined, {
        question_id: questionId,
      });
    } catch (error) {
      await this.logError('answer_question', error as Error, measureDuration(startTime), undefined, {
        question_id: questionId,
      });
      throw error;
    }
  }

  /**
   * Delete a question.
   */
  async deleteQuestion(questionId: string): Promise<void> {
    await this.request('DELETE', `/questions/${questionId}`);
  }

  // ============================================
  // SHIPPING METHODS
  // ============================================

  /**
   * Get shipment details.
   */
  async getShipmentDetails(shipmentId: string): Promise<MLShipment> {
    return this.request<MLShipment>('GET', `/shipments/${shipmentId}`);
  }

  /**
   * Update shipment tracking number.
   */
  async updateShipmentTracking(
    shipmentId: string,
    trackingNumber: string,
    carrier?: string
  ): Promise<void> {
    const startTime = Date.now();

    try {
      await this.request('PUT', `/shipments/${shipmentId}`, {
        body: {
          tracking_number: trackingNumber,
          service_id: carrier,
        },
      });

      await this.logSuccess('update_shipment', measureDuration(startTime), undefined, {
        shipment_id: shipmentId,
        tracking_number: trackingNumber,
      });
    } catch (error) {
      await this.logError('update_shipment', error as Error, measureDuration(startTime), undefined, {
        shipment_id: shipmentId,
      });
      throw error;
    }
  }

  /**
   * Get shipping label PDF.
   */
  async getShippingLabel(shipmentId: string): Promise<{ data: Buffer; contentType: string }> {
    const url = `${this.baseUrl}/shipment_labels?shipment_ids=${shipmentId}&response_type=pdf`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: 'application/pdf',
      },
    });

    if (!response.ok) {
      throw new MarketplaceApiError(
        `Failed to get shipping label: ${response.status}`,
        response.status,
        {}
      );
    }

    const buffer = await response.arrayBuffer();
    return {
      data: Buffer.from(buffer),
      contentType: 'application/pdf',
    };
  }

  /**
   * Get shipping history for a shipment.
   */
  async getShippingHistory(shipmentId: string): Promise<ShipmentEvent[]> {
    const shipment = await this.getShipmentDetails(shipmentId);
    return shipment.status_history || [];
  }

  // ============================================
  // METRICS METHODS
  // ============================================

  /**
   * Get sales metrics.
   */
  async getSalesMetrics(period: 'day' | 'week' | 'month' = 'month'): Promise<SalesMetrics> {
    if (!this.userId) {
      const user = await this.request<MLUser>('GET', '/users/me');
      this.userId = user.id;
    }

    // Calculate date range based on period
    const now = new Date();
    const since = new Date();

    switch (period) {
      case 'day':
        since.setDate(now.getDate() - 1);
        break;
      case 'week':
        since.setDate(now.getDate() - 7);
        break;
      case 'month':
        since.setMonth(now.getMonth() - 1);
        break;
    }

    // Get orders for the period
    const orders = await this.getOrders({
      since,
      until: now,
      status: 'paid',
    });

    // Calculate metrics
    const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
    const totalFees = orders.reduce((sum, order) => sum + (order.fee_amount || 0), 0);
    const totalUnits = orders.reduce((sum, order) =>
      sum + order.order_items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

    return {
      period,
      total_orders: orders.length,
      total_revenue: totalRevenue,
      total_fees: totalFees,
      total_units: totalUnits,
      average_order_value: orders.length > 0 ? totalRevenue / orders.length : 0,
      since: since.toISOString(),
      until: now.toISOString(),
    };
  }

  /**
   * Get visits metrics for a product.
   */
  async getVisitsMetrics(productId?: string, period: 'day' | 'week' | 'month' = 'week'): Promise<VisitMetrics> {
    if (!this.userId) {
      const user = await this.request<MLUser>('GET', '/users/me');
      this.userId = user.id;
    }

    const now = new Date();
    const since = new Date();

    switch (period) {
      case 'day':
        since.setDate(now.getDate() - 1);
        break;
      case 'week':
        since.setDate(now.getDate() - 7);
        break;
      case 'month':
        since.setMonth(now.getMonth() - 1);
        break;
    }

    const query: Record<string, string> = {
      date_from: since.toISOString().split('T')[0],
      date_to: now.toISOString().split('T')[0],
    };

    if (productId) {
      query.ids = productId;
    }

    interface MLVisitsResponse {
      total_visits: number;
      results: Array<{
        item_id: string;
        total_visits: number;
        date_range: { from: string; to: string };
      }>;
    }

    const response = await this.request<MLVisitsResponse>(
      'GET',
      `/users/${this.userId}/items_visits`,
      { query }
    );

    return {
      period,
      total_visits: response.total_visits,
      items: response.results.map(r => ({
        item_id: r.item_id,
        visits: r.total_visits,
      })),
      since: since.toISOString(),
      until: now.toISOString(),
    };
  }

  /**
   * Get full seller metrics including reputation.
   */
  async getFullMetrics(): Promise<FullSellerMetrics> {
    const [reputation, salesDay, salesWeek, salesMonth, visitsWeek] = await Promise.all([
      this.getSellerReputation(),
      this.getSalesMetrics('day'),
      this.getSalesMetrics('week'),
      this.getSalesMetrics('month'),
      this.getVisitsMetrics(undefined, 'week'),
    ]);

    return {
      reputation,
      sales: {
        day: salesDay,
        week: salesWeek,
        month: salesMonth,
      },
      visits: visitsWeek,
    };
  }
}

// ============================================
// ADDITIONAL TYPES
// ============================================

interface MLOrder {
  id: number;
  status: string;
  date_created: string;
  date_closed?: string;
  buyer: {
    id: number;
    nickname: string;
    email?: string;
  };
  order_items: Array<{
    item: { id: string; title: string; seller_sku?: string };
    quantity: number;
    unit_price: number;
  }>;
  shipping: { id: number; status: string };
  total_amount: number;
  fee_amount?: number;
}

interface MLQuestion {
  id: number;
  item_id: string;
  text: string;
  status: string;
  date_created: string;
  from: { id: number; nickname: string };
  answer?: {
    text: string;
    date_created: string;
  };
}

interface MLShipment {
  id: number;
  status: string;
  tracking_number?: string;
  tracking_method?: string;
  status_history?: ShipmentEvent[];
  receiver_address?: {
    city: { name: string };
    state: { name: string };
    zip_code: string;
    street_name: string;
    street_number: string;
  };
}

interface ShipmentEvent {
  status: string;
  date: string;
  message?: string;
}

interface SalesMetrics {
  period: string;
  total_orders: number;
  total_revenue: number;
  total_fees: number;
  total_units: number;
  average_order_value: number;
  since: string;
  until: string;
}

interface VisitMetrics {
  period: string;
  total_visits: number;
  items: Array<{ item_id: string; visits: number }>;
  since: string;
  until: string;
}

interface FullSellerMetrics {
  reputation: { level: string; sales: number; rating: number };
  sales: {
    day: SalesMetrics;
    week: SalesMetrics;
    month: SalesMetrics;
  };
  visits: VisitMetrics;
}

export default MercadoLivreService;
