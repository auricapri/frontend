import React, { useCallback } from 'react';
import { X } from 'lucide-react';
import { FilterAccordion } from './FilterAccordion';
import { Locale } from '../../i18n';
import { formatCurrency, getCurrencySymbol } from '../../utils/currency';
import { useDebounce } from '../../hooks/useDebounce';
import type { ColorFamily } from '../../utils/colorFamilies';

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  // Size filters
  availableSizes: string[];
  selectedSizes: string[];
  sizeCounts: Record<string, number>;
  toggleSize: (size: string) => void;
  // Color family filters
  availableColorFamilies: ColorFamily[];
  selectedColorFamilies: string[];
  toggleColorFamily: (id: string) => void;
  // Price filters
  priceBounds: { min: number; max: number };
  priceMin: number | null;
  priceMax: number | null;
  setPriceRange: (min: number | null, max: number | null) => void;
  // Sort
  sortBy: 'relevance' | 'price-asc' | 'price-desc' | 'popularity';
  setSortBy: (sort: 'relevance' | 'price-asc' | 'price-desc' | 'popularity') => void;
  // Actions
  onClear: () => void;
  onApply: () => void;
  hasActiveFilters: boolean;
  productCount: number;
  // Localization
  locale: Locale;
  t: (key: string) => string;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  isOpen,
  onClose,
  availableSizes,
  selectedSizes,
  sizeCounts,
  toggleSize,
  availableColorFamilies,
  selectedColorFamilies,
  toggleColorFamily,
  priceBounds,
  priceMin,
  priceMax,
  setPriceRange,
  sortBy,
  setSortBy,
  onClear,
  onApply,
  hasActiveFilters,
  productCount,
  locale,
  t
}) => {
  const [localPriceMin, setLocalPriceMin] = React.useState<string>(
    priceMin !== null ? String(priceMin) : ''
  );
  const [localPriceMax, setLocalPriceMax] = React.useState<string>(
    priceMax !== null ? String(priceMax) : ''
  );

  React.useEffect(() => {
    setLocalPriceMin(priceMin !== null ? String(priceMin) : '');
    setLocalPriceMax(priceMax !== null ? String(priceMax) : '');
  }, [priceMin, priceMax]);

  const debouncedSetPriceRange = useDebounce(setPriceRange, 400);

  const handlePriceMinChange = (value: string) => {
    setLocalPriceMin(value);
    const num = parseFloat(value);
    if (!isNaN(num) && num >= priceBounds.min) {
      debouncedSetPriceRange(num, priceMax);
    } else if (value === '') {
      debouncedSetPriceRange(null, priceMax);
    }
  };

  const handlePriceMaxChange = (value: string) => {
    setLocalPriceMax(value);
    const num = parseFloat(value);
    if (!isNaN(num) && num <= priceBounds.max) {
      debouncedSetPriceRange(priceMin, num);
    } else if (value === '') {
      debouncedSetPriceRange(priceMin, null);
    }
  };

  const sortOptions = [
    { value: 'relevance' as const, label: t('grid.relevance') },
    { value: 'price-asc' as const, label: t('grid.priceAsc') },
    { value: 'price-desc' as const, label: t('grid.priceDesc') },
    { value: 'popularity' as const, label: t('grid.popularity') || 'Popularidade' }
  ];

  return (
    <>
      {/* Backdrop — fades on compositor thread, zero layout cost */}
      <div
        className="fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300"
        style={{ opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — slides via transform (GPU, no layout reflow) */}
      <div
        className="fixed top-0 left-0 h-full z-[61] bg-paper shadow-2xl w-[290px] md:w-[320px] flex flex-col"
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 280ms cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'transform',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 flex-shrink-0">
          <h3 className="text-[13px] font-bold uppercase tracking-[0.15em] text-neutral-900">
            {t('grid.filter')}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-100 rounded-full transition-colors"
            aria-label="Fechar filtros"
          >
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
          {/* Clear All */}
          {hasActiveFilters && (
            <button
              onClick={onClear}
              className="w-full py-3 text-[11px] font-medium text-neutral-500 hover:text-neutral-800 transition-colors text-left underline underline-offset-2"
            >
              {t('grid.clearFilters')}
            </button>
          )}

          {/* Color Family Filter */}
          {availableColorFamilies.length > 0 && (
            <FilterAccordion
              title="Cores"
              defaultOpen={selectedColorFamilies.length > 0}
              count={selectedColorFamilies.length}
            >
              <div className="flex flex-wrap gap-2">
                {availableColorFamilies.map(family => {
                  const isSelected = selectedColorFamilies.includes(family.id);
                  return (
                    <button
                      key={family.id}
                      onClick={() => toggleColorFamily(family.id)}
                      title={family.label}
                      aria-pressed={isSelected}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-full border transition-colors text-[10px] font-medium ${
                        isSelected
                          ? 'border-neutral-900 bg-neutral-900 text-white'
                          : 'border-neutral-200 hover:border-neutral-400 text-neutral-600'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-white/40 flex-shrink-0"
                        style={{ backgroundColor: family.hex }}
                      />
                      {family.label}
                    </button>
                  );
                })}
              </div>
            </FilterAccordion>
          )}

          {/* Size Filter */}
          {availableSizes.length > 0 && (
            <FilterAccordion
              title={t('grid.filterBySize')}
              defaultOpen
              count={selectedSizes.length}
            >
              <div className="flex flex-wrap gap-2">
                {availableSizes.map(size => {
                  const isSelected = selectedSizes.includes(size);
                  const count = sizeCounts[size] || 0;
                  return (
                    <button
                      key={size}
                      onClick={() => toggleSize(size)}
                      className={`min-w-[40px] h-8 px-3 inline-flex items-center justify-center rounded-md text-[11px] font-medium transition-colors border ${
                        isSelected
                          ? 'bg-neutral-900 text-white border-neutral-900'
                          : 'bg-paper text-neutral-700 border-neutral-300 hover:border-neutral-900'
                      }`}
                      aria-pressed={isSelected}
                    >
                      {size}
                      {count > 0 && (
                        <span className="ml-1 text-[10px] text-neutral-400">
                          ({count})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </FilterAccordion>
          )}

          {/* Price Filter */}
          {priceBounds.min < priceBounds.max && (
            <FilterAccordion
              title={t('grid.filterByPrice')}
              defaultOpen={priceMin !== null || priceMax !== null}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-[10px] font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">
                      De
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-neutral-400">
                        {getCurrencySymbol(locale)}
                      </span>
                      <input
                        type="number"
                        value={localPriceMin}
                        onChange={(e) => handlePriceMinChange(e.target.value)}
                        placeholder={String(Math.floor(priceBounds.min))}
                        className="w-full h-10 pl-9 pr-3 text-[12px] border border-neutral-300 rounded-md focus:outline-none focus:border-neutral-900 transition-colors"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">
                      Para
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-neutral-400">
                        {getCurrencySymbol(locale)}
                      </span>
                      <input
                        type="number"
                        value={localPriceMax}
                        onChange={(e) => handlePriceMaxChange(e.target.value)}
                        placeholder={String(Math.ceil(priceBounds.max))}
                        className="w-full h-10 pl-9 pr-3 text-[12px] border border-neutral-300 rounded-md focus:outline-none focus:border-neutral-900 transition-colors"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-neutral-400">
                  {formatCurrency(priceBounds.min, locale)} - {formatCurrency(priceBounds.max, locale)}
                </p>
              </div>
            </FilterAccordion>
          )}

          {/* Sort Options */}
          <FilterAccordion title={t('grid.sortBy')} defaultOpen>
            <div className="space-y-2">
              {sortOptions.map(option => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <input
                    type="radio"
                    name="sortBy"
                    checked={sortBy === option.value}
                    onChange={() => setSortBy(option.value)}
                    className="w-4 h-4 border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                  />
                  <span className={`text-[12px] transition-colors ${
                    sortBy === option.value
                      ? 'text-neutral-900 font-medium'
                      : 'text-neutral-600 group-hover:text-neutral-900'
                  }`}>
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </FilterAccordion>
        </div>

        {/* Footer — fixed at bottom */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-neutral-100">
          <button
            onClick={onApply}
            className="w-full py-3 bg-neutral-900 text-white text-[11px] font-bold uppercase tracking-[0.15em] rounded-md hover:bg-neutral-800 transition-colors"
          >
            {t('grid.applyFilters')} ({productCount})
          </button>
        </div>
      </div>
    </>
  );
};
