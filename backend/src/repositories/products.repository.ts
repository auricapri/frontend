import { supabase } from '../config/supabase.js';
import logger from '../config/logger.js';
import { bumpCacheNamespaceVersion, getCachedJson, getCacheNamespaceVersion } from '../utils/cache.js';
import { eventEmitter } from '../utils/events.js';
import type { Product, ProductVariant } from '../../shared/types/index.js';

export type { Product };

const PRODUCT_SELECT_FIELDS = 'id, category_id, supplier_id, name, description, slug, is_active, is_highlight, has_free_shipping, pricing_scenarios, base_images, created_at';
const PRODUCT_VARIANT_SELECT_FIELDS = 'id, product_id, sku, size, color_name, color_hex, retail_price, wholesale_price, stock_quantity, variant_images, attributes, is_active, cost_price, weight_g, dimensions, correlated_assets, composition, care_instructions, size_guide_id';

export interface VariantStockData {
  id: string;
  product_id: string;
  stock_quantity: number;
  correlated_assets: Array<{ asset_id: string; quantity_required: number }> | null;
}

export class ProductsRepository {
  async getAllActive(): Promise<Product[]> {
    const v = await getCacheNamespaceVersion('products');
    const key = `cache:products:getAllActive:v1:${v}`;
    return await getCachedJson(key, 60, async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`${PRODUCT_SELECT_FIELDS}, variants:product_variants(${PRODUCT_VARIANT_SELECT_FIELDS})`)
        .eq('is_active', true);
      
      if (error) throw error;
      return (data || []) as Product[];
    });
  }

  async getAll(): Promise<Product[]> {
    const v = await getCacheNamespaceVersion('products');
    const key = `cache:products:getAll:v1:${v}`;
    return await getCachedJson(key, 60, async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`${PRODUCT_SELECT_FIELDS}, variants:product_variants(${PRODUCT_VARIANT_SELECT_FIELDS})`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as Product[];
    });
  }

  async getById(id: string): Promise<Product | null> {
    const v = await getCacheNamespaceVersion('products');
    const key = `cache:products:getById:v1:${v}:${id}`;
    return await getCachedJson(key, 300, async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`${PRODUCT_SELECT_FIELDS}, variants:product_variants(${PRODUCT_VARIANT_SELECT_FIELDS})`)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Product | null;
    });
  }

  async getByIds(ids: string[]): Promise<Product[]> {
    if (!ids || ids.length === 0) return [];
    const v = await getCacheNamespaceVersion('products');
    const key = `cache:products:getByIds:v1:${v}:${ids.slice().sort().join(',')}`;
    return await getCachedJson(key, 300, async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`${PRODUCT_SELECT_FIELDS}, variants:product_variants(${PRODUCT_VARIANT_SELECT_FIELDS})`)
        .in('id', ids);

      if (error) throw error;
      return (data || []) as Product[];
    });
  }

  async getBySlug(slug: string): Promise<Product | null> {
    const v = await getCacheNamespaceVersion('products');
    const key = `cache:products:getBySlug:v1:${v}:${slug}`;
    return await getCachedJson(key, 300, async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`${PRODUCT_SELECT_FIELDS}, variants:product_variants(${PRODUCT_VARIANT_SELECT_FIELDS})`)
        .or(`slug->>en.ilike.%${slug}%,slug->>pt.ilike.%${slug}%,slug->>es.ilike.%${slug}%,slug->>fr.ilike.%${slug}%`)
        .maybeSingle();
      
      if (error) throw error;
      return data as Product | null;
    });
  }

  // PERFORMANCE: Adicionado cache para operações frequentes de cart
  async getVariantById(variantId: string): Promise<ProductVariant | null> {
    const v = await getCacheNamespaceVersion('products');
    const key = `cache:variants:getById:v1:${v}:${variantId}`;
    return await getCachedJson(key, 120, async () => {
      const { data, error } = await supabase
        .from('product_variants')
        .select(PRODUCT_VARIANT_SELECT_FIELDS)
        .eq('id', variantId)
        .single();

      if (error) throw error;
      return data as ProductVariant | null;
    });
  }

  // PERFORMANCE: Adicionado cache para lookups por SKU
  async getVariantBySku(sku: string): Promise<ProductVariant | null> {
    const v = await getCacheNamespaceVersion('products');
    const key = `cache:variants:getBySku:v1:${v}:${sku}`;
    return await getCachedJson(key, 120, async () => {
      const { data, error } = await supabase
        .from('product_variants')
        .select(PRODUCT_VARIANT_SELECT_FIELDS)
        .eq('sku', sku)
        .maybeSingle();

      if (error) throw error;
      return data as ProductVariant | null;
    });
  }

  // PERFORMANCE: Adicionado cache para operações de cart batch
  async getVariantsByIds(variantIds: string[]): Promise<ProductVariant[]> {
    if (!variantIds || variantIds.length === 0) return [];

    const v = await getCacheNamespaceVersion('products');
    const key = `cache:variants:getByIds:v1:${v}:${variantIds.slice().sort().join(',')}`;
    return await getCachedJson(key, 120, async () => {
      const { data, error } = await supabase
        .from('product_variants')
        .select(PRODUCT_VARIANT_SELECT_FIELDS)
        .in('id', variantIds);

      if (error) throw error;
      return (data || []) as ProductVariant[];
    });
  }

  async getProductByVariantSku(sku: string): Promise<Product | null> {
    // First find the variant by SKU
    const { data: variant, error: variantError } = await supabase
      .from('product_variants')
      .select('product_id')
      .eq('sku', sku)
      .maybeSingle();
    
    if (variantError) throw variantError;
    if (!variant || !variant.product_id) return null;
    
    // Then get the product by its ID
    return await this.getById(variant.product_id);
  }

  async updateStock(variantId: string, quantity: number): Promise<void> {
    // Get product_id before updating
    const { data: variant } = await supabase
      .from('product_variants')
      .select('product_id')
      .eq('id', variantId)
      .single();

    const { error } = await supabase
      .from('product_variants')
      .update({ stock_quantity: Math.max(0, quantity) })
      .eq('id', variantId);

    if (error) throw error;
    await bumpCacheNamespaceVersion('products');

    // Emit stock update event for marketplace sync
    if (variant?.product_id) {
      eventEmitter.emit('stock:updated', {
        variantId,
        productId: variant.product_id,
        newQuantity: Math.max(0, quantity)
      });
    }
  }

  async create(product: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select(PRODUCT_SELECT_FIELDS)
      .single();

    if (error) throw error;
    await bumpCacheNamespaceVersion('products');

    // Emit product created event for marketplace sync
    eventEmitter.emit('product:created', { productId: data.id });

    return data as Product;
  }

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select(PRODUCT_SELECT_FIELDS)
      .single();

    if (error) throw error;
    await bumpCacheNamespaceVersion('products');

    // Emit product updated event for marketplace sync
    eventEmitter.emit('product:updated', { productId: id });

    return data as Product;
  }

  async delete(id: string): Promise<void> {
    // 1. Delete all product variants first (CASCADE should handle this, but being explicit)
    const { error: variantsError } = await supabase
      .from('product_variants')
      .delete()
      .eq('product_id', id);
    
    if (variantsError) {
      logger.error('Error deleting product variants', { productId: id, error: variantsError });
      throw variantsError;
    }

    // 2. Remove from wishlist
    const { error: wishlistError } = await supabase
      .from('wishlist')
      .delete()
      .eq('product_id', id);
    
    if (wishlistError) {
      logger.warn('Error removing product from wishlist', { productId: id, error: wishlistError });
      // Don't throw, just log - wishlist removal is not critical
    }

    // 3. Remove from collections (junction table)
    const { error: collectionsError } = await supabase
      .from('collection_products')
      .delete()
      .eq('product_id', id);
    
    if (collectionsError) {
      logger.warn('Error removing product from collections', { productId: id, error: collectionsError });
      // Don't throw, just log
    }

    // 4. Remove from coupons (update coupons that reference this product)
    // First get all coupons that include this product
    const { data: coupons, error: couponsFetchError } = await supabase
      .from('coupons')
      .select('id, product_ids')
      .contains('product_ids', [id]);
    
    if (!couponsFetchError && coupons) {
      for (const coupon of coupons) {
        const updatedProductIds = (coupon.product_ids || []).filter((pid: string) => pid !== id);
        await supabase
          .from('coupons')
          .update({ product_ids: updatedProductIds })
          .eq('id', coupon.id);
      }
    }

    // 5. Finally, delete the product itself
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await bumpCacheNamespaceVersion('products');

    // Emit product deleted event for marketplace sync (to remove from marketplaces)
    eventEmitter.emit('product:deleted', { productId: id });
  }

  async deleteBatch(ids: string[]): Promise<{ success: string[]; failed: Array<{ id: string; error: string }> }> {
    const success: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    for (const id of ids) {
      try {
        await this.delete(id);
        success.push(id);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        failed.push({ id, error: errorMessage });
      }
    }

    return { success, failed };
  }

  async upsertVariants(productId: string, variants: Partial<ProductVariant>[]): Promise<ProductVariant[]> {
    if (!variants || variants.length === 0) {
      return [];
    }

    // Prepare variants for insert/update
    const variantsToUpsert = variants.map(variant => {
      return {
        ...variant,
        product_id: productId
      };
    });
    
    // Upsert variants (insert or update if exists)
    const { error, data } = await supabase
      .from('product_variants')
      .upsert(variantsToUpsert, { onConflict: 'id' })
      .select(PRODUCT_VARIANT_SELECT_FIELDS);
    
    if (error) {
      logger.error('Error upserting variants', {
        productId,
        variantsCount: variantsToUpsert.length,
        error: error.message,
        code: error.code,
        details: error.details
      });
      throw error;
    }

    logger.debug('Variants upserted', { productId, savedCount: data?.length || 0 });
    await bumpCacheNamespaceVersion('products');
    return (data || []) as ProductVariant[];
  }

  async findAll(options: { limit?: number; offset?: number } = {}): Promise<Product[]> {
    const limit = options.limit ? Math.min(Math.max(options.limit, 1), 100) : 20;
    const offset = options.offset ? Math.max(options.offset, 0) : 0;

    const v = await getCacheNamespaceVersion('products');
    const key = `cache:products:findAll:v1:${v}:${limit}:${offset}`;
    return await getCachedJson(key, 30, async () => {
      const query = supabase
        .from('products')
        .select(`${PRODUCT_SELECT_FIELDS}, variants:product_variants(${PRODUCT_VARIANT_SELECT_FIELDS})`)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Product[];
    });
  }
}

let singleton: ProductsRepository | null = null;
export function getProductsRepository(): ProductsRepository {
  if (!singleton) singleton = new ProductsRepository();
  return singleton;
}
