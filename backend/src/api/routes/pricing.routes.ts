import { Router, Response, NextFunction } from 'express';
import { PricingService } from '../../services/pricing.service.js';
import { authenticate, AuthenticatedRequest, requireAdmin } from '../middleware/auth.middleware.js';
import { ProductsRepository } from '../../repositories/products.repository.js';
import { AssetsRepository } from '../../repositories/assets.repository.js';
import { StoreRepository } from '../../repositories/store.repository.js';
import { AuditLogsRepository } from '../../repositories/audit_logs.repository.js';
import type { ProductVariant, Product, Asset, GlobalFinancialSettings } from '../../../shared/types/index.js';

const router = Router();
const pricingService = new PricingService();
const productsRepo = new ProductsRepository();
const assetsRepo = new AssetsRepository();
const storeRepo = new StoreRepository();
const auditLogsRepo = new AuditLogsRepository();

interface CalculateMatrixRequest {
  variants: ProductVariant[];
  assets: Asset[];
  scenario: {
    channel: 'ecommerce' | 'marketplace' | 'wholesale';
    region_uf: string;
    target_margin_percent: number;
    commission_percent: number;
    ads_cac_target: number;
  };
  hasFreeShipping?: boolean;
  financialSettings?: GlobalFinancialSettings;
}

interface CalculateOrderEconomicsRequest {
  items: Array<{
    product_id: string;
    variant_id?: string;
    price: number;
    quantity: number;
  }>;
  total: number;
  freightRealCost: number;
  paymentMethod: 'credit_card' | 'pix';
  financialSettings?: GlobalFinancialSettings;
}

router.post('/calculate-matrix', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { variants, assets, scenario, hasFreeShipping, financialSettings } = req.body as CalculateMatrixRequest;

    if (!variants || !Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({ error: 'Variants array is required' });
    }

    if (!scenario) {
      return res.status(400).json({ error: 'Scenario is required' });
    }

    const config = financialSettings 
      ? await pricingService.buildPricingConfig(financialSettings)
      : await (async () => {
          const storeConfig = await storeRepo.getConfig();
          return pricingService.buildPricingConfig(storeConfig?.financial_settings || {} as GlobalFinancialSettings);
        })();

    const results: Record<string, any> = {};
    const freeShippingCost = 35;

    for (const variant of variants) {
      const scenarioInput = {
        channel: scenario.channel,
        regionUf: scenario.region_uf,
        targetMarginPercent: scenario.target_margin_percent,
        commissionPercent: scenario.commission_percent,
        adsCacTarget: scenario.ads_cac_target
      };

      const priceBreakdown = await pricingService.calculateSuggestedPrice({
        variant,
        assets: assets || [],
        scenario: scenarioInput,
        config
      });

      const gatewayFeePercent = config.gateway.feePercentage;
      const commissionAmount = priceBreakdown.finalPrice * (scenario.commission_percent / 100);
      const taxesAmount = priceBreakdown.taxes.totalTaxAmount + commissionAmount;

      const baseSuggestedPrice = priceBreakdown.finalPrice;
      const finalSuggestedPrice = hasFreeShipping 
        ? baseSuggestedPrice + freeShippingCost 
        : baseSuggestedPrice;

      const logisticsCost = priceBreakdown.baseCost.freightCost + priceBreakdown.baseCost.devolutionCost + priceBreakdown.baseCost.storageCost;

      results[variant.id] = {
        suggestedPrice: finalSuggestedPrice,
        breakdown: {
          production: priceBreakdown.baseCost.productionCost,
          assets: priceBreakdown.baseCost.assetsCost,
          fixed: priceBreakdown.baseCost.fixedCostAllocation,
          logistics: hasFreeShipping ? logisticsCost + freeShippingCost : logisticsCost,
          marketing: priceBreakdown.baseCost.marketingCost + scenarioInput.adsCacTarget,
          taxes: taxesAmount + (finalSuggestedPrice * gatewayFeePercent),
          margin: priceBreakdown.targetMarginAmount
        }
      };
    }

    res.json({ results });
  } catch (error: unknown) {
    next(error);
  }
});

router.post('/order-economics', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { items, total, freightRealCost, paymentMethod, financialSettings } = req.body as CalculateOrderEconomicsRequest;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    const productIds = [...new Set(items.map(item => item.product_id))];
    const products = await Promise.all(
      productIds.map(id => productsRepo.getById(id))
    );
    const validProducts = products.filter(p => p !== null) as Product[];

    const assetIds = new Set<string>();
    validProducts.forEach(product => {
      product.variants?.forEach(variant => {
        variant.correlated_assets?.forEach(link => {
          assetIds.add(link.asset_id);
        });
      });
    });

    const assets = await Promise.all(
      Array.from(assetIds).map(id => assetsRepo.getById(id))
    );
    const validAssets = assets.filter(a => a !== null) as Asset[];

    const config = financialSettings 
      ? await pricingService.buildPricingConfig(financialSettings)
      : await (async () => {
          const storeConfig = await storeRepo.getConfig();
          return pricingService.buildPricingConfig(storeConfig?.financial_settings || {} as GlobalFinancialSettings);
        })();

    const economics = await pricingService.calculateOrderEconomics({
      items,
      total,
      products: validProducts,
      assets: validAssets,
      freightRealCost: freightRealCost || 0,
      paymentMethod: paymentMethod || 'credit_card',
      config
    });

    res.json(economics);
  } catch (error: unknown) {
    next(error);
  }
});

router.post('/suggested-price', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { variant, assets, scenario, financialSettings } = req.body;

    if (!variant) {
      return res.status(400).json({ error: 'Variant is required' });
    }

    if (!scenario) {
      return res.status(400).json({ error: 'Scenario is required' });
    }

    const config = financialSettings 
      ? await pricingService.buildPricingConfig(financialSettings)
      : await (async () => {
          const storeConfig = await storeRepo.getConfig();
          return pricingService.buildPricingConfig(storeConfig?.financial_settings || {} as GlobalFinancialSettings);
        })();

    const priceBreakdown = await pricingService.calculateSuggestedPrice({
      variant,
      assets: assets || [],
      scenario,
      config
    });

    res.json(priceBreakdown);
  } catch (error: unknown) {
    next(error);
  }
});

router.get(
  '/variant/:variantId/history',
  authenticate,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { variantId } = req.params as { variantId: string };
      const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '50'), 10) || 50, 1), 100);
      const offset = Math.max(parseInt(String(req.query.offset ?? '0'), 10) || 0, 0);

      const history = await auditLogsRepo.getVariantPriceHistory({
        variantId,
        limit,
        offset,
      });

      res.json(history);
    } catch (error: unknown) {
      next(error);
    }
  }
);

export default router;
