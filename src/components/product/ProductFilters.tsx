import React, { useCallback } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { Category } from '../../types';
import { Locale } from '../../i18n';
import { createGetLoc } from '../../utils/localization';

export interface ProductFiltersProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  isFiltersOpen: boolean;
  onToggleFilters: () => void;
  activeFilterCount: number;
  locale: Locale;
  t: (key: string) => string;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  categories,
  activeCategory,
  onCategoryChange,
  isFiltersOpen,
  onToggleFilters,
  activeFilterCount,
  locale,
  t,
}) => {
  const getLoc = React.useMemo(() => createGetLoc(locale), [locale]);

  const handleCategoryClick = useCallback(
    (category: string) => {
      onCategoryChange(category);
    },
    [onCategoryChange],
  );

  return (
    <div
      id="product-filters"
      className="sticky top-24 md:top-20 z-30 bg-paper/95 backdrop-blur-md border-b border-neutral-100 py-3 md:py-4 px-4 md:px-12 mb-6 md:mb-8 transition-all"
    >
      <div className="flex items-center gap-3 md:gap-4">
        {/* Filter Toggle Button */}
        <button
          onClick={onToggleFilters}
          className={`flex-shrink-0 flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-lg text-[10px] md:text-[10px] uppercase tracking-[0.15em] md:tracking-[0.2em] font-bold transition-all ${
            isFiltersOpen
              ? 'bg-neutral-900 text-white'
              : 'text-neutral-700 hover:bg-neutral-100 active:bg-neutral-100'
          }`}
          aria-label={isFiltersOpen ? 'Ocultar filtros' : 'Exibir filtros'}
          aria-expanded={isFiltersOpen}
        >
          {isFiltersOpen ? (
            <X className="w-3 h-3 md:w-3.5 md:h-3.5" />
          ) : (
            <SlidersHorizontal className="w-3 h-3 md:w-3.5 md:h-3.5" />
          )}
          <span className="hidden sm:inline">
            {isFiltersOpen ? t('grid.hideFilters') || 'Ocultar' : t('grid.showFilters') || 'Filtros'}
          </span>
          <span className="sm:hidden">{isFiltersOpen ? 'Ocultar' : 'Filtros'}</span>
          {activeFilterCount > 0 && !isFiltersOpen && (
            <span className="ml-0.5 w-4 h-4 md:w-5 md:h-5 flex items-center justify-center bg-neutral-900 text-white text-[10px] md:text-[10px] font-bold rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Category Pills - Horizontal Scroll */}
        <div className="flex-1 flex overflow-x-auto no-scrollbar gap-1.5 md:gap-2">
          <button
            onClick={() => handleCategoryClick('All')}
            className={`flex-shrink-0 px-3 md:px-5 py-1.5 md:py-2 rounded-full text-[10px] md:text-[10px] uppercase tracking-[0.1em] md:tracking-[0.15em] font-bold transition-all border ${
              activeCategory === 'All'
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'text-neutral-600 border-neutral-200 active:border-neutral-400'
            }`}
            aria-pressed={activeCategory === 'All'}
          >
            {t('grid.allItems')}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(getLoc(cat.name))}
              className={`flex-shrink-0 px-3 md:px-5 py-1.5 md:py-2 rounded-full text-[10px] md:text-[10px] uppercase tracking-[0.1em] md:tracking-[0.15em] font-bold transition-all border whitespace-nowrap ${
                activeCategory === getLoc(cat.name)
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'text-neutral-600 border-neutral-200 active:border-neutral-400'
              }`}
              aria-pressed={activeCategory === getLoc(cat.name)}
            >
              {getLoc(cat.name)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
