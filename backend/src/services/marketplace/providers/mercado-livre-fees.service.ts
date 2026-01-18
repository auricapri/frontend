import logger from '../../../config/logger.js';
import { supabase } from '../../../config/supabase.js';
import type { MarketplaceCategoryFees, FeeCalculation } from '../marketplace.types.js';

/**
 * Mercado Livre Fee Structure
 * - Listing Fee: Fixed fee per listing (varies by listing_type)
 * - Sales Commission: Percentage of sale price (varies by category)
 *
 * Listing Types:
 * - free: No listing fee, limited visibility
 * - bronze/silver: Low fees, basic visibility
 * - gold: Medium fees, good visibility
 * - gold_special: Higher fees, premium visibility (most common for sellers)
 * - gold_pro: Highest fees, maximum visibility
 */

interface MLListingType {
  id: string;
  name: string;
  site_id: string;
  configuration: {
    listing_exposure: string;
    requires_picture: boolean;
    max_stock_per_item: number;
  };
}

interface MLCategoryResponse {
  id: string;
  name: string;
  settings: {
    listing_allowed: boolean;
    buying_allowed: boolean;
    buying_modes: string[];
    coverage_areas: string;
    currencies: string[];
    price: { max_price: number; min_price: number };
  };
  sale_fee_percentage?: number; // Commission percentage
}

// Default commission rates by category type (approximate)
const DEFAULT_COMMISSION_RATES: Record<string, number> = {
  'MLB1000': 11, // Eletronicos
  'MLB1051': 13, // Celulares
  'MLB1648': 16, // Computadores
  'MLB1430': 11, // Roupas
  'MLB1574': 13, // Casa e Decoracao
  'default': 11, // Default rate
};

// Listing fees by type (approximate in BRL)
const LISTING_FEES: Record<string, number> = {
  'free': 0,
  'bronze': 0,
  'silver': 0,
  'gold': 0,
  'gold_special': 0, // ML removed fixed fees, now only commission
  'gold_pro': 0,
};

/**
 * Service for fetching and calculating Mercado Livre fees.
 */
export class MercadoLivreFeesService {
  private accessToken: string | null = null;
  private baseUrl = 'https://api.mercadolibre.com';
  private cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours in ms

  constructor(accessToken?: string) {
    this.accessToken = accessToken || null;
  }

  /**
   * Set access token for API calls.
   */
  setAccessToken(token: string) {
    this.accessToken = token;
  }

  /**
   * Get category fees from cache or API.
   */
  async getCategoryFees(categoryId: string, listingType = 'gold_special'): Promise<MarketplaceCategoryFees | null> {
    try {
      // Try to get from cache first
      const cached = await this.getFromCache(categoryId, listingType);
      if (cached && !this.isCacheExpired(cached.updated_at)) {
        return cached;
      }

      // Fetch from ML API
      const fees = await this.fetchCategoryFeesFromML(categoryId);
      if (fees) {
        // Save to cache
        await this.saveToCache({
          provider_code: 'mercado_livre',
          category_id: categoryId,
          category_name: fees.name,
          listing_type: listingType,
          listing_fee: LISTING_FEES[listingType] || 0,
          sales_commission_percent: fees.commission,
        });

        return await this.getFromCache(categoryId, listingType);
      }

      // Return default if API fails
      return this.getDefaultFees(categoryId, listingType);
    } catch (error) {
      logger.error('Failed to get category fees', { categoryId, error });
      return this.getDefaultFees(categoryId, listingType);
    }
  }

  /**
   * Fetch category fees from Mercado Livre API.
   */
  private async fetchCategoryFeesFromML(categoryId: string): Promise<{ name: string; commission: number } | null> {
    if (!this.accessToken) {
      logger.warn('No access token for ML API, using defaults');
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/categories/${categoryId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`ML API error: ${response.status}`);
      }

      const data = await response.json() as MLCategoryResponse;

      // ML doesn't always return sale_fee_percentage directly
      // We need to use the category to estimate
      const commission = data.sale_fee_percentage || this.estimateCommission(categoryId);

      return {
        name: data.name,
        commission,
      };
    } catch (error) {
      logger.error('Failed to fetch ML category', { categoryId, error });
      return null;
    }
  }

  /**
   * Estimate commission based on category ID prefix.
   */
  private estimateCommission(categoryId: string): number {
    // Get root category (first part of category path)
    const rootCategory = categoryId.substring(0, 7); // e.g., MLB1000

    return DEFAULT_COMMISSION_RATES[rootCategory] || DEFAULT_COMMISSION_RATES['default'];
  }

  /**
   * Get fees from database cache.
   */
  private async getFromCache(categoryId: string, listingType: string): Promise<MarketplaceCategoryFees | null> {
    const { data, error } = await supabase
      .from('marketplace_category_fees')
      .select('*')
      .eq('provider_code', 'mercado_livre')
      .eq('category_id', categoryId)
      .eq('listing_type', listingType)
      .single();

    if (error || !data) {
      return null;
    }

    return data as MarketplaceCategoryFees;
  }

  /**
   * Save fees to database cache.
   */
  private async saveToCache(fees: Omit<MarketplaceCategoryFees, 'id' | 'created_at' | 'updated_at' | 'variation_commission_percent'>): Promise<void> {
    const { error } = await supabase
      .from('marketplace_category_fees')
      .upsert({
        ...fees,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'provider_code,category_id,listing_type',
      });

    if (error) {
      logger.error('Failed to cache category fees', { error });
    }
  }

  /**
   * Check if cache is expired.
   */
  private isCacheExpired(updatedAt: string): boolean {
    const updateTime = new Date(updatedAt).getTime();
    return Date.now() - updateTime > this.cacheExpiry;
  }

  /**
   * Get default fees when API is unavailable.
   */
  private getDefaultFees(categoryId: string, listingType: string): MarketplaceCategoryFees {
    return {
      id: 'default',
      provider_code: 'mercado_livre',
      category_id: categoryId,
      category_name: null,
      listing_type: listingType,
      listing_fee: LISTING_FEES[listingType] || 0,
      sales_commission_percent: this.estimateCommission(categoryId),
      variation_commission_percent: null,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Calculate fees for a given price.
   */
  calculateFees(price: number, commissionPercent: number, listingFee = 0): FeeCalculation {
    const salesCommission = price * (commissionPercent / 100);
    const totalFees = salesCommission + listingFee;
    const netRevenue = price - totalFees;

    return {
      category_id: '',
      listing_fee: listingFee,
      sales_commission_percent: commissionPercent,
      estimated_fees: Math.round(totalFees * 100) / 100,
      net_revenue: Math.round(netRevenue * 100) / 100,
    };
  }

  /**
   * Calculate the minimum price needed to achieve a target net revenue.
   * Formula: price = (targetNet + listingFee) / (1 - commissionPercent/100)
   */
  calculateMinimumPrice(targetNetRevenue: number, commissionPercent: number, listingFee = 0): number {
    const commissionRate = commissionPercent / 100;
    if (commissionRate >= 1) {
      throw new Error('Commission cannot be 100% or more');
    }

    const minPrice = (targetNetRevenue + listingFee) / (1 - commissionRate);
    return Math.ceil(minPrice * 100) / 100; // Round up to nearest centavo
  }

  /**
   * Get all listing types from ML.
   */
  async getListingTypes(): Promise<MLListingType[]> {
    try {
      const response = await fetch(`${this.baseUrl}/sites/MLB/listing_types`);
      if (!response.ok) {
        throw new Error(`ML API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      logger.error('Failed to fetch listing types', { error });
      return [];
    }
  }

  /**
   * Refresh all cached category fees.
   */
  async refreshAllFees(): Promise<{ updated: number; errors: number }> {
    const { data: cachedFees, error } = await supabase
      .from('marketplace_category_fees')
      .select('category_id, listing_type')
      .eq('provider_code', 'mercado_livre');

    if (error || !cachedFees) {
      return { updated: 0, errors: 1 };
    }

    let updated = 0;
    let errors = 0;

    for (const fee of cachedFees) {
      try {
        await this.getCategoryFees(fee.category_id, fee.listing_type);
        updated++;
      } catch {
        errors++;
      }
    }

    return { updated, errors };
  }
}

// Singleton instance
let feesServiceInstance: MercadoLivreFeesService | null = null;

export function getMercadoLivreFeesService(accessToken?: string): MercadoLivreFeesService {
  if (!feesServiceInstance) {
    feesServiceInstance = new MercadoLivreFeesService(accessToken);
  } else if (accessToken) {
    feesServiceInstance.setAccessToken(accessToken);
  }
  return feesServiceInstance;
}
