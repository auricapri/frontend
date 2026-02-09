/**
 * AdminOrders Helper Functions
 */
import { Order, Product, Asset } from '../../../types';
import { Locale } from '../../../i18n';
import type { SLAStatus, LogisticsMetrics, ExtendedOrderEconomics } from './types';

/**
 * Calculate SLA status for an order
 */
export const getSLAStatus = (order: Order): SLAStatus => {
  const daysEst = order.internal_logistics?.estimated_days || 5;
  const created = new Date(order.created_at);
  const deadline = new Date(created);
  deadline.setDate(deadline.getDate() + daysEst);

  const now = new Date();
  const diffTime = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return { color: 'bg-red-50 border-red-200 text-red-800', priority: 3, label: 'HOJE' };
  }
  if (diffDays === 1) {
    return { color: 'bg-yellow-50 border-yellow-200 text-yellow-800', priority: 2, label: 'AMANHA' };
  }
  return { color: 'bg-white border-neutral-100 hover:border-blue-200', priority: 1, label: 'NORMAL' };
};

/**
 * Create localization getter function
 */
export const createGetLoc = (locale: Locale) => (obj: any): string => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[locale] || obj['pt'] || obj['en'] || Object.values(obj)[0] || '';
};

/**
 * Format date for display
 */
export const formatDate = (dateStr: string, locale: Locale): string => {
  return new Date(dateStr).toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Calculate logistics metrics for an order
 */
export const calculateLogisticsMetrics = (
  order: Order,
  products: Product[],
  assets: Asset[]
): LogisticsMetrics => {
  let totalWeight = 0;
  let maxLen = 0;
  let maxWid = 0;
  let totalHeight = 0;

  order.items.forEach((item) => {
    const product = products.find((p) => p.id === item.product_id);
    const rawId = item.variant_id || item.id;
    const variantId = rawId ? rawId.split('_')[0] : null;
    const variant = product?.variants?.find((v) => v.id === variantId) || product?.variants?.[0];

    if (variant) {
      totalWeight += (variant.weight_g || 0) * item.quantity;
      if (variant.correlated_assets) {
        variant.correlated_assets.forEach((link) => {
          const asset = assets.find((a) => a.id === link.asset_id);
          if (asset) {
            totalWeight += (asset.weight_g || 0) * link.quantity_required * item.quantity;
          }
        });
      }
      if (variant.dimensions) {
        maxLen = Math.max(maxLen, variant.dimensions.length);
        maxWid = Math.max(maxWid, variant.dimensions.width);
        totalHeight += variant.dimensions.height * item.quantity;
      }
    }
  });

  // Default values if calculations result in zero
  if (totalWeight === 0) totalWeight = 500;
  if (maxLen === 0) maxLen = 20;
  if (maxWid === 0) maxWid = 15;
  if (totalHeight === 0) totalHeight = 10;

  return {
    totalWeight,
    dimensions: `${Math.round(maxLen)}x${Math.round(maxWid)}x${Math.round(totalHeight)}`,
  };
};

/**
 * Calculate order economics (placeholder implementation)
 */
export const calculateOrderEconomics = async (order: Order): Promise<ExtendedOrderEconomics> => {
  // NOTE: This should ideally be implemented in the backend (PricingApi)
  // For now, we calculate basic values locally
  const gatewayRate = order.payment_method === 'pix' ? 0.0099 : 0.0399;
  const freightReal = order.internal_logistics?.real_cost ?? 0;
  const gatewayFee = order.total * gatewayRate;
  const estimatedCogs = order.total * 0.3; // Placeholder - should fetch real product cost
  const totalVariableCosts = freightReal + gatewayFee + estimatedCogs;
  const netProfit = order.total - totalVariableCosts;
  const marginPercent = order.total > 0 ? (netProfit / order.total) * 100 : 0;

  return {
    revenue: order.total,
    cogs: estimatedCogs,
    freightReal,
    gatewayFee,
    dasProportional: 0,
    totalVariableCosts,
    netProfit,
    marginPercent,
    gatewayRate,
    taxRate: 0,
  };
};
