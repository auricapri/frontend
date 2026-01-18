import { OrdersRepository } from '../repositories/orders.repository.js';
import type { Order } from '../repositories/orders.repository.js';
import { DeliveryRepository, DeliveryPickup, DeliveryReport } from '../repositories/delivery.repository.js';
import { ProductsRepository } from '../repositories/products.repository.js';
import { SuppliersRepository } from '../repositories/suppliers.repository.js';
import type { Supplier } from '../repositories/suppliers.repository.js';
import type { OrderItem } from '../../shared/types/index.js';
import logger from '../config/logger.js';

export interface SupplierOrderGroup {
  supplier_id: string;
  supplier: Supplier;
  orders: Order[];
  items: Array<{
    order_id: string;
    order_item: OrderItem;
    order_item_id: string;
    product_id: string;
    quantity: number;
    price: number;
    total: number;
    picked_up: boolean;
    pickup_id?: string;
  }>;
  total_amount: number;
  total_items: number;
  picked_up_items: number;
}

export class DeliveryService {
  private ordersRepo: OrdersRepository;
  private deliveryRepo: DeliveryRepository;
  private productsRepo: ProductsRepository;
  private suppliersRepo: SuppliersRepository;

  constructor() {
    this.ordersRepo = new OrdersRepository();
    this.deliveryRepo = new DeliveryRepository();
    this.productsRepo = new ProductsRepository();
    this.suppliersRepo = new SuppliersRepository();
  }

  async getOrdersForDelivery(date?: Date): Promise<SupplierOrderGroup[]> {
    const now = new Date();
    const target = date ? new Date(date) : new Date(now);

    let start: Date;
    let end: Date;

    if (date) {
      start = new Date(target);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(end.getDate() + 1);
      end.setMilliseconds(end.getMilliseconds() - 1);
    } else {
      end = new Date(target);
      end.setHours(0, 0, 0, 0);
      end.setMilliseconds(end.getMilliseconds() - 1);
      start = new Date(end);
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
    }

    const filteredOrders = await this.ordersRepo.getByCreatedAtRange({
      start,
      end,
      status: 'confirmed',
    });

    return this.groupOrdersBySupplier(filteredOrders);
  }

  async groupOrdersBySupplier(orders: Order[]): Promise<SupplierOrderGroup[]> {
    const supplierMap = new Map<string, SupplierOrderGroup>();

    // Step 1: Collect all variant_ids and product_ids to batch fetch
    const variantIds = new Set<string>();
    const productIds = new Set<string>();

    for (const order of orders) {
      for (const item of order.items || []) {
        if (item.variant_id && item.variant_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          variantIds.add(item.variant_id);
        }
        if (item.product_id && item.product_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          productIds.add(item.product_id);
        }
      }
    }

    // Step 2: Batch fetch all variants and products
    const variantsArray = variantIds.size > 0 ? await this.productsRepo.getVariantsByIds(Array.from(variantIds)) : [];
    const variantsMap = new Map(variantsArray.map(v => [v.id, v]));

    // Add product_ids from variants to the set
    for (const variant of variantsArray) {
      if (variant.product_id && variant.product_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        productIds.add(variant.product_id);
      }
    }

    const productsArray = productIds.size > 0 ? await this.productsRepo.getByIds(Array.from(productIds)) : [];
    const productsMap = new Map(productsArray.map(p => [p.id, p]));

    // Step 3: Collect all supplier_ids and batch fetch
    const supplierIds = new Set<string>();
    for (const product of productsArray) {
      if (product.supplier_id) {
        supplierIds.add(product.supplier_id);
      }
    }

    const suppliersArray = supplierIds.size > 0 ? await this.suppliersRepo.getByIds(Array.from(supplierIds)) : [];
    const suppliersMap = new Map(suppliersArray.map(s => [s.id, s]));

    // Step 4: Process orders using cached data (no more N+1 queries)
    for (const order of orders) {
      for (const item of order.items || []) {
        let productId = item.product_id;

        // Resolve product_id from variant if needed
        if (!productId || !productId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          if (item.variant_id) {
            const variant = variantsMap.get(item.variant_id);
            if (variant && variant.product_id) {
              productId = variant.product_id;
            } else {
              continue;
            }
          } else {
            continue;
          }
        }

        const product = productsMap.get(productId);
        if (!product || !product.supplier_id) continue;

        const supplierId = product.supplier_id;
        const supplier = suppliersMap.get(supplierId);
        if (!supplier) continue;

        if (!supplierMap.has(supplierId)) {
          supplierMap.set(supplierId, {
            supplier_id: supplierId,
            supplier: supplier,
            orders: [],
            items: [],
            total_amount: 0,
            total_items: 0,
            picked_up_items: 0
          });
        }

        const group = supplierMap.get(supplierId)!;

        if (!group.orders.find(o => o.id === order.id)) {
          group.orders.push(order);
        }

        let variantImage = item.image;
        let variantMeta: any = null;
        if (item.variant_id) {
          const variant = variantsMap.get(item.variant_id);
          if (variant && variant.variant_images && variant.variant_images.length > 0) {
            variantImage = variant.variant_images[0];
          }
          if (variant) {
            variantMeta = {
              attributes: variant.attributes || null,
              composition: variant.composition || null,
              care_instructions: variant.care_instructions || null,
              weight_g: variant.weight_g || null,
              dimensions: variant.dimensions || null,
            };
          }
        }

        const itemTotal = (item.price || 0) * (item.quantity || 0);
        const itemIndex = order.items.indexOf(item);
        const orderItemId = item.variant_id
          ? `${order.id}_${itemIndex}_${item.variant_id}`
          : `${order.id}_${itemIndex}_${item.product_id}`;
        group.items.push({
          order_id: order.id,
          order_item: ({
            ...item,
            image: variantImage || item.image,
            variant_meta: variantMeta
          } as any),
          order_item_id: orderItemId,
          product_id: productId,
          quantity: item.quantity || 0,
          price: item.price || 0,
          total: itemTotal,
          picked_up: false
        });

        group.total_amount += itemTotal;
        group.total_items += item.quantity || 0;
      }
    }

    return Array.from(supplierMap.values());
  }

  async getSupplierOrders(supplierId: string, userId?: string): Promise<SupplierOrderGroup | null> {
    const groups = await this.getOrdersForDelivery();
    const group = groups.find(g => g.supplier_id === supplierId);
    
    if (!group) return null;

    if (userId) {
      const pickups = await this.deliveryRepo.getPickupsBySupplier(supplierId, userId);
      const pickupMap = new Map<string, DeliveryPickup>();
      
      for (const pickup of pickups) {
        const key = `${pickup.order_id}_${pickup.order_item_id}`;
        pickupMap.set(key, pickup);
      }

      let pickedUpItems = 0;
      for (const item of group.items) {
        const key = `${item.order_id}_${item.order_item_id || item.product_id}`;
        const pickup = pickupMap.get(key);
        
        if (pickup && pickup.status === 'picked_up') {
          item.picked_up = true;
          item.pickup_id = pickup.id;
          pickedUpItems += item.quantity;
        }
      }
      group.picked_up_items = pickedUpItems;
    }

    return group;
  }

  async calculateSupplierTotal(supplierId: string, orders: Order[]): Promise<number> {
    let total = 0;

    for (const order of orders) {
      for (const item of order.items || []) {
        // Try to get product_id from variant if product_id is not a valid UUID
        let productId = item.product_id;
        if (!productId || !productId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          if (item.variant_id) {
            try {
              const variant = await this.productsRepo.getVariantById(item.variant_id);
              if (variant && variant.product_id) {
                productId = variant.product_id;
              }
            } catch (error) {
              logger.error(`Error fetching variant ${item.variant_id}:`, { error });
              continue; // Skip this item if we can't get the product
            }
          } else {
            continue; // Skip items without valid product_id or variant_id
          }
        }

        const product = await this.productsRepo.getById(productId);
        if (product?.supplier_id === supplierId) {
          total += (item.price || 0) * (item.quantity || 0);
        }
      }
    }

    return total;
  }

  async markAllSupplierItemsAsPickedUp(
    supplierId: string,
    userId: string
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const groups = await this.getOrdersForDelivery();
    const group = groups.find(g => g.supplier_id === supplierId);
    
    if (!group) {
      throw new Error('Supplier orders not found');
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Get all items that are not yet picked up
    const unpickedItems = group.items.filter(item => !item.picked_up);

    for (const item of unpickedItems) {
      try {
        await this.markProductAsPickedUp(item.order_id, item.order_item_id, userId);
        results.success++;
      } catch (error: unknown) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Item ${item.order_item_id}: ${errorMessage}`);
        logger.error(`[DeliveryService] Error marking item ${item.order_item_id} as picked up:`, { error });
      }
    }

    return results;
  }

  async markProductAsPickedUp(
    orderId: string,
    orderItemId: string,
    userId: string
  ): Promise<DeliveryPickup> {
    const order = await this.ordersRepo.getById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Parse the composite orderItemId: orderId_itemIndex_variantId or orderId_itemIndex_productId
    const parts = orderItemId.split('_');
    let item: OrderItem | undefined = undefined;
    
    if (parts.length >= 3) {
      // It's a composite key: orderId_itemIndex_identifier
      const itemIndex = parseInt(parts[1], 10);
      const identifier = parts.slice(2).join('_'); // In case identifier has underscores
      
      if (!isNaN(itemIndex) && order.items[itemIndex]) {
        const candidateItem = order.items[itemIndex];
        // Check if identifier matches variant_id or product_id
        if (candidateItem.variant_id === identifier || candidateItem.product_id === identifier) {
          item = candidateItem;
        }
      }
    }
    
    // Fallback: try to find by variant_id or product_id directly
    if (!item) {
      item = order.items.find((i: OrderItem) => 
        (i.variant_id === orderItemId) ||
        (i.product_id === orderItemId)
      );
    }

    if (!item) {
      throw new Error('Order item not found');
    }

    // Try to get product_id from variant if product_id is not a valid UUID
    let productId = item.product_id;
    let product = null;
    const attemptedStrategies: string[] = [];

    // Strategy 1: Use product_id directly if it's a UUID
    if (productId && productId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      attemptedStrategies.push('direct_product_id');
    } else {
      attemptedStrategies.push('direct_product_id (failed: not UUID)');

      // Strategy 2: Get product_id from variant via variant_id (if variant_id is UUID)
      if (item.variant_id && item.variant_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        try {
          const variant = await this.productsRepo.getVariantById(item.variant_id);
          if (variant && variant.product_id) {
            if (variant.product_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
              productId = variant.product_id;
              attemptedStrategies.push(`variant_by_id (success: ${productId})`);
              logger.info(`[DeliveryService] Resolved product_id from variant_id: ${productId}`);
            } else if (variant.product_id.startsWith('prod_')) {
              // Variant has slug-based product_id, try to resolve it
              const slugCandidate = variant.product_id.replace(/^prod_/, '');
              product = await this.productsRepo.getBySlug(slugCandidate);
              if (product && product.id && product.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
                productId = product.id;
                attemptedStrategies.push(`variant_by_id_slug (success: ${productId})`);
                logger.info(`[DeliveryService] Resolved product_id from variant's product_id slug: ${productId}`);
              } else {
                attemptedStrategies.push(`variant_by_id (failed: variant found but product_id is slug and product not found: ${variant.product_id})`);
                logger.warn(`[DeliveryService] Variant ${item.variant_id} found but product_id is slug and product not found: ${variant.product_id}`);
              }
            } else {
              attemptedStrategies.push(`variant_by_id (failed: variant found but product_id invalid format: ${variant.product_id})`);
              logger.warn(`[DeliveryService] Variant ${item.variant_id} found but product_id has invalid format: ${variant.product_id}`);
            }
          } else {
            attemptedStrategies.push(`variant_by_id (failed: variant found but product_id missing)`);
            logger.warn(`[DeliveryService] Variant ${item.variant_id} found but product_id is missing`);
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'unknown error';
          attemptedStrategies.push(`variant_by_id (failed: ${errorMessage})`);
          logger.error(`[DeliveryService] Error fetching variant ${item.variant_id}:`, { error });
        }
      } else {
        attemptedStrategies.push('variant_by_id (skipped: variant_id not UUID)');
      }
      
      // Strategy 3: Get product_id from variant via SKU (if SKU exists)
      if ((!productId || !productId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) && item.sku) {
        try {
          const variant = await this.productsRepo.getVariantBySku(item.sku);
          if (variant && variant.product_id && variant.product_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            productId = variant.product_id;
            attemptedStrategies.push(`variant_by_sku (success: ${productId})`);
            logger.info(`[DeliveryService] Resolved product_id from variant SKU: ${productId}`);
          } else {
            attemptedStrategies.push(`variant_by_sku (failed: variant found but product_id invalid or missing: ${variant?.product_id || 'null'})`);
            logger.warn(`[DeliveryService] Variant with SKU ${item.sku} found but product_id is invalid or missing: ${variant?.product_id || 'null'}`);
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'unknown error';
          attemptedStrategies.push(`variant_by_sku (failed: ${errorMessage})`);
          logger.error(`[DeliveryService] Error fetching variant by SKU ${item.sku}:`, { error });
        }
      } else {
        attemptedStrategies.push(`variant_by_sku (skipped: ${!item.sku ? 'no SKU' : 'already resolved'})`);
      }
      
      // Strategy 4: Try to find product using product_id as variant SKU
      if ((!productId || !productId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) && productId) {
        try {
          product = await this.productsRepo.getProductByVariantSku(productId);
          if (product && product.id && product.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            productId = product.id;
            attemptedStrategies.push(`product_by_variant_sku (success: ${productId})`);
            logger.info(`[DeliveryService] Resolved product_id from product by variant SKU: ${productId}`);
          } else {
            attemptedStrategies.push(`product_by_variant_sku (failed: product not found or invalid ID)`);
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'unknown error';
          attemptedStrategies.push(`product_by_variant_sku (failed: ${errorMessage})`);
          logger.error(`[DeliveryService] Error fetching product by variant SKU ${productId}:`, { error });
        }
      } else {
        attemptedStrategies.push(`product_by_variant_sku (skipped: ${!productId ? 'no productId' : 'already resolved'})`);
      }
      
      // Strategy 5: Try to find product by slug if product_id looks like a slug (starts with "prod_")
      if ((!productId || !productId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) && productId && productId.startsWith('prod_')) {
        try {
          const slugCandidate = productId.replace(/^prod_/, '');
          product = await this.productsRepo.getBySlug(slugCandidate);
          if (product && product.id && product.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            productId = product.id;
            attemptedStrategies.push(`product_by_slug (success: ${productId})`);
            logger.info(`[DeliveryService] Resolved product_id from slug: ${productId}`);
          } else {
            attemptedStrategies.push(`product_by_slug (failed: product not found or invalid ID)`);
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'unknown error';
          attemptedStrategies.push(`product_by_slug (failed: ${errorMessage})`);
          logger.error(`[DeliveryService] Error fetching product by slug ${productId}:`, { error });
        }
      } else if (productId && !productId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        attemptedStrategies.push(`product_by_slug (skipped: productId doesn't start with 'prod_')`);
      }
      
      // Strategy 6: If variant was found but has non-UUID product_id, try to get product from variant's product_id by slug
      if ((!productId || !productId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) && item.variant_id && item.variant_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        try {
          const variant = await this.productsRepo.getVariantById(item.variant_id);
          if (variant && variant.product_id && variant.product_id.startsWith('prod_')) {
            const slugCandidate = variant.product_id.replace(/^prod_/, '');
            product = await this.productsRepo.getBySlug(slugCandidate);
            if (product && product.id && product.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
              productId = product.id;
              attemptedStrategies.push(`product_by_variant_slug (success: ${productId})`);
              logger.info(`[DeliveryService] Resolved product_id from variant's product_id slug: ${productId}`);
            } else {
              attemptedStrategies.push(`product_by_variant_slug (failed: product not found or invalid ID)`);
            }
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'unknown error';
          attemptedStrategies.push(`product_by_variant_slug (failed: ${errorMessage})`);
          logger.error(`[DeliveryService] Error fetching product by variant's product_id slug:`, { error });
        }
      }
    }

    // If still not a valid UUID, throw error with detailed context
    if (!productId || !productId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const errorDetails = {
        original_product_id: item.product_id,
        variant_id: item.variant_id,
        sku: item.sku,
        final_product_id: productId,
        attempted_strategies: attemptedStrategies,
        item_structure: {
          product_id: item.product_id,
          variant_id: item.variant_id,
          sku: item.sku,
          id: item.id
        }
      };
      throw new Error(`Invalid product_id format: ${productId}. Could not resolve to a valid UUID. Attempted strategies: ${attemptedStrategies.join(', ')}. Details: ${JSON.stringify(errorDetails)}`);
    }

    if (!product) {
      product = await this.productsRepo.getById(productId);
    }
    if (!product) {
      throw new Error('Product not found');
    }

    const existingPickup = await this.deliveryRepo.getPickupByOrderItem(orderId, orderItemId, userId);
    
    if (existingPickup) {
      return await this.deliveryRepo.updatePickupStatus(existingPickup.id, 'picked_up');
    }

    return await this.deliveryRepo.createPickup({
      order_id: orderId,
      order_item_id: orderItemId,
      product_id: productId,
      supplier_id: product.supplier_id || null,
      picked_up_by: userId
    });
  }

  async reportProblem(
    orderId: string,
    orderItemId: string,
    userId: string,
    mediaUrls: string[],
    description?: string
  ): Promise<DeliveryReport> {
    const order = await this.ordersRepo.getById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Parse the composite orderItemId: orderId_itemIndex_variantId or orderId_itemIndex_productId
    const parts = orderItemId.split('_');
    let item: OrderItem | undefined = undefined;
    
    if (parts.length >= 3) {
      // It's a composite key: orderId_itemIndex_identifier
      const itemIndex = parseInt(parts[1], 10);
      const identifier = parts.slice(2).join('_'); // In case identifier has underscores
      
      if (!isNaN(itemIndex) && order.items[itemIndex]) {
        const candidateItem = order.items[itemIndex];
        // Check if identifier matches variant_id or product_id
        if (candidateItem.variant_id === identifier || candidateItem.product_id === identifier) {
          item = candidateItem;
        }
      }
    }
    
    // Fallback: try to find by variant_id or product_id directly
    if (!item) {
      item = order.items.find((i: OrderItem) => 
        (i.variant_id === orderItemId) ||
        (i.product_id === orderItemId)
      );
    }

    if (!item) {
      throw new Error('Order item not found');
    }

    // Try to get product_id from variant if product_id is not a valid UUID
    let productId = item.product_id;
    let product = null;
    const attemptedStrategies: string[] = [];

    // Strategy 1: Use product_id directly if it's a UUID
    if (productId && productId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      attemptedStrategies.push('direct_product_id');
    } else {
      attemptedStrategies.push('direct_product_id (failed: not UUID)');

      // Strategy 2: Get product_id from variant via variant_id (if variant_id is UUID)
      if (item.variant_id && item.variant_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        try {
          const variant = await this.productsRepo.getVariantById(item.variant_id);
          if (variant && variant.product_id && variant.product_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            productId = variant.product_id;
            attemptedStrategies.push(`variant_by_id (success: ${productId})`);
            logger.info(`[DeliveryService] Resolved product_id from variant_id: ${productId}`);
          } else {
            attemptedStrategies.push(`variant_by_id (failed: variant found but product_id invalid or missing: ${variant?.product_id || 'null'})`);
            logger.warn(`[DeliveryService] Variant ${item.variant_id} found but product_id is invalid or missing: ${variant?.product_id || 'null'}`);
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'unknown error';
          attemptedStrategies.push(`variant_by_id (failed: ${errorMessage})`);
          logger.error(`[DeliveryService] Error fetching variant ${item.variant_id}:`, { error });
        }
      } else {
        attemptedStrategies.push('variant_by_id (skipped: variant_id not UUID)');
      }
      
      // Strategy 3: Get product_id from variant via SKU (if SKU exists)
      if ((!productId || !productId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) && item.sku) {
        try {
          const variant = await this.productsRepo.getVariantBySku(item.sku);
          if (variant && variant.product_id && variant.product_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            productId = variant.product_id;
            attemptedStrategies.push(`variant_by_sku (success: ${productId})`);
            logger.info(`[DeliveryService] Resolved product_id from variant SKU: ${productId}`);
          } else {
            attemptedStrategies.push(`variant_by_sku (failed: variant found but product_id invalid or missing: ${variant?.product_id || 'null'})`);
            logger.warn(`[DeliveryService] Variant with SKU ${item.sku} found but product_id is invalid or missing: ${variant?.product_id || 'null'}`);
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'unknown error';
          attemptedStrategies.push(`variant_by_sku (failed: ${errorMessage})`);
          logger.error(`[DeliveryService] Error fetching variant by SKU ${item.sku}:`, { error });
        }
      } else {
        attemptedStrategies.push(`variant_by_sku (skipped: ${!item.sku ? 'no SKU' : 'already resolved'})`);
      }
      
      // Strategy 4: Try to find product using product_id as variant SKU
      if ((!productId || !productId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) && productId) {
        try {
          product = await this.productsRepo.getProductByVariantSku(productId);
          if (product && product.id && product.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            productId = product.id;
            attemptedStrategies.push(`product_by_variant_sku (success: ${productId})`);
            logger.info(`[DeliveryService] Resolved product_id from product by variant SKU: ${productId}`);
          } else {
            attemptedStrategies.push(`product_by_variant_sku (failed: product not found or invalid ID)`);
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'unknown error';
          attemptedStrategies.push(`product_by_variant_sku (failed: ${errorMessage})`);
          logger.error(`[DeliveryService] Error fetching product by variant SKU ${productId}:`, { error });
        }
      } else {
        attemptedStrategies.push(`product_by_variant_sku (skipped: ${!productId ? 'no productId' : 'already resolved'})`);
      }
    }

    // If still not a valid UUID, throw error with detailed context
    if (!productId || !productId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const errorDetails = {
        original_product_id: item.product_id,
        variant_id: item.variant_id,
        sku: item.sku,
        final_product_id: productId,
        attempted_strategies: attemptedStrategies,
        item_structure: {
          product_id: item.product_id,
          variant_id: item.variant_id,
          sku: item.sku,
          id: item.id
        }
      };
      throw new Error(`Invalid product_id format: ${productId}. Could not resolve to a valid UUID. Attempted strategies: ${attemptedStrategies.join(', ')}. Details: ${JSON.stringify(errorDetails)}`);
    }

    if (!product) {
      product = await this.productsRepo.getById(productId);
    }
    if (!product) {
      throw new Error('Product not found');
    }

    const report = await this.deliveryRepo.createReport({
      order_id: orderId,
      order_item_id: orderItemId,
      supplier_id: product.supplier_id || null,
      reported_by: userId,
      description: description || null,
      media_urls: mediaUrls
    });

    const existingPickup = await this.deliveryRepo.getPickupByOrderItem(orderId, orderItemId, userId);
    if (existingPickup && existingPickup.status !== 'problem_reported') {
      await this.deliveryRepo.updatePickupStatus(existingPickup.id, 'problem_reported');
    } else if (!existingPickup) {
      await this.deliveryRepo.createPickup({
        order_id: orderId,
        order_item_id: orderItemId,
        product_id: productId,
        supplier_id: product.supplier_id || null,
        picked_up_by: userId
      });
      const newPickup = await this.deliveryRepo.getPickupByOrderItem(orderId, orderItemId, userId);
      if (newPickup) {
        await this.deliveryRepo.updatePickupStatus(newPickup.id, 'problem_reported');
      }
    }

    return report;
  }
}
