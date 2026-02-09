/**
 * Marketplace Import API - Import from Marketplace and Financial
 */
import { apiClient } from '../client';
import type {
  MLProductBasic,
  MLProductFull,
  MarketplaceProductsResponse,
  LinkProductResponse,
  MarketplaceBalance,
  MarketplaceSalesSummary,
} from './types';

const BASE_PATH = '/marketplace';

// ============================================
// IMPORT FROM MARKETPLACE (ML → Local)
// ============================================

export interface GetMarketplaceProductsParams {
  status?: 'active' | 'paused' | 'closed';
  limit?: number;
  offset?: number;
}

/**
 * Get products from seller's marketplace account.
 */
export async function getMarketplaceProducts(
  configId: string,
  params?: GetMarketplaceProductsParams
): Promise<MarketplaceProductsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.offset) searchParams.set('offset', String(params.offset));

  const query = searchParams.toString();
  return apiClient.get<MarketplaceProductsResponse>(
    `${BASE_PATH}/configs/${configId}/products${query ? `?${query}` : ''}`
  );
}

/**
 * Get full details of a product from marketplace.
 */
export async function getMarketplaceProductDetails(
  configId: string,
  externalProductId: string
): Promise<MLProductFull> {
  return apiClient.get<MLProductFull>(
    `${BASE_PATH}/configs/${configId}/products/${externalProductId}`
  );
}

/**
 * Download image from marketplace.
 */
export async function downloadMarketplaceImage(
  configId: string,
  imageUrl: string
): Promise<{ data: string; content_type: string; size: number }> {
  return apiClient.post<{ data: string; content_type: string; size: number }>(
    `${BASE_PATH}/import/download-image`,
    { config_id: configId, image_url: imageUrl }
  );
}

export interface LinkProductOptions {
  variant_prices?: Array<{
    external_variation_id: number;
    local_variant_id: string;
    marketplace_price: number;
  }>;
  download_images?: boolean;
}

/**
 * Link marketplace product to existing local product.
 */
export async function linkMarketplaceProduct(
  configId: string,
  externalProductId: string,
  localProductId: string,
  options?: LinkProductOptions
): Promise<LinkProductResponse> {
  return apiClient.post<LinkProductResponse>(`${BASE_PATH}/import/link-product`, {
    config_id: configId,
    external_product_id: externalProductId,
    local_product_id: localProductId,
    variant_prices: options?.variant_prices,
    download_images: options?.download_images ?? true,
  });
}

// ============================================
// FINANCIAL (Admin Only)
// ============================================

/**
 * Get Mercado Livre account balance.
 */
export async function getMercadoLivreBalance(): Promise<MarketplaceBalance> {
  return apiClient.get(`${BASE_PATH}/mercado-livre/balance`);
}

/**
 * Get Mercado Livre sales summary.
 */
export async function getMercadoLivreSales(days: number = 30): Promise<MarketplaceSalesSummary> {
  return apiClient.get(`${BASE_PATH}/mercado-livre/sales`, { params: { days } });
}

/**
 * Get TikTok Shop account balance.
 */
export async function getTikTokShopBalance(): Promise<MarketplaceBalance> {
  return apiClient.get(`${BASE_PATH}/tiktok-shop/balance`);
}
