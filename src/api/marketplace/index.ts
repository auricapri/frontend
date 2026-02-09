/**
 * Marketplace API Module
 *
 * Modular marketplace API for admin operations.
 * Supports Mercado Livre, TikTok Shop, and other marketplaces.
 */

// Re-export all types
export * from './types';

// Import all modules
import * as core from './core.api';
import * as products from './products.api';
import * as orders from './orders.api';
import * as shipping from './shipping.api';
import * as analytics from './analytics.api';
import * as importApi from './import.api';

// Re-export param types
export type { GetMappingsParams } from './products.api';
export type { GetOrdersParams, GetQuestionsParams, GetLogsParams } from './orders.api';
export type { MetricsPeriod } from './analytics.api';
export type { GetMarketplaceProductsParams, LinkProductOptions } from './import.api';

/**
 * Marketplace API client for admin operations.
 * Composed from modular API functions.
 */
export class MarketplaceApi {
  // ============================================
  // PROVIDERS
  // ============================================
  getProviders = core.getProviders;
  getProvider = core.getProvider;

  // ============================================
  // CONFIGS
  // ============================================
  getConfigs = core.getConfigs;
  getConfig = core.getConfig;
  createConfig = core.createConfig;
  updateConfig = core.updateConfig;
  deleteConfig = core.deleteConfig;
  getConfigByProviderCode = core.getConfigByProviderCode;

  // ============================================
  // OAUTH
  // ============================================
  getAuthUrl = core.getAuthUrl;
  handleOAuthCallback = core.handleOAuthCallback;
  testConnection = core.testConnection;

  // ============================================
  // MAPPINGS
  // ============================================
  getMappings = products.getMappings;
  getMapping = products.getMapping;
  createMapping = products.createMapping;
  updateMapping = products.updateMapping;
  deleteMapping = products.deleteMapping;
  syncMapping = products.syncMapping;

  // ============================================
  // SYNC OPERATIONS
  // ============================================
  syncProducts = products.syncProducts;
  syncPending = products.syncPending;
  getSyncStats = products.getSyncStats;
  calculatePrice = products.calculatePrice;

  // ============================================
  // ORDERS
  // ============================================
  getOrders = orders.getOrders;
  getOrder = orders.getOrder;
  syncOrders = orders.syncOrders;

  // ============================================
  // QUESTIONS
  // ============================================
  getQuestions = orders.getQuestions;
  answerQuestion = orders.answerQuestion;

  // ============================================
  // LOGS
  // ============================================
  getLogs = orders.getLogs;
  getLogStats = orders.getLogStats;

  // ============================================
  // SHIPPING
  // ============================================
  getShipment = shipping.getShipment;
  updateShipmentTracking = shipping.updateShipmentTracking;
  getShippingLabelUrl = shipping.getShippingLabelUrl;

  // ============================================
  // METRICS
  // ============================================
  getSalesMetrics = analytics.getSalesMetrics;
  getVisitsMetrics = analytics.getVisitsMetrics;
  getReputation = analytics.getReputation;
  getFullMetrics = analytics.getFullMetrics;

  // ============================================
  // FEES
  // ============================================
  getCategoryFees = analytics.getCategoryFees;
  calculateFees = analytics.calculateFees;
  calculateMinimumPrice = analytics.calculateMinimumPrice;
  getListingTypes = analytics.getListingTypes;
  refreshFees = analytics.refreshFees;

  // ============================================
  // IMPORT FROM MARKETPLACE
  // ============================================
  getMarketplaceProducts = importApi.getMarketplaceProducts;
  getMarketplaceProductDetails = importApi.getMarketplaceProductDetails;
  downloadMarketplaceImage = importApi.downloadMarketplaceImage;
  linkMarketplaceProduct = importApi.linkMarketplaceProduct;

  // ============================================
  // FINANCIAL
  // ============================================
  getMercadoLivreBalance = importApi.getMercadoLivreBalance;
  getMercadoLivreSales = importApi.getMercadoLivreSales;
  getTikTokShopBalance = importApi.getTikTokShopBalance;
}

// Singleton instance for backwards compatibility
export const marketplaceApi = new MarketplaceApi();

// Also export individual functions for tree-shaking
export {
  // Core
  core as marketplaceCore,
  // Products
  products as marketplaceProducts,
  // Orders
  orders as marketplaceOrders,
  // Shipping
  shipping as marketplaceShipping,
  // Analytics
  analytics as marketplaceAnalytics,
  // Import
  importApi as marketplaceImport,
};
