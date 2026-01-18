import { supabase } from '../config/supabase.js';
import logger from '../config/logger.js';
import { bumpCacheNamespaceVersion, getCachedJson, getCacheNamespaceVersion } from '../utils/cache.js';
import type { ProductImageHotspot, ProductVariant, Product, LocalizedText } from '../../shared/types/index.js';

export type { ProductImageHotspot };

interface HotspotRow {
  id: string;
  product_id: string;
  image_url: string;
  x_percent: number;
  y_percent: number;
  linked_variant_id: string;
  label: LocalizedText | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const HOTSPOT_SELECT_FIELDS = 'id, product_id, image_url, x_percent, y_percent, linked_variant_id, label, is_active, created_at, updated_at';

export class ProductHotspotsRepository {
  /**
   * Get all hotspots for a product with populated variant and product data
   */
  async getByProductId(productId: string): Promise<ProductImageHotspot[]> {
    const v = await getCacheNamespaceVersion('hotspots');
    const key = `cache:hotspots:product:v2:${v}:${productId}`;

    return await getCachedJson(key, 300, async () => {
      // Step 1: Get hotspots
      const { data: hotspots, error: hotspotsError } = await supabase
        .from('product_image_hotspots')
        .select(HOTSPOT_SELECT_FIELDS)
        .eq('product_id', productId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (hotspotsError) {
        logger.error('Error fetching hotspots', { productId, error: hotspotsError });
        throw hotspotsError;
      }

      if (!hotspots || hotspots.length === 0) {
        return [];
      }

      // Step 2: Get unique variant IDs
      const variantIds = [...new Set(hotspots.map(h => h.linked_variant_id))];

      // Step 3: Fetch variants with their products
      const { data: variants, error: variantsError } = await supabase
        .from('product_variants')
        .select(`
          id, product_id, sku, size, color_name, color_hex,
          retail_price, wholesale_price, stock_quantity, variant_images, is_active
        `)
        .in('id', variantIds);

      if (variantsError) {
        logger.error('Error fetching variants for hotspots', { variantIds, error: variantsError });
      }

      // Step 4: Get unique product IDs from variants
      const productIds = [...new Set((variants || []).map(v => v.product_id))];

      // Step 5: Fetch products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, slug, base_images, is_active')
        .in('id', productIds);

      if (productsError) {
        logger.error('Error fetching products for hotspots', { productIds, error: productsError });
      }

      // Create lookup maps
      const variantMap = new Map((variants || []).map(v => [v.id, v]));
      const productMap = new Map((products || []).map(p => [p.id, p]));

      logger.debug('Hotspots populated', {
        productId,
        hotspotsCount: hotspots.length,
        variantsFound: variants?.length || 0,
        productsFound: products?.length || 0
      });

      // Map hotspots with their relations
      return hotspots.map(h => {
        const variant = variantMap.get(h.linked_variant_id);
        const product = variant ? productMap.get(variant.product_id) : undefined;

        return {
          id: h.id,
          product_id: h.product_id,
          image_url: h.image_url,
          x_percent: Number(h.x_percent),
          y_percent: Number(h.y_percent),
          linked_variant_id: h.linked_variant_id,
          label: h.label || undefined,
          is_active: h.is_active,
          created_at: h.created_at,
          updated_at: h.updated_at,
          linked_variant: variant as ProductVariant | undefined,
          linked_product: product as Product | undefined
        };
      });
    });
  }

  /**
   * Helper to populate variant and product data for hotspots
   */
  private async populateHotspotRelations(hotspots: HotspotRow[]): Promise<ProductImageHotspot[]> {
    if (!hotspots || hotspots.length === 0) {
      return [];
    }

    // Get unique variant IDs
    const variantIds = [...new Set(hotspots.map(h => h.linked_variant_id))];

    // Fetch variants
    const { data: variants } = await supabase
      .from('product_variants')
      .select('id, product_id, sku, size, color_name, color_hex, retail_price, wholesale_price, stock_quantity, variant_images, is_active')
      .in('id', variantIds);

    // Get unique product IDs
    const productIds = [...new Set((variants || []).map(v => v.product_id))];

    // Fetch products
    const { data: products } = await supabase
      .from('products')
      .select('id, name, slug, base_images, is_active')
      .in('id', productIds);

    // Create lookup maps
    const variantMap = new Map((variants || []).map(v => [v.id, v]));
    const productMap = new Map((products || []).map(p => [p.id, p]));

    return hotspots.map(h => {
      const variant = variantMap.get(h.linked_variant_id);
      const product = variant ? productMap.get(variant.product_id) : undefined;

      return {
        id: h.id,
        product_id: h.product_id,
        image_url: h.image_url,
        x_percent: Number(h.x_percent),
        y_percent: Number(h.y_percent),
        linked_variant_id: h.linked_variant_id,
        label: h.label || undefined,
        is_active: h.is_active,
        created_at: h.created_at,
        updated_at: h.updated_at,
        linked_variant: variant as ProductVariant | undefined,
        linked_product: product as Product | undefined
      };
    });
  }

  /**
   * Get hotspots for a specific image
   */
  async getByImageUrl(productId: string, imageUrl: string): Promise<ProductImageHotspot[]> {
    const v = await getCacheNamespaceVersion('hotspots');
    const key = `cache:hotspots:image:v2:${v}:${productId}:${Buffer.from(imageUrl).toString('base64').slice(0, 50)}`;

    return await getCachedJson(key, 300, async () => {
      const { data, error } = await supabase
        .from('product_image_hotspots')
        .select(HOTSPOT_SELECT_FIELDS)
        .eq('product_id', productId)
        .eq('image_url', imageUrl)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) {
        logger.error('Error fetching hotspots by image', { productId, imageUrl, error });
        throw error;
      }

      return this.populateHotspotRelations(data || []);
    });
  }

  /**
   * Get all hotspots for admin (including inactive)
   */
  async getAllByProductIdAdmin(productId: string): Promise<ProductImageHotspot[]> {
    const { data, error } = await supabase
      .from('product_image_hotspots')
      .select(HOTSPOT_SELECT_FIELDS)
      .eq('product_id', productId)
      .order('image_url', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Error fetching all hotspots for admin', { productId, error });
      throw error;
    }

    return this.populateHotspotRelations(data || []);
  }

  /**
   * Create a new hotspot
   */
  async create(hotspot: Omit<ProductImageHotspot, 'id' | 'created_at' | 'updated_at' | 'linked_variant' | 'linked_product'>): Promise<ProductImageHotspot> {
    const { data, error } = await supabase
      .from('product_image_hotspots')
      .insert({
        product_id: hotspot.product_id,
        image_url: hotspot.image_url,
        x_percent: hotspot.x_percent,
        y_percent: hotspot.y_percent,
        linked_variant_id: hotspot.linked_variant_id,
        label: hotspot.label || {},
        is_active: hotspot.is_active ?? true
      })
      .select(HOTSPOT_SELECT_FIELDS)
      .single();

    if (error) {
      logger.error('Error creating hotspot', { hotspot, error });
      throw error;
    }

    await bumpCacheNamespaceVersion('hotspots');
    return this.mapHotspot(data);
  }

  /**
   * Update a hotspot
   */
  async update(id: string, updates: Partial<Omit<ProductImageHotspot, 'id' | 'created_at' | 'updated_at' | 'linked_variant' | 'linked_product'>>): Promise<ProductImageHotspot> {
    const { data, error } = await supabase
      .from('product_image_hotspots')
      .update(updates)
      .eq('id', id)
      .select(HOTSPOT_SELECT_FIELDS)
      .single();

    if (error) {
      logger.error('Error updating hotspot', { id, updates, error });
      throw error;
    }

    await bumpCacheNamespaceVersion('hotspots');
    return this.mapHotspot(data);
  }

  /**
   * Delete a hotspot
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('product_image_hotspots')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Error deleting hotspot', { id, error });
      throw error;
    }

    await bumpCacheNamespaceVersion('hotspots');
  }

  /**
   * Delete all hotspots for a product
   */
  async deleteByProductId(productId: string): Promise<void> {
    const { error } = await supabase
      .from('product_image_hotspots')
      .delete()
      .eq('product_id', productId);

    if (error) {
      logger.error('Error deleting hotspots by product', { productId, error });
      throw error;
    }

    await bumpCacheNamespaceVersion('hotspots');
  }

  /**
   * Batch upsert hotspots for a product
   * Replaces all hotspots for the given product
   * Includes rollback mechanism if insert fails
   */
  async upsertBatch(productId: string, hotspots: Array<Omit<ProductImageHotspot, 'product_id' | 'created_at' | 'updated_at' | 'linked_variant' | 'linked_product'>>): Promise<ProductImageHotspot[]> {
    // Backup existing hotspots before delete (for potential rollback)
    const { data: existingHotspots } = await supabase
      .from('product_image_hotspots')
      .select(HOTSPOT_SELECT_FIELDS)
      .eq('product_id', productId);

    // Delete existing hotspots for this product
    await this.deleteByProductId(productId);

    if (!hotspots || hotspots.length === 0) {
      await bumpCacheNamespaceVersion('hotspots');
      logger.debug('All hotspots deleted for product', { productId });
      return [];
    }

    // Prepare hotspots for insert - only include id if provided (let DB generate otherwise)
    const hotspotsToInsert = hotspots.map(h => {
      const hotspot: Record<string, unknown> = {
        product_id: productId,
        image_url: h.image_url,
        x_percent: h.x_percent,
        y_percent: h.y_percent,
        linked_variant_id: h.linked_variant_id,
        label: h.label || {},
        is_active: h.is_active ?? true
      };
      // Only include id if it's a valid UUID (for updates)
      if (h.id && typeof h.id === 'string' && h.id.length > 0) {
        hotspot.id = h.id;
      }
      return hotspot;
    });

    const { data, error } = await supabase
      .from('product_image_hotspots')
      .insert(hotspotsToInsert)
      .select(HOTSPOT_SELECT_FIELDS);

    if (error) {
      logger.error('Error inserting hotspots, attempting rollback', { productId, count: hotspots.length, error });

      // Attempt to restore old hotspots
      if (existingHotspots && existingHotspots.length > 0) {
        try {
          const rollbackData = existingHotspots.map((h: HotspotRow) => ({
            id: h.id,
            product_id: h.product_id,
            image_url: h.image_url,
            x_percent: h.x_percent,
            y_percent: h.y_percent,
            linked_variant_id: h.linked_variant_id,
            label: h.label || {},
            is_active: h.is_active
          }));

          await supabase
            .from('product_image_hotspots')
            .insert(rollbackData);

          logger.info('Rollback successful, restored previous hotspots', { productId, count: existingHotspots.length });
        } catch (rollbackError) {
          logger.error('Rollback failed', { productId, rollbackError });
        }
      }

      // Throw a more descriptive error
      const errorMessage = error.message || 'Failed to save hotspots';
      const customError = new Error(`Hotspot save failed: ${errorMessage}`);
      throw customError;
    }

    await bumpCacheNamespaceVersion('hotspots');
    logger.debug('Hotspots batch upserted', { productId, count: data?.length || 0 });

    return (data || []).map(h => this.mapHotspot(h));
  }

  /**
   * Map raw hotspot row to interface
   */
  private mapHotspot(row: HotspotRow): ProductImageHotspot {
    return {
      id: row.id,
      product_id: row.product_id,
      image_url: row.image_url,
      x_percent: Number(row.x_percent),
      y_percent: Number(row.y_percent),
      linked_variant_id: row.linked_variant_id,
      label: row.label || undefined,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

}

let singleton: ProductHotspotsRepository | null = null;
export function getProductHotspotsRepository(): ProductHotspotsRepository {
  if (!singleton) singleton = new ProductHotspotsRepository();
  return singleton;
}
