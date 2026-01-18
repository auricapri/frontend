import logger from '../../config/logger.js';
import { marketplaceProvidersRepository } from '../../repositories/marketplace-providers.repository.js';
import { marketplaceConfigsRepository } from '../../repositories/marketplace-configs.repository.js';
import { marketplaceMappingsRepository } from '../../repositories/marketplace-mappings.repository.js';
import { marketplaceLogsRepository } from '../../repositories/marketplace-logs.repository.js';
import { getProductsRepository } from '../../repositories/products.repository.js';
import type { IMarketplaceProvider } from './marketplace.base.js';
import type {
  MarketplaceConfig,
  MarketplaceProvider,
  ProductPayload,
  SyncResult,
  MarketplaceProductMapping,
} from './marketplace.types.js';

// Import provider implementations
import { MercadoLivreService } from './providers/mercado-livre.service.js';
import { TikTokShopService } from './providers/tiktok-shop.service.js';

/**
 * Provider factory - maps provider codes to their service implementations.
 */
const PROVIDER_FACTORIES: Record<string, new (config: MarketplaceConfig) => IMarketplaceProvider> = {
  'mercado_livre': MercadoLivreService,
  'tiktok_shop': TikTokShopService,
  // Add more providers as they're implemented:
  // shopee: ShopeeService,
  // aliexpress: AliExpressService,
  // etc.
};

/**
 * Orchestrates all marketplace operations across multiple providers.
 */
export class MarketplaceOrchestrator {
  private providers: Map<string, IMarketplaceProvider> = new Map();
  private initialized = false;

  /**
   * Initialize all connected marketplace providers.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const configs = await marketplaceConfigsRepository.getAllConnected();

      for (const config of configs) {
        try {
          const provider = this.createProvider(config);
          if (provider) {
            this.providers.set(config.id, provider);
            logger.info(`Initialized marketplace provider: ${config.provider?.name}`, {
              configId: config.id,
              providerCode: config.provider?.code,
            });
          }
        } catch (error) {
          logger.error(`Failed to initialize provider: ${config.provider?.name}`, {
            configId: config.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      this.initialized = true;
      logger.info(`MarketplaceOrchestrator initialized with ${this.providers.size} providers`);
    } catch (error) {
      logger.error('Failed to initialize MarketplaceOrchestrator', { error });
      throw error;
    }
  }

  /**
   * Create a provider instance from config.
   */
  private createProvider(config: MarketplaceConfig): IMarketplaceProvider | null {
    const providerCode = config.provider?.code;
    if (!providerCode) {
      logger.warn('Config missing provider code', { configId: config.id });
      return null;
    }

    const Factory = PROVIDER_FACTORIES[providerCode];
    if (!Factory) {
      logger.warn(`No implementation for provider: ${providerCode}`, { configId: config.id });
      return null;
    }

    return new Factory(config);
  }

  /**
   * Get a provider by config ID.
   */
  async getProvider(configId: string): Promise<IMarketplaceProvider | null> {
    // Check cache first
    if (this.providers.has(configId)) {
      return this.providers.get(configId)!;
    }

    // Load config and create provider
    const config = await marketplaceConfigsRepository.getById(configId);
    if (!config) return null;

    const provider = this.createProvider(config);
    if (provider) {
      this.providers.set(configId, provider);
    }

    return provider;
  }

  /**
   * Get OAuth authorization URL for a config.
   * @param configId - The config ID
   * @param redirectUri - The redirect URI for OAuth callback
   * @param codeChallenge - PKCE code_challenge (SHA256 hash of code_verifier, base64url encoded)
   * @param codeVerifier - PKCE code_verifier (will be stored in state for token exchange)
   */
  async getAuthUrl(
    configId: string,
    redirectUri: string,
    codeChallenge?: string,
    codeVerifier?: string
  ): Promise<string> {
    const config = await marketplaceConfigsRepository.getById(configId);
    if (!config) {
      throw new Error('Config not found');
    }

    const provider = this.createProvider(config);
    if (!provider) {
      throw new Error(`No implementation for provider: ${config.provider?.code}`);
    }

    // Include redirectUri and codeVerifier in state (codeVerifier needed for token exchange)
    const stateData: { configId: string; redirectUri: string; codeVerifier?: string } = {
      configId,
      redirectUri,
    };
    if (codeVerifier) {
      stateData.codeVerifier = codeVerifier;
    }
    const state = Buffer.from(JSON.stringify(stateData)).toString('base64');

    return provider.getAuthUrl(redirectUri, state, codeChallenge);
  }

  /**
   * Handle OAuth callback and exchange code for tokens.
   * @param configId - The config ID
   * @param code - The authorization code from OAuth provider
   * @param redirectUri - The redirect URI used in authorization
   * @param codeVerifier - PKCE code_verifier (required by some providers like Mercado Livre)
   */
  async handleOAuthCallback(
    configId: string,
    code: string,
    redirectUri: string,
    codeVerifier?: string
  ): Promise<void> {
    const config = await marketplaceConfigsRepository.getById(configId);
    if (!config) {
      throw new Error('Config not found');
    }

    const provider = this.createProvider(config);
    if (!provider) {
      throw new Error(`No implementation for provider: ${config.provider?.code}`);
    }

    await provider.exchangeCodeForToken(code, redirectUri, codeVerifier);

    // Cache the provider
    this.providers.set(configId, provider);
  }

  /**
   * Test connection for a config.
   */
  async testConnection(configId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const provider = await this.getProvider(configId);
      if (!provider) {
        return { success: false, message: 'Provider not configured or not supported' };
      }

      const success = await provider.testConnection();
      return { success, message: success ? 'Connection successful' : 'Connection failed' };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Sync a product to all connected marketplaces.
   */
  async syncProduct(productId: string, action: 'create' | 'update'): Promise<SyncResult[]> {
    const results: SyncResult[] = [];

    try {
      const productsRepo = getProductsRepository();
      const product = await productsRepo.getById(productId);

      if (!product) {
        logger.warn('Product not found for sync', { productId });
        return results;
      }

      const connectedConfigs = await marketplaceConfigsRepository.getAllConnected();

      for (const config of connectedConfigs) {
        const startTime = Date.now();
        const providerCode = config.provider?.code || 'unknown';

        try {
          const provider = await this.getProvider(config.id);
          if (!provider) {
            results.push({
              provider: providerCode,
              status: 'skipped',
              error: 'Provider not implemented',
            });
            continue;
          }

          // Get or create mapping
          let mapping = await marketplaceMappingsRepository.getByProductAndConfig(
            config.id,
            productId
          );

          // Build product payload
          const payload = await this.buildProductPayload(product, config);

          if (action === 'create' || !mapping?.external_product_id) {
            // Create new product on marketplace
            const external = await provider.createProduct(payload);

            // Create or update mapping
            if (mapping) {
              await marketplaceMappingsRepository.markSynced(
                mapping.id,
                external.id,
                external.url,
                external.price,
                external.stock
              );
            } else {
              await marketplaceMappingsRepository.create({
                config_id: config.id,
                product_id: productId,
                external_product_id: external.id,
                external_url: external.url,
                marketplace_price: external.price,
                marketplace_stock: external.stock,
              });
            }

            results.push({
              provider: providerCode,
              status: 'success',
              external_id: external.id,
              duration_ms: Date.now() - startTime,
            });
          } else {
            // Update existing product
            const external = await provider.updateProduct(mapping.external_product_id, payload);

            await marketplaceMappingsRepository.markSynced(
              mapping.id,
              external.id,
              external.url,
              external.price,
              external.stock
            );

            results.push({
              provider: providerCode,
              status: 'success',
              external_id: external.id,
              duration_ms: Date.now() - startTime,
            });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);

          // Update mapping with error
          const mapping = await marketplaceMappingsRepository.getByProductAndConfig(
            config.id,
            productId
          );
          if (mapping) {
            await marketplaceMappingsRepository.updateSyncStatus(mapping.id, 'error', errorMessage);
          }

          results.push({
            provider: providerCode,
            status: 'error',
            error: errorMessage,
            duration_ms: Date.now() - startTime,
          });

          logger.error(`Failed to sync product to ${providerCode}`, {
            productId,
            configId: config.id,
            error: errorMessage,
          });
        }
      }
    } catch (error) {
      logger.error('Failed to sync product', { productId, error });
    }

    return results;
  }

  /**
   * Sync stock for a product variant to all marketplaces.
   */
  async syncStockByVariant(variantId: string, quantity?: number): Promise<SyncResult[]> {
    const results: SyncResult[] = [];

    try {
      const productsRepo = getProductsRepository();
      const variant = await productsRepo.getVariantById(variantId);

      if (!variant) {
        logger.warn('Variant not found for stock sync', { variantId });
        return results;
      }

      // Use provided quantity or fall back to variant stock
      const stockQuantity = quantity ?? variant.stock_quantity ?? 0;

      // Get all mappings for this variant
      const mappings = await marketplaceMappingsRepository.findAll({
        variant_id: variantId,
        sync_status: 'synced',
      });

      for (const mapping of mappings) {
        const startTime = Date.now();
        const providerCode = mapping.config?.provider?.code || 'unknown';

        try {
          if (!mapping.external_product_id) {
            results.push({
              provider: providerCode,
              status: 'skipped',
              error: 'No external product ID',
            });
            continue;
          }

          const provider = await this.getProvider(mapping.config_id);
          if (!provider) {
            results.push({
              provider: providerCode,
              status: 'skipped',
              error: 'Provider not available',
            });
            continue;
          }

          await provider.updateStock(mapping.external_product_id, stockQuantity);

          await marketplaceMappingsRepository.update(mapping.id, {
            marketplace_stock: stockQuantity,
            sync_status: 'synced',
          });

          results.push({
            provider: providerCode,
            status: 'success',
            external_id: mapping.external_product_id,
            duration_ms: Date.now() - startTime,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);

          await marketplaceMappingsRepository.updateSyncStatus(mapping.id, 'error', errorMessage);

          results.push({
            provider: providerCode,
            status: 'error',
            error: errorMessage,
            duration_ms: Date.now() - startTime,
          });
        }
      }
    } catch (error) {
      logger.error('Failed to sync stock by variant', { variantId, error });
    }

    return results;
  }

  /**
   * Delete a product from all marketplaces.
   */
  async deleteProduct(productId: string): Promise<SyncResult[]> {
    const results: SyncResult[] = [];

    try {
      // Get all mappings for this product
      const mappings = await marketplaceMappingsRepository.findAll({ product_id: productId });

      for (const mapping of mappings) {
        const startTime = Date.now();
        const providerCode = mapping.config?.provider?.code || 'unknown';

        try {
          if (!mapping.external_product_id) {
            // Just delete the mapping if no external product
            await marketplaceMappingsRepository.delete(mapping.id);
            results.push({
              provider: providerCode,
              status: 'success',
              duration_ms: Date.now() - startTime,
            });
            continue;
          }

          const provider = await this.getProvider(mapping.config_id);
          if (!provider) {
            // Can't delete from marketplace but remove local mapping
            await marketplaceMappingsRepository.delete(mapping.id);
            results.push({
              provider: providerCode,
              status: 'skipped',
              error: 'Provider not available',
            });
            continue;
          }

          // Delete from marketplace
          await provider.deleteProduct(mapping.external_product_id);

          // Delete local mapping
          await marketplaceMappingsRepository.delete(mapping.id);

          // Log successful deletion
          await marketplaceLogsRepository.create({
            config_id: mapping.config_id,
            mapping_id: mapping.id,
            action: 'delete_product',
            status: 'success',
            request_payload: { product_id: productId, external_id: mapping.external_product_id },
            duration_ms: Date.now() - startTime,
          });

          results.push({
            provider: providerCode,
            status: 'success',
            external_id: mapping.external_product_id,
            duration_ms: Date.now() - startTime,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);

          // Log the error
          await marketplaceLogsRepository.create({
            config_id: mapping.config_id,
            mapping_id: mapping.id,
            action: 'delete_product',
            status: 'error',
            error_message: errorMessage,
            duration_ms: Date.now() - startTime,
          });

          // Still delete the local mapping to avoid orphans
          await marketplaceMappingsRepository.delete(mapping.id);

          results.push({
            provider: providerCode,
            status: 'error',
            error: errorMessage,
            duration_ms: Date.now() - startTime,
          });

          logger.error(`Failed to delete product from ${providerCode}`, {
            productId,
            externalId: mapping.external_product_id,
            error: errorMessage,
          });
        }
      }

      logger.info('Product deletion sync completed', { productId, results });
    } catch (error) {
      logger.error('Failed to delete product from marketplaces', { productId, error });
    }

    return results;
  }

  /**
   * Sync all pending products.
   */
  async syncPending(configId?: string): Promise<SyncResult[]> {
    const results: SyncResult[] = [];

    try {
      const pendingMappings = await marketplaceMappingsRepository.getPendingSync(configId);

      for (const mapping of pendingMappings) {
        const syncResults = await this.syncProduct(mapping.product_id, 'update');
        results.push(...syncResults);
      }
    } catch (error) {
      logger.error('Failed to sync pending products', { configId, error });
    }

    return results;
  }

  /**
   * Calculate marketplace price for a product.
   */
  async calculateMarketplacePrice(
    productId: string,
    variantId: string | null,
    configId: string
  ): Promise<number> {
    const config = await marketplaceConfigsRepository.getById(configId);
    if (!config) {
      throw new Error('Config not found');
    }

    const productsRepo = getProductsRepository();

    // Get variant or product price
    let baseCost: number;
    let retailPrice: number;

    if (variantId) {
      const variant = await productsRepo.getVariantById(variantId);
      if (!variant) throw new Error('Variant not found');
      baseCost = variant.cost_price || 0;
      retailPrice = variant.retail_price || 0;
    } else {
      const product = await productsRepo.getById(productId);
      if (!product) throw new Error('Product not found');
      // Use first variant or default values
      const firstVariant = product.variants?.[0];
      baseCost = firstVariant?.cost_price || 0;
      retailPrice = firstVariant?.retail_price || 0;
    }

    // If no cost price, estimate from retail (40% margin assumption)
    if (!baseCost && retailPrice) {
      baseCost = retailPrice * 0.6;
    }

    if (!baseCost) {
      throw new Error('No cost price available for calculation');
    }

    // Get commission rates
    const commission = config.commission_override || config.provider?.commission_default || 10;
    const markup = config.price_markup_percent || 0;

    // Formula: Cost / (1 - (commission + markup) / 100)
    // This ensures the final price covers costs after fees
    const totalFeePercent = (commission + markup) / 100;
    if (totalFeePercent >= 1) {
      throw new Error('Commission + markup cannot be 100% or more');
    }

    const finalPrice = baseCost / (1 - totalFeePercent);

    // Round up to nearest centavo
    return Math.ceil(finalPrice * 100) / 100;
  }

  /**
   * Build product payload for marketplace API.
   * Includes all variants with proper attributes for ML variations support.
   */
  private async buildProductPayload(
    product: any,
    config: MarketplaceConfig
  ): Promise<ProductPayload> {
    // Get localized text (prefer Portuguese)
    const getLocalizedText = (field: any): string => {
      if (typeof field === 'string') return field;
      if (field?.pt) return field.pt;
      if (field?.en) return field.en;
      return '';
    };

    // Get marketplace-specific description if available
    const providerCode = config.provider?.code || 'mercado_livre';
    let description = '';
    if (product.marketplace_descriptions && product.marketplace_descriptions[providerCode]) {
      description = product.marketplace_descriptions[providerCode];
    } else {
      description = getLocalizedText(product.description) || getLocalizedText(product.name);
    }

    // Build variants array with calculated prices and proper attributes
    const variants = await Promise.all(
      (product.variants || []).map(async (variant: any) => {
        // Calculate marketplace price for each variant
        let variantPrice: number;
        try {
          variantPrice = await this.calculateMarketplacePrice(
            product.id,
            variant.id,
            config.id
          );
        } catch {
          // Fallback to retail price
          variantPrice = variant.retail_price || 0;
        }

        // Build attributes object from variant properties
        const attributes: Record<string, string> = {};

        // Add size if present
        if (variant.size) {
          attributes.SIZE = variant.size;
        }

        // Add color if present
        const colorName = getLocalizedText(variant.color_name);
        if (colorName) {
          attributes.COLOR = colorName;
        }

        // Merge any custom attributes
        if (variant.attributes) {
          Object.entries(variant.attributes).forEach(([key, value]) => {
            if (typeof value === 'string' || typeof value === 'number') {
              attributes[key.toUpperCase()] = String(value);
            }
          });
        }

        return {
          sku: variant.sku,
          price: variantPrice,
          stock: variant.stock_quantity || variant.stock || 0,
          attributes,
        };
      })
    );

    // Get base data from first variant
    const firstVariant = product.variants?.[0];
    const basePrice = variants[0]?.price || firstVariant?.retail_price || 0;
    const totalStock = variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);

    // Use base_images from product or variant_images
    const images = product.base_images ||
      product.images ||
      firstVariant?.variant_images ||
      [];

    return {
      title: getLocalizedText(product.name),
      description,
      price: basePrice,
      stock: totalStock,
      sku: firstVariant?.sku || product.id,
      images,
      category_id: config.ml_category_id || product.category_id,
      variants: variants.length > 0 ? variants : undefined,
    };
  }

  /**
   * Get sync statistics for dashboard.
   */
  async getSyncStats(configId?: string): Promise<{
    totalMappings: number;
    synced: number;
    pending: number;
    errors: number;
    lastSync: string | null;
  }> {
    if (configId) {
      const counts = await marketplaceMappingsRepository.countByStatus(configId);
      const config = await marketplaceConfigsRepository.getById(configId);

      return {
        totalMappings: Object.values(counts).reduce((a, b) => a + b, 0),
        synced: counts.synced,
        pending: counts.pending,
        errors: counts.error,
        lastSync: config?.last_sync_at || null,
      };
    }

    // Aggregate across all configs
    const configs = await marketplaceConfigsRepository.getAll();
    let totalMappings = 0;
    let synced = 0;
    let pending = 0;
    let errors = 0;
    let lastSync: string | null = null;

    for (const config of configs) {
      const counts = await marketplaceMappingsRepository.countByStatus(config.id);
      totalMappings += Object.values(counts).reduce((a, b) => a + b, 0);
      synced += counts.synced;
      pending += counts.pending;
      errors += counts.error;

      if (config.last_sync_at && (!lastSync || config.last_sync_at > lastSync)) {
        lastSync = config.last_sync_at;
      }
    }

    return { totalMappings, synced, pending, errors, lastSync };
  }

  /**
   * Clear provider cache (useful after config updates).
   */
  clearCache(configId?: string): void {
    if (configId) {
      this.providers.delete(configId);
    } else {
      this.providers.clear();
      this.initialized = false;
    }
  }
}

// Singleton instance
let orchestratorInstance: MarketplaceOrchestrator | null = null;

export function getMarketplaceOrchestrator(): MarketplaceOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new MarketplaceOrchestrator();
  }
  return orchestratorInstance;
}

export default MarketplaceOrchestrator;
