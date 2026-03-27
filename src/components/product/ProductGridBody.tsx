import React, { useCallback } from 'react';
import { Product, UserMode, Coupon } from '../../types';
import { Locale } from '../../i18n';
import { ProductCard } from './ProductCard';
import { ProductGridSkeleton } from './ProductGridSkeleton';
import { ProductPagination } from './ProductPagination';

export interface ProductGridBodyProps {
  products: Product[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  hasActiveFilters: boolean;
  userMode: UserMode;
  locale: Locale;
  coupons: Coupon[];
  wishlistIds: string[];
  selectedColorFamilies: string[];
  itemsPerPage: number;
  onToggleWishlist: (id: string) => void;
  onAddToCart?: (item: any) => void;
  onQuickAdd: (product: Product, colorHex?: string | null) => void;
  onSelectProduct: (product: Product) => void;
  onClearFilters: () => void;
  onPageChange: (page: number) => void;
  t: (key: string) => string;
}

export const ProductGridBody: React.FC<ProductGridBodyProps> = ({
  products,
  isLoading,
  currentPage,
  totalPages,
  hasActiveFilters,
  userMode,
  locale,
  coupons,
  wishlistIds,
  selectedColorFamilies,
  itemsPerPage,
  onToggleWishlist,
  onAddToCart,
  onQuickAdd,
  onSelectProduct,
  onClearFilters,
  onPageChange,
  t,
}) => {
  const handleQuickAdd = useCallback(
    (product: Product, colorHex?: string | null) => {
      onQuickAdd(product, colorHex);
    },
    [onQuickAdd],
  );

  return (
    <div>
      {/* Results Count */}
      <div className="mb-6 flex items-center justify-between px-6 md:px-12">
        <p className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium">
          {products.length} {products.length === 1 ? 'produto' : 'produtos'}
        </p>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-[11px] text-neutral-500 hover:text-neutral-900 underline underline-offset-2 transition-colors"
          >
            {t('grid.clearFilters')}
          </button>
        )}
      </div>

      {isLoading ? (
        <ProductGridSkeleton count={itemsPerPage} />
      ) : products.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center px-6 gap-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-300">
            {hasActiveFilters
              ? (locale === 'pt' ? 'Nenhum produto com esses filtros' : locale === 'es' ? 'Sin productos con estos filtros' : 'No products match these filters')
              : t('grid.noItems')
            }
          </p>
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="px-5 py-2 border border-neutral-300 text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-600 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-all rounded-full"
            >
              {t('grid.clearFilters')}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3 px-2 md:px-3">
          {products.map((p, index) => (
            <div key={p.id}>
              <ProductCard
                product={p}
                priority={index < 6}
                userMode={userMode}
                locale={locale}
                coupons={coupons}
                variant="grid"
                aspectRatio="portrait"
                showWishlist={true}
                showQuickAdd={!!onAddToCart}
                showDiscountBadge={true}
                showColorSwatches={true}
                isWishlisted={wishlistIds.includes(p.id)}
                onToggleWishlist={onToggleWishlist}
                onAddToCart={onAddToCart}
                onQuickAdd={handleQuickAdd}
                onClick={() => onSelectProduct(p)}
                selectedColorFamilies={selectedColorFamilies.length > 0 ? selectedColorFamilies : undefined}
              />
            </div>
          ))}
        </div>
      )}

      {!isLoading && (
        <ProductPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          t={t}
        />
      )}
    </div>
  );
};
