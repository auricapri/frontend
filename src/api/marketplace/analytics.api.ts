/**
 * Marketplace Analytics API - Metrics and Fees
 */
import { apiClient } from '../client';
import type {
  SalesMetrics,
  VisitMetrics,
  ReputationMetrics,
  FullMetrics,
  CategoryFees,
  FeeCalculation,
  MinimumPriceCalculation,
  ListingType,
} from './types';

const BASE_PATH = '/marketplace';

// ============================================
// METRICS
// ============================================

export type MetricsPeriod = 'day' | 'week' | 'month';

/**
 * Get sales metrics.
 */
export async function getSalesMetrics(configId: string, period?: MetricsPeriod): Promise<SalesMetrics> {
  const params = new URLSearchParams({ config_id: configId });
  if (period) params.set('period', period);
  return apiClient.get<SalesMetrics>(`${BASE_PATH}/metrics/sales?${params.toString()}`);
}

/**
 * Get visits metrics.
 */
export async function getVisitsMetrics(
  configId: string,
  productId?: string,
  period?: MetricsPeriod
): Promise<VisitMetrics> {
  const params = new URLSearchParams({ config_id: configId });
  if (productId) params.set('product_id', productId);
  if (period) params.set('period', period);
  return apiClient.get<VisitMetrics>(`${BASE_PATH}/metrics/visits?${params.toString()}`);
}

/**
 * Get seller reputation.
 */
export async function getReputation(configId: string): Promise<ReputationMetrics> {
  return apiClient.get<ReputationMetrics>(`${BASE_PATH}/metrics/reputation?config_id=${configId}`);
}

/**
 * Get full metrics (sales, visits, reputation).
 */
export async function getFullMetrics(configId: string): Promise<FullMetrics> {
  return apiClient.get<FullMetrics>(`${BASE_PATH}/metrics/full?config_id=${configId}`);
}

// ============================================
// FEES (Mercado Livre)
// ============================================

/**
 * Get category fees from ML.
 */
export async function getCategoryFees(
  categoryId: string,
  listingType = 'gold_special',
  configId?: string
): Promise<CategoryFees> {
  const params = new URLSearchParams({ listing_type: listingType });
  if (configId) params.set('config_id', configId);
  return apiClient.get<CategoryFees>(`${BASE_PATH}/fees/categories/${categoryId}?${params.toString()}`);
}

/**
 * Calculate fees for a given price.
 */
export async function calculateFees(
  price: number,
  categoryId: string,
  listingType = 'gold_special',
  configId?: string
): Promise<FeeCalculation> {
  return apiClient.post<FeeCalculation>(`${BASE_PATH}/fees/calculate`, {
    price,
    category_id: categoryId,
    listing_type: listingType,
    config_id: configId,
  });
}

/**
 * Calculate minimum price for target net revenue.
 */
export async function calculateMinimumPrice(
  targetNetRevenue: number,
  categoryId: string,
  listingType = 'gold_special',
  configId?: string
): Promise<MinimumPriceCalculation> {
  return apiClient.post<MinimumPriceCalculation>(`${BASE_PATH}/fees/minimum-price`, {
    target_net_revenue: targetNetRevenue,
    category_id: categoryId,
    listing_type: listingType,
    config_id: configId,
  });
}

/**
 * Get all listing types from ML.
 */
export async function getListingTypes(): Promise<ListingType[]> {
  return apiClient.get<ListingType[]>(`${BASE_PATH}/fees/listing-types`);
}

/**
 * Refresh fees cache.
 */
export async function refreshFees(
  configId?: string
): Promise<{ message: string; updated: number; errors: number }> {
  return apiClient.post<{ message: string; updated: number; errors: number }>(
    `${BASE_PATH}/fees/refresh`,
    { config_id: configId }
  );
}
