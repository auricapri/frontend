/**
 * Marketplace Event Listeners
 *
 * Listens for product events and triggers marketplace synchronization.
 * Events are processed asynchronously to avoid blocking the main request.
 */
import { eventEmitter, ProductEvents } from '../../utils/events.js';
import { MarketplaceOrchestrator } from './marketplace.orchestrator.js';
import logger from '../../config/logger.js';

let orchestrator: MarketplaceOrchestrator | null = null;
let isInitialized = false;

/**
 * Get or create orchestrator instance
 */
async function getOrchestrator(): Promise<MarketplaceOrchestrator> {
  if (!orchestrator) {
    orchestrator = new MarketplaceOrchestrator();
    await orchestrator.initialize();
  }
  return orchestrator;
}

/**
 * Handle product created event
 */
async function handleProductCreated(data: ProductEvents['product:created']): Promise<void> {
  try {
    logger.info('[Marketplace] Product created event received', { productId: data.productId });
    const orch = await getOrchestrator();
    const results = await orch.syncProduct(data.productId, 'create');
    logger.info('[Marketplace] Product sync completed', { productId: data.productId, results });
  } catch (error) {
    logger.error('[Marketplace] Failed to sync new product', {
      productId: data.productId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Handle product updated event
 */
async function handleProductUpdated(data: ProductEvents['product:updated']): Promise<void> {
  try {
    logger.info('[Marketplace] Product updated event received', { productId: data.productId });
    const orch = await getOrchestrator();
    const results = await orch.syncProduct(data.productId, 'update');
    logger.info('[Marketplace] Product update sync completed', { productId: data.productId, results });
  } catch (error) {
    logger.error('[Marketplace] Failed to sync updated product', {
      productId: data.productId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Handle product deleted event
 */
async function handleProductDeleted(data: ProductEvents['product:deleted']): Promise<void> {
  try {
    logger.info('[Marketplace] Product deleted event received', { productId: data.productId });
    const orch = await getOrchestrator();
    await orch.deleteProduct(data.productId);
    logger.info('[Marketplace] Product deletion sync completed', { productId: data.productId });
  } catch (error) {
    logger.error('[Marketplace] Failed to sync product deletion', {
      productId: data.productId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Handle stock updated event
 */
async function handleStockUpdated(data: ProductEvents['stock:updated']): Promise<void> {
  try {
    logger.info('[Marketplace] Stock updated event received', {
      variantId: data.variantId,
      productId: data.productId,
      newQuantity: data.newQuantity
    });
    const orch = await getOrchestrator();
    await orch.syncStockByVariant(data.variantId, data.newQuantity);
    logger.info('[Marketplace] Stock sync completed', { variantId: data.variantId });
  } catch (error) {
    logger.error('[Marketplace] Failed to sync stock update', {
      variantId: data.variantId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Initialize marketplace event listeners.
 * Call this once when the server starts.
 */
export function initializeMarketplaceEvents(): void {
  if (isInitialized) {
    logger.warn('[Marketplace] Event listeners already initialized');
    return;
  }

  logger.info('[Marketplace] Initializing event listeners...');

  // Register event listeners
  eventEmitter.on('product:created', handleProductCreated);
  eventEmitter.on('product:updated', handleProductUpdated);
  eventEmitter.on('product:deleted', handleProductDeleted);
  eventEmitter.on('stock:updated', handleStockUpdated);

  isInitialized = true;
  logger.info('[Marketplace] Event listeners initialized successfully');
}

/**
 * Cleanup marketplace event listeners.
 * Call this when shutting down the server.
 */
export function cleanupMarketplaceEvents(): void {
  if (!isInitialized) return;

  logger.info('[Marketplace] Cleaning up event listeners...');

  eventEmitter.off('product:created', handleProductCreated);
  eventEmitter.off('product:updated', handleProductUpdated);
  eventEmitter.off('product:deleted', handleProductDeleted);
  eventEmitter.off('stock:updated', handleStockUpdated);

  orchestrator = null;
  isInitialized = false;
  logger.info('[Marketplace] Event listeners cleaned up');
}
