/**
 * ImportFromMarketplaceModal - Import/link products from marketplace to local catalog
 */

import React, { useState, useEffect } from 'react';
import { X, Search, Loader2, RefreshCw, Check, Image, ChevronRight } from 'lucide-react';
import { marketplaceApi, type MLProductBasic, type MLProductFull } from '../../../../api/marketplace.api';
import { ProductsApi } from '../../../../api/products.api';
import type { Product } from '../../../../types';
import type { MarketplaceBrand, ImportFromMarketplaceModalProps, VariantPriceMapping } from '../types';
import { formatCurrency } from '../../../../utils/currency';
import { logger } from '../../../../utils/logger';

const productsApi = new ProductsApi();

// ============================================================================
// Types
// ============================================================================

type ImportStep = 'select-ml' | 'select-local' | 'configure';

// ============================================================================
// Component
// ============================================================================

export const ImportFromMarketplaceModal: React.FC<ImportFromMarketplaceModalProps> = ({
  brand,
  configId,
  onClose,
  onSuccess,
}) => {
  const [mlProducts, setMlProducts] = useState<MLProductBasic[]>([]);
  const [selectedMLProduct, setSelectedMLProduct] = useState<MLProductFull | null>(null);
  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const [selectedLocalProduct, setSelectedLocalProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ total: 0, offset: 0, limit: 20 });
  const [step, setStep] = useState<ImportStep>('select-ml');
  const [variantPrices, setVariantPrices] = useState<VariantPriceMapping[]>([]);
  const [downloadImages, setDownloadImages] = useState(true);

  // Load ML products on mount
  useEffect(() => {
    if (configId) {
      loadMLProducts();
    }
  }, [configId]);

  // Load local products for selection
  useEffect(() => {
    loadLocalProducts();
  }, []);

  const loadMLProducts = async (offset = 0) => {
    if (!configId) return;
    setIsLoading(true);
    try {
      const response = await marketplaceApi.getMarketplaceProducts(configId, {
        status: 'active',
        limit: 20,
        offset,
      });
      setMlProducts(response.products);
      setPagination({ total: response.total, offset: response.offset, limit: response.limit });
    } catch (err) {
      logger.error('Failed to load ML products', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLocalProducts = async () => {
    try {
      const all = await productsApi.getAll();
      setLocalProducts(all);
    } catch (err) {
      logger.error('Failed to load local products', err);
    }
  };

  const handleSelectMLProduct = async (product: MLProductBasic) => {
    if (!configId) return;
    setIsLoadingDetails(true);
    try {
      const details = await marketplaceApi.getMarketplaceProductDetails(configId, product.id);
      setSelectedMLProduct(details);

      // Initialize variant prices from ML product variations
      if (details.variations && details.variations.length > 0) {
        const prices = details.variations.map(v => {
          const attrs = v.attribute_combinations.map(a => a.value_name).join(' / ');
          return {
            external_variation_id: v.id,
            local_variant_id: '',
            marketplace_price: v.price,
            label: attrs || `Variação ${v.id}`,
          };
        });
        setVariantPrices(prices);
      }

      setStep('select-local');
    } catch (err) {
      logger.error('Failed to load ML product details', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleSelectLocalProduct = (product: Product) => {
    setSelectedLocalProduct(product);

    // Try to auto-match variants by name/attributes
    if (selectedMLProduct?.variations && product.variants) {
      const updatedPrices = variantPrices.map(vp => {
        // Try to find matching local variant by size or other attributes
        const mlAttrs = selectedMLProduct.variations
          .find(v => v.id === vp.external_variation_id)
          ?.attribute_combinations.map(a => a.value_name.toLowerCase()) || [];

        const matchingVariant = product.variants?.find(lv => {
          const lvSize = lv.size?.toLowerCase() || '';
          const lvColor = lv.color_name?.pt?.toLowerCase() || '';
          return mlAttrs.some(attr => attr.includes(lvSize) || attr.includes(lvColor) || lvSize.includes(attr) || lvColor.includes(attr));
        });

        return {
          ...vp,
          local_variant_id: matchingVariant?.id || '',
        };
      });
      setVariantPrices(updatedPrices);
    }

    setStep('configure');
  };

  const handleLink = async () => {
    if (!configId || !selectedMLProduct || !selectedLocalProduct) return;
    setIsSaving(true);
    try {
      // Prepare variant prices mapping
      const validVariantPrices = variantPrices
        .filter(vp => vp.local_variant_id)
        .map(vp => ({
          external_variation_id: vp.external_variation_id,
          local_variant_id: vp.local_variant_id,
          marketplace_price: vp.marketplace_price,
        }));

      await marketplaceApi.linkMarketplaceProduct(
        configId,
        selectedMLProduct.id,
        selectedLocalProduct.id,
        {
          variant_prices: validVariantPrices.length > 0 ? validVariantPrices : undefined,
          download_images: downloadImages,
        }
      );
      onSuccess();
    } catch (err) {
      logger.error('Failed to link product', err);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredMLProducts = mlProducts.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLocalProducts = localProducts.filter(p => {
    const name = p.name?.pt || p.name?.en || '';
    return name.toLowerCase().includes(localSearchTerm.toLowerCase());
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col relative">
        {/* Header */}
        <div className={`px-6 py-4 bg-gradient-to-r ${brand.bgGradient} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1.5">
              <img src={brand.logo} alt={brand.name} className="max-w-full max-h-full object-contain" />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${brand.textColor}`}>
                Importar do {brand.name}
              </h2>
              <p className={`text-xs ${brand.textColor} opacity-80`}>
                Vincular produto do {brand.name} ao catálogo local
              </p>
            </div>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg bg-white/20 hover:bg-white/30 ${brand.textColor}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="px-6 py-3 bg-neutral-50 border-b flex items-center gap-4">
          <div className={`flex items-center gap-2 ${step === 'select-ml' ? 'text-black font-medium' : 'text-neutral-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'select-ml' ? 'bg-black text-white' : 'bg-neutral-200'}`}>1</div>
            Selecionar do {brand.shortName}
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-300" />
          <div className={`flex items-center gap-2 ${step === 'select-local' ? 'text-black font-medium' : 'text-neutral-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'select-local' ? 'bg-black text-white' : 'bg-neutral-200'}`}>2</div>
            Vincular ao Local
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-300" />
          <div className={`flex items-center gap-2 ${step === 'configure' ? 'text-black font-medium' : 'text-neutral-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'configure' ? 'bg-black text-white' : 'bg-neutral-200'}`}>3</div>
            Configurar
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Select ML Product */}
          {step === 'select-ml' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={`Buscar produtos no ${brand.name}...`}
                    className="w-full pl-10 pr-4 py-3 border rounded-xl"
                  />
                </div>
                <button
                  onClick={() => loadMLProducts(0)}
                  disabled={isLoading}
                  className="px-4 py-3 border rounded-xl hover:bg-neutral-50"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                </button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredMLProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleSelectMLProduct(product)}
                      className="border rounded-xl overflow-hidden cursor-pointer hover:border-neutral-400 transition-colors"
                    >
                      <div className="aspect-square bg-neutral-100">
                        {product.thumbnail ? (
                          <img src={product.thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Image className="w-12 h-12 text-neutral-300" />
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h4 className="font-medium text-sm mb-1 line-clamp-2">{product.title}</h4>
                        <p className="text-lg font-bold" style={{ color: brand.accentColor }}>
                          {formatCurrency(product.price, 'pt')}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            product.status === 'active' ? 'bg-green-100 text-green-700' :
                            product.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {product.status === 'active' ? 'Ativo' : product.status === 'paused' ? 'Pausado' : 'Fechado'}
                          </span>
                          {product.variations && product.variations.length > 0 && (
                            <span className="text-xs text-neutral-500">
                              {product.variations.length} variações
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination.total > pagination.limit && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <button
                    onClick={() => loadMLProducts(Math.max(0, pagination.offset - pagination.limit))}
                    disabled={pagination.offset === 0 || isLoading}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-neutral-500">
                    {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} de {pagination.total}
                  </span>
                  <button
                    onClick={() => loadMLProducts(pagination.offset + pagination.limit)}
                    disabled={pagination.offset + pagination.limit >= pagination.total || isLoading}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50"
                  >
                    Próximo
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Local Product */}
          {step === 'select-local' && selectedMLProduct && (
            <div className="grid grid-cols-2 gap-6">
              {/* ML Product Preview */}
              <div className="space-y-4">
                <h3 className="font-bold">Produto do {brand.name}</h3>
                <div className="border rounded-xl overflow-hidden">
                  <div className="aspect-video bg-neutral-100">
                    {selectedMLProduct.pictures?.[0] ? (
                      <img src={selectedMLProduct.pictures[0].secure_url || selectedMLProduct.pictures[0].url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="w-12 h-12 text-neutral-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <h4 className="font-medium">{selectedMLProduct.title}</h4>
                    <p className="text-xl font-bold" style={{ color: brand.accentColor }}>
                      {formatCurrency(selectedMLProduct.price, 'pt')}
                    </p>
                    {selectedMLProduct.variations.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                        <p className="font-medium text-blue-700">{selectedMLProduct.variations.length} variações</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedMLProduct.variations.slice(0, 5).map((v, i) => (
                            <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              {v.attribute_combinations.map(a => a.value_name).join(' / ')}
                            </span>
                          ))}
                          {selectedMLProduct.variations.length > 5 && (
                            <span className="text-xs text-blue-600">+{selectedMLProduct.variations.length - 5} mais</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedMLProduct(null);
                    setStep('select-ml');
                  }}
                  className="w-full py-2 border rounded-xl hover:bg-neutral-50"
                >
                  ← Escolher outro produto
                </button>
              </div>

              {/* Local Products Selection */}
              <div className="space-y-4">
                <h3 className="font-bold">Vincular ao Produto Local</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    value={localSearchTerm}
                    onChange={(e) => setLocalSearchTerm(e.target.value)}
                    placeholder="Buscar no catálogo local..."
                    className="w-full pl-10 pr-4 py-3 border rounded-xl"
                  />
                </div>
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {filteredLocalProducts.slice(0, 20).map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleSelectLocalProduct(product)}
                      className="flex gap-3 p-3 border rounded-xl cursor-pointer hover:border-neutral-400 transition-colors"
                    >
                      <div className="w-16 h-16 bg-neutral-100 rounded-lg flex-shrink-0">
                        {product.base_images?.[0] || product.default_image_url ? (
                          <img src={product.base_images?.[0] || product.default_image_url} alt="" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Image className="w-6 h-6 text-neutral-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{product.name?.pt || product.name?.en || 'Produto'}</h4>
                        <p className="text-sm font-bold">{formatCurrency(product.variants?.[0]?.retail_price || 0, 'pt')}</p>
                        {product.variants && product.variants.length > 1 && (
                          <span className="text-xs text-neutral-500">{product.variants.length} variantes</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Configure */}
          {step === 'configure' && selectedMLProduct && selectedLocalProduct && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-6">
                <div className="border rounded-xl p-4">
                  <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">{brand.name}</p>
                  <div className="flex gap-3">
                    <div className="w-16 h-16 bg-neutral-100 rounded-lg">
                      {selectedMLProduct.pictures?.[0] && (
                        <img src={selectedMLProduct.pictures[0].secure_url} alt="" className="w-full h-full object-cover rounded-lg" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{selectedMLProduct.title}</h4>
                      <p className="text-lg font-bold" style={{ color: brand.accentColor }}>{formatCurrency(selectedMLProduct.price, 'pt')}</p>
                    </div>
                  </div>
                </div>
                <div className="border rounded-xl p-4">
                  <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Produto Local</p>
                  <div className="flex gap-3">
                    <div className="w-16 h-16 bg-neutral-100 rounded-lg">
                      {(selectedLocalProduct.base_images?.[0] || selectedLocalProduct.default_image_url) && (
                        <img src={selectedLocalProduct.base_images?.[0] || selectedLocalProduct.default_image_url} alt="" className="w-full h-full object-cover rounded-lg" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{selectedLocalProduct.name?.pt || selectedLocalProduct.name?.en}</h4>
                      <p className="text-lg font-bold">{formatCurrency(selectedLocalProduct.variants?.[0]?.retail_price || 0, 'pt')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Variant Mapping */}
              {variantPrices.length > 0 && selectedLocalProduct.variants && selectedLocalProduct.variants.length > 0 && (
                <div className="border rounded-xl p-4">
                  <h4 className="font-bold mb-4">Mapeamento de Variações</h4>
                  <div className="space-y-3">
                    {variantPrices.map((vp, index) => (
                      <div key={vp.external_variation_id} className="flex items-center gap-4 p-3 bg-neutral-50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{vp.label}</p>
                          <p className="text-xs text-neutral-500">Preço ML: {formatCurrency(vp.marketplace_price, 'pt')}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-neutral-400" />
                        <div className="flex-1">
                          <select
                            value={vp.local_variant_id}
                            onChange={(e) => {
                              const updated = [...variantPrices];
                              updated[index].local_variant_id = e.target.value;
                              setVariantPrices(updated);
                            }}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          >
                            <option value="">Selecionar variante...</option>
                            {selectedLocalProduct.variants?.map((lv) => (
                              <option key={lv.id} value={lv.id}>
                                {lv.size || lv.color_name?.pt || lv.sku || 'Variante'}
                                {lv.size && lv.color_name?.pt ? ` (${lv.size} / ${lv.color_name?.pt})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Options */}
              <div className="border rounded-xl p-4 space-y-3">
                <h4 className="font-bold">Opções</h4>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={downloadImages}
                    onChange={(e) => setDownloadImages(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm">Baixar imagens do {brand.name} para o Supabase Storage</span>
                </label>
              </div>

              <button
                onClick={() => {
                  setSelectedLocalProduct(null);
                  setStep('select-local');
                }}
                className="w-full py-2 border rounded-xl hover:bg-neutral-50"
              >
                ← Escolher outro produto local
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 border rounded-xl hover:bg-neutral-50">
            Cancelar
          </button>
          {step === 'configure' && selectedMLProduct && selectedLocalProduct && (
            <button
              onClick={handleLink}
              disabled={isSaving}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium ${brand.bgColor} ${brand.textColor}`}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Vincular Produto
            </button>
          )}
        </div>

        {/* Loading overlay for details */}
        {isLoadingDetails && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
          </div>
        )}
      </div>
    </div>
  );
};
