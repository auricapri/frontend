/**
 * ImportProductModal - Import local products to marketplace
 */

import React, { useState, useEffect } from 'react';
import { X, Search, Loader2, Upload, Image } from 'lucide-react';
import { marketplaceApi, type FeeCalculation } from '../../../../api/marketplace.api';
import { ProductsApi } from '../../../../api/products.api';
import type { Product } from '../../../../types';
import type { MarketplaceBrand, VariantPrice, ImportProductModalProps } from '../types';
import { PricingCalculator } from '../components/PricingCalculator';
import { DescriptionEditor } from '../components/DescriptionEditor';
import { logger } from '../../../../utils/logger';

const productsApi = new ProductsApi();

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate variant pricing with marketplace commission
 */
export const calculateVariantPricing = (
  costPrice: number,
  marketplacePrice: number,
  commissionPercent: number = 11 // Default ML
) => {
  const commission = marketplacePrice * (commissionPercent / 100);
  const netRevenue = marketplacePrice - commission;
  const profit = netRevenue - costPrice;
  const marginPercent = costPrice > 0 ? ((profit / costPrice) * 100) : 0;

  return {
    commission,
    netRevenue,
    profit,
    marginPercent,
  };
};

// ============================================================================
// Component
// ============================================================================

export const ImportProductModal: React.FC<ImportProductModalProps> = ({
  brand,
  configId,
  localProducts,
  onClose,
  onSuccess,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    price: 0,
    description: '',
    costPrice: 0,
  });
  const [allProductsCache, setAllProductsCache] = useState<Product[]>([]);
  const [feeData, setFeeData] = useState<FeeCalculation | null>(null);
  const [variantPrices, setVariantPrices] = useState<VariantPrice[]>([]);
  const [showVariantPricing, setShowVariantPricing] = useState(false);

  // Load products on mount
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        // Use localProducts if available, otherwise fetch
        const all = localProducts && localProducts.length > 0 ? localProducts : await productsApi.getAll();
        setAllProductsCache(all);
        // Show first 20 products initially
        const mapped = all.slice(0, 20).map((p: Product) => {
          const totalStock = p.variants?.reduce((sum, v) => sum + (v.stock_quantity || 0), 0) || 0;
          const images = p.base_images?.length ? p.base_images : (p.default_image_url ? [p.default_image_url] : []);
          const description = p.description?.pt || p.description?.en || '';
          return {
            id: p.id,
            name: p.name?.pt || p.name?.en || 'Produto sem nome',
            description,
            stock: totalStock,
            images,
            variants: p.variants || [],
          };
        });
        setProducts(mapped);
      } catch (err) {
        logger.error('Failed to load products', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, [localProducts]);

  // Search products from cache
  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const allProducts = allProductsCache.length > 0 ? allProductsCache : await productsApi.getAll();
      if (allProductsCache.length === 0) {
        setAllProductsCache(allProducts);
      }

      const searchLower = searchTerm.toLowerCase().trim();
      const filtered = searchLower
        ? allProducts.filter((p: Product) => {
            const name = p.name?.pt || p.name?.en || '';
            const sku = p.variants?.[0]?.sku || '';
            return name.toLowerCase().includes(searchLower) || sku.toLowerCase().includes(searchLower);
          })
        : allProducts;

      const mapped = filtered.slice(0, 20).map((p: Product) => {
        const totalStock = p.variants?.reduce((sum, v) => sum + (v.stock_quantity || 0), 0) || 0;
        const images = p.base_images?.length ? p.base_images : (p.default_image_url ? [p.default_image_url] : []);
        const description = p.description?.pt || p.description?.en || '';
        return {
          id: p.id,
          name: p.name?.pt || p.name?.en || 'Produto sem nome',
          description,
          stock: totalStock,
          images,
          variants: p.variants || [],
        };
      });

      setProducts(mapped);
    } catch (err) {
      logger.error('Failed to search products', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedProduct || !configId) return;
    setIsSaving(true);
    try {
      // Create main product mapping
      await marketplaceApi.createMapping({
        config_id: configId,
        product_id: selectedProduct.id,
        marketplace_price: formData.price || selectedProduct.price,
      });

      // If variant pricing is enabled, create individual variant mappings
      if (showVariantPricing && variantPrices.length > 0) {
        for (const vp of variantPrices) {
          await marketplaceApi.createMapping({
            config_id: configId,
            product_id: selectedProduct.id,
            variant_id: vp.variantId,
            marketplace_price: vp.marketplacePrice,
          });
        }
      }

      onSuccess();
    } catch (err) {
      logger.error('Failed to import product', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product);

    // Get price from first variant as suggestion
    const firstV = product.variants?.[0];
    const suggestedPrice = firstV?.retail_price || 0;
    const suggestedCostPrice = firstV?.cost_price || suggestedPrice * 0.4;
    const defaultCommission = 11; // Default ML

    setFormData({
      price: suggestedPrice,
      description: product.description || '',
      costPrice: suggestedCostPrice,
    });

    // Initialize variantPrices
    const prices = (product.variants || []).map((v: any) => {
      const vCostPrice = v.cost_price || suggestedCostPrice;
      const vMarketplacePrice = v.retail_price || suggestedPrice;
      const calc = calculateVariantPricing(vCostPrice, vMarketplacePrice, defaultCommission);

      return {
        variantId: v.id,
        variantLabel: [v.size, v.color_name?.pt].filter(Boolean).join(' / ') || v.sku || 'Variante',
        costPrice: vCostPrice,
        retailPrice: v.retail_price || 0,
        marketplacePrice: vMarketplacePrice,
        image: v.variant_images?.[0] || product.images?.[0] || null,
        stock: v.stock_quantity || 0,
        sku: v.sku || '',
        colorHex: v.color_hex || null,
        size: v.size || null,
        colorName: v.color_name?.pt || null,
        marginPercent: calc.marginPercent,
        estimatedProfit: calc.profit,
        commissionPercent: defaultCommission,
      };
    });
    setVariantPrices(prices);
    setShowVariantPricing(true);
  };

  const updateVariantPrice = (index: number, newPrice: number) => {
    const vp = variantPrices[index];
    const newCalc = calculateVariantPricing(vp.costPrice, newPrice, vp.commissionPercent);
    const updated = [...variantPrices];
    updated[index] = {
      ...updated[index],
      marketplacePrice: newPrice,
      marginPercent: newCalc.marginPercent,
      estimatedProfit: newCalc.profit,
    };
    setVariantPrices(updated);
  };

  const applyPriceToAllVariants = () => {
    const defaultCommission = 11;
    const updated = variantPrices.map(vp => {
      const calc = calculateVariantPricing(vp.costPrice, formData.price, defaultCommission);
      return {
        ...vp,
        marketplacePrice: formData.price,
        marginPercent: calc.marginPercent,
        estimatedProfit: calc.profit,
      };
    });
    setVariantPrices(updated);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`px-6 py-4 bg-gradient-to-r ${brand.bgGradient} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1.5">
              <img src={brand.logo} alt={brand.name} className="max-w-full max-h-full object-contain" />
            </div>
            <h2 className={`text-lg font-bold ${brand.textColor}`}>
              Adicionar Produto ao {brand.name}
            </h2>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg bg-white/20 hover:bg-white/30 ${brand.textColor}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!selectedProduct ? (
            <div className="space-y-4">
              {/* Search */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Buscar produtos do catálogo..."
                    className="w-full pl-10 pr-4 py-3 border rounded-xl"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className={`px-6 py-3 rounded-xl font-medium ${brand.bgColor} ${brand.textColor}`}
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buscar'}
                </button>
              </div>

              {/* Results */}
              <div className="grid grid-cols-2 gap-4">
                {products.map((product) => {
                  const firstVariant = product.variants?.[0];
                  const displayPrice = firstVariant?.retail_price || 0;
                  const variantCount = product.variants?.length || 0;

                  return (
                    <div
                      key={product.id}
                      onClick={() => handleSelectProduct(product)}
                      className="flex gap-4 p-4 border rounded-xl cursor-pointer hover:border-neutral-400 transition-colors"
                    >
                      <div className="w-20 h-20 bg-neutral-100 rounded-lg flex items-center justify-center">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt="" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Image className="w-8 h-8 text-neutral-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{product.name}</h4>
                        <p className="text-lg font-bold" style={{ color: brand.accentColor }}>
                          R$ {displayPrice.toFixed(2)}
                          {variantCount > 1 && (
                            <span className="text-xs font-normal text-neutral-500 ml-1">
                              ({variantCount} variantes)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-neutral-500">Estoque: {product.stock}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column - Preview and Info */}
              <div className="space-y-4">
                <h3 className="font-bold">Preview no {brand.name}</h3>
                <div className="border rounded-xl overflow-hidden">
                  <div className="aspect-square bg-neutral-100 flex items-center justify-center">
                    {selectedProduct.images?.[0] ? (
                      <img src={selectedProduct.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Image className="w-16 h-16 text-neutral-300" />
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-medium mb-2">{selectedProduct.name}</h4>
                    <p className="text-2xl font-bold" style={{ color: brand.accentColor }}>
                      R$ {formData.price.toFixed(2)}
                    </p>
                    <p className="text-sm text-green-600 mt-1">Frete grátis</p>
                    {feeData && (
                      <div className="mt-2 text-xs text-neutral-500">
                        Lucro estimado: <span className={feeData.net_revenue - formData.costPrice > 0 ? 'text-green-600' : 'text-red-600'}>
                          R$ {(feeData.net_revenue - formData.costPrice).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Variant Cards */}
                {variantPrices.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-neutral-700">
                        📦 {variantPrices.length} variante{variantPrices.length > 1 ? 's' : ''} para publicar
                      </p>
                      <button
                        onClick={() => setShowVariantPricing(!showVariantPricing)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          showVariantPricing
                            ? 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                            : `${brand.bgColor} ${brand.textColor}`
                        }`}
                      >
                        {showVariantPricing ? 'Ocultar Detalhes' : 'Ver Detalhes'}
                      </button>
                    </div>

                    {showVariantPricing && (
                      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                        {variantPrices.map((vp, index) => {
                          const calc = calculateVariantPricing(vp.costPrice, vp.marketplacePrice, vp.commissionPercent);

                          return (
                            <div
                              key={vp.variantId}
                              className="p-3 bg-white border border-neutral-200 rounded-xl hover:border-neutral-300 transition-colors"
                            >
                              <div className="flex items-start gap-3">
                                {/* Thumbnail */}
                                <div className="w-16 h-16 bg-neutral-100 rounded-lg flex-shrink-0 overflow-hidden">
                                  {vp.image ? (
                                    <img src={vp.image} alt={vp.variantLabel} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Image className="w-6 h-6 text-neutral-300" />
                                    </div>
                                  )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    {vp.colorHex && (
                                      <div
                                        className="w-4 h-4 rounded-full border border-neutral-300 flex-shrink-0"
                                        style={{ backgroundColor: vp.colorHex }}
                                        title={vp.colorName || 'Cor'}
                                      />
                                    )}
                                    <span className="font-medium text-sm">{vp.variantLabel}</span>
                                    <span className={`text-xs px-1.5 py-0.5 rounded ${vp.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                      {vp.stock} un.
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1">
                                    <span>SKU: {vp.sku || '—'}</span>
                                    <span>Custo: R$ {vp.costPrice.toFixed(2)}</span>
                                  </div>
                                </div>

                                {/* Price Input */}
                                <div className="flex-shrink-0 text-right">
                                  <label className="text-xs text-neutral-500 block mb-1">Preço ML</label>
                                  <div className="relative w-28">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-neutral-400">R$</span>
                                    <input
                                      type="number"
                                      value={vp.marketplacePrice}
                                      onChange={(e) => updateVariantPrice(index, parseFloat(e.target.value) || 0)}
                                      className="w-full pl-7 pr-2 py-2 border border-neutral-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      step="0.01"
                                      min="0"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Margin Calculation */}
                              <div className="mt-2 pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-4">
                                  <span className="text-neutral-500">
                                    Taxa ML: <span className="text-neutral-700">{vp.commissionPercent}%</span>
                                  </span>
                                  <span className={`font-medium ${calc.marginPercent >= 30 ? 'text-green-600' : calc.marginPercent >= 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                                    Margem: {calc.marginPercent.toFixed(1)}%
                                  </span>
                                </div>
                                <span className={`font-bold ${calc.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  Lucro: R$ {calc.profit.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Quick Actions and Summary */}
                    <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
                      <div className="text-xs text-neutral-500">
                        <span>Total: <strong>{variantPrices.reduce((sum, v) => sum + v.stock, 0)}</strong> un.</span>
                        <span className="mx-2">|</span>
                        <span>
                          Lucro médio:{' '}
                          <strong className={variantPrices.reduce((sum, vp) => sum + calculateVariantPricing(vp.costPrice, vp.marketplacePrice, vp.commissionPercent).profit, 0) / variantPrices.length >= 0 ? 'text-green-600' : 'text-red-600'}>
                            R$ {(variantPrices.reduce((sum, vp) => sum + calculateVariantPricing(vp.costPrice, vp.marketplacePrice, vp.commissionPercent).profit, 0) / variantPrices.length).toFixed(2)}
                          </strong>
                        </span>
                      </div>
                      <button
                        onClick={applyPriceToAllVariants}
                        className="text-xs font-medium hover:underline"
                        style={{ color: brand.accentColor }}
                      >
                        Aplicar R$ {formData.price.toFixed(2)} a todas
                      </button>
                    </div>
                  </div>
                )}

                {/* Fallback for products without variants */}
                {variantPrices.length === 0 && (
                  <div className="bg-neutral-50 rounded-xl p-4">
                    <p className="text-sm text-neutral-600">
                      <strong>Estoque:</strong> {selectedProduct.stock} unidades
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      O estoque é sincronizado automaticamente do site.
                    </p>
                  </div>
                )}

                <button
                  onClick={() => {
                    setSelectedProduct(null);
                    setFeeData(null);
                  }}
                  className="w-full py-2 border rounded-xl hover:bg-neutral-50"
                >
                  ← Escolher outro produto
                </button>
              </div>

              {/* Right Column - Form */}
              <div className="space-y-4">
                <h3 className="font-bold">Configurar Produto</h3>

                <PricingCalculator
                  brand={brand}
                  costPrice={formData.costPrice}
                  configId={configId}
                  initialPrice={formData.price}
                  onPriceChange={(price, data) => {
                    setFormData({ ...formData, price });
                    if (data) setFeeData(data);
                  }}
                />

                <DescriptionEditor
                  brand={brand}
                  value={formData.description}
                  originalDescription={selectedProduct.description}
                  onChange={(description) => setFormData({ ...formData, description })}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedProduct && (
          <div className="px-6 py-4 border-t flex justify-end gap-3">
            <button onClick={onClose} className="px-6 py-2.5 border rounded-xl hover:bg-neutral-50">
              Cancelar
            </button>
            <button
              onClick={handleImport}
              disabled={isSaving}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium ${brand.bgColor} ${brand.textColor}`}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Publicar no {brand.name}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
