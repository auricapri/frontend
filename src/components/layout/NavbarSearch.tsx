import React, { useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Product } from '../../types';
import { Locale } from '../../i18n';
import { createGetLoc } from '../../utils/localization';
import { slugify } from '../../utils/urlUtils';
import { getOptimizedImageUrl } from '../../utils/image';
import { formatCurrency } from '../../utils/currency';

export interface NavbarSearchProps {
  isOpen: boolean;
  isSolid: boolean;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onClose: () => void;
  onNavigate: (view: any, target?: string) => void;
  products: Product[];
  currentLocale: Locale;
  onSelectProduct?: (product: Product) => void;
  showTestBanner: boolean;
}

export const NavbarSearch: React.FC<NavbarSearchProps> = ({
  isOpen,
  isSolid,
  searchQuery,
  onSearchQueryChange,
  onClose,
  onNavigate,
  products,
  currentLocale,
  onSelectProduct,
  showTestBanner,
}) => {
  const getLoc = React.useMemo(() => createGetLoc(currentLocale), [currentLocale]);

  const searchSuggestions = React.useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2 || !products.length) return [];
    const q = searchQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return products
      .filter((p) => {
        const name = getLoc(p.name).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return name.includes(q) && p.is_active;
      })
      .slice(0, 10);
  }, [searchQuery, products, getLoc]);

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      const slug = slugify(searchQuery);
      onNavigate('search-results' as any, slug);
      onClose();
    }
  }, [searchQuery, onNavigate, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    },
    [handleSearch],
  );

  const handleCloseAndClear = useCallback(() => {
    onClose();
    onSearchQueryChange('');
  }, [onClose, onSearchQueryChange]);

  const topPosition = isSolid ? 'top-16 md:top-14' : 'top-32 md:top-24';

  return (
    <div
      className={`fixed left-0 w-full z-[55] transition-all duration-700 ease-out overflow-hidden
        ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}
        ${topPosition}
      `}
      style={{ marginTop: showTestBanner ? '48px' : '0' }}
    >
      <div
        className={`border-b shadow-lg transition-all duration-700 ease-out
          ${isSolid
            ? 'bg-white/90 backdrop-blur-xl border-neutral-100'
            : 'bg-white/0 backdrop-blur-0 border-transparent'
          }`}
      >
        <div className="max-w-[1920px] mx-auto px-6 md:px-12 py-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" strokeWidth={1.5} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite para buscar produtos..."
                className="w-full pl-10 pr-10 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400 transition-colors text-sm"
                autoFocus
              />
              <button
                onClick={handleCloseAndClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:opacity-50 transition-opacity"
                aria-label="Fechar busca"
              >
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>

            <button
              onClick={handleSearch}
              disabled={!searchQuery.trim()}
              className="px-3 md:px-6 py-3 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm font-medium whitespace-nowrap flex items-center gap-2"
            >
              <Search className="w-4 h-4" strokeWidth={2} />
              <span className="hidden md:inline">Buscar</span>
            </button>
          </div>

          {isOpen && searchSuggestions.length > 0 && (
            <div className="mt-2 bg-white rounded-lg border border-neutral-100 shadow-lg overflow-y-auto max-h-[400px]">
              {searchSuggestions.map((product) => {
                const img = product.variants?.[0]?.variant_images?.[0] || product.base_images?.[0];
                const price = product.variants?.[0]?.retail_price || 0;
                return (
                  <button
                    key={product.id}
                    onClick={() => {
                      onSelectProduct?.(product);
                      onClose();
                      onSearchQueryChange('');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-50 transition-colors text-left"
                  >
                    {img && (
                      <img
                        src={getOptimizedImageUrl(img, 'thumbnail')}
                        alt={getLoc(product.name)}
                        className="w-10 h-12 object-cover rounded-md flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-800 truncate">{getLoc(product.name)}</p>
                      {price > 0 && <p className="text-xs text-neutral-500">{formatCurrency(price, currentLocale)}</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
