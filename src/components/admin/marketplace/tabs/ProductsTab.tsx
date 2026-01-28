/**
 * ProductsTab - Marketplace products grid with search and actions
 */

import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit3,
  ExternalLink,
  Image,
  Loader2,
} from 'lucide-react';
import { marketplaceApi } from '../../../../api/marketplace.api';
import { formatCurrency, type Locale } from '../../../../utils/currency';
import { logger } from '../../../../utils/logger';
import { ProductEditModal } from '../modals/ProductEditModal';
import type { MarketplaceBrand } from '../types';

// ============================================================================
// Component Props
// ============================================================================

export interface ProductsTabProps {
  brand: MarketplaceBrand;
  configId?: string;
  locale: string;
  onImport: () => void;
}

// ============================================================================
// Component
// ============================================================================

export const ProductsTab: React.FC<ProductsTabProps> = ({
  brand,
  configId,
  locale,
  onImport,
}) => {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  useEffect(() => {
    loadProducts();
  }, [configId]);

  const loadProducts = async () => {
    if (!configId) return;
    try {
      const mappings = await marketplaceApi.getMappings({ config_id: configId, limit: 100 });
      setProducts(mappings);
    } catch (err) {
      logger.error('Failed to load products', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-2xl flex items-center justify-center">
          <Package className="w-8 h-8 text-neutral-400" />
        </div>
        <h3 className="text-lg font-bold mb-2">Nenhum produto ainda</h3>
        <p className="text-neutral-500 mb-6">
          Importe seus produtos do catálogo para começar a vender no {brand.name}
        </p>
        <button
          onClick={onImport}
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium ${brand.bgColor} ${brand.textColor}`}
        >
          <Plus className="w-5 h-5" />
          Importar Produtos
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar produtos..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-black focus:border-black"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 border rounded-xl hover:bg-neutral-50">
            <Filter className="w-4 h-4" />
            Filtros
          </button>
          <button
            onClick={onImport}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium ${brand.bgColor} ${brand.textColor}`}
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </button>
        </div>
      </div>

      {/* Products Grid - ML Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product: any) => (
          <div
            key={product.id}
            className="bg-white rounded-xl border hover:shadow-lg transition-all cursor-pointer group"
            onClick={() => setSelectedProduct(product)}
          >
            {/* Image */}
            <div className="aspect-square bg-neutral-100 rounded-t-xl overflow-hidden relative">
              {product.product?.images?.[0] ? (
                <img
                  src={product.product.images[0]}
                  alt={product.product?.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Image className="w-12 h-12 text-neutral-300" />
                </div>
              )}
              {/* Status badge */}
              <div
                className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                  product.sync_status === 'synced'
                    ? 'bg-green-100 text-green-700'
                    : product.sync_status === 'error'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {product.sync_status === 'synced'
                  ? 'Ativo'
                  : product.sync_status === 'error'
                  ? 'Erro'
                  : 'Pendente'}
              </div>
            </div>

            {/* Info */}
            <div className="p-4">
              <h4 className="font-medium text-sm line-clamp-2 mb-2">
                {product.product?.name || 'Produto sem nome'}
              </h4>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold" style={{ color: brand.accentColor }}>
                  {formatCurrency(
                    product.marketplace_price ||
                      product.product?.variants?.[0]?.retail_price ||
                      0,
                    locale as Locale
                  )}
                </span>
                <span className="text-xs text-neutral-500">
                  Estoque:{' '}
                  {product.product?.variants?.reduce(
                    (sum: number, v: any) => sum + (v.stock_quantity || 0),
                    0
                  ) || 0}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="px-4 pb-4 flex gap-2">
              <button
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedProduct(product);
                }}
              >
                <Edit3 className="w-3 h-3" />
                Editar
              </button>
              <button
                className="flex items-center justify-center px-3 py-2 text-xs font-medium bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  if (product.external_url) window.open(product.external_url, '_blank');
                }}
              >
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Product Edit Modal */}
      {selectedProduct && (
        <ProductEditModal
          brand={brand}
          product={selectedProduct}
          locale={locale}
          onClose={() => setSelectedProduct(null)}
          onSave={async () => {
            setSelectedProduct(null);
            loadProducts();
          }}
        />
      )}
    </div>
  );
};
