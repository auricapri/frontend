import React from 'react';
import { Locale } from '../../i18n';
import { FilterAccordion } from './FilterAccordion';
import { PriceRangeSlider } from './PriceRangeSlider';
import type { ColorFamily } from '../../utils/colorFamilies';

interface FilterContentProps {
  availableSizes: string[];
  selectedSizes: string[];
  sizeCounts: Record<string, number>;
  priceBounds: { min: number; max: number };
  priceMin: number | null;
  priceMax: number | null;
  sortBy: 'relevance' | 'price-asc' | 'price-desc' | 'popularity';
  toggleSize: (size: string) => void;
  setPriceRange: (min: number | null, max: number | null) => void;
  setSortBy: (sort: 'relevance' | 'price-asc' | 'price-desc' | 'popularity') => void;
  // Color family filters (optional — not all contexts have them)
  availableColorFamilies?: ColorFamily[];
  selectedColorFamilies?: string[];
  toggleColorFamily?: (id: string) => void;
  locale: Locale;
  t: (key: string) => string;
  isMobile?: boolean;
}

export const FilterContent: React.FC<FilterContentProps> = ({
  availableSizes,
  selectedSizes,
  sizeCounts,
  priceBounds,
  priceMin,
  priceMax,
  sortBy,
  toggleSize,
  setPriceRange,
  setSortBy: _setSortBy,
  availableColorFamilies = [],
  selectedColorFamilies = [],
  toggleColorFamily,
  locale,
  t,
  isMobile: _isMobile = false
}) => {
  const sortOptions = [
    { value: 'relevance' as const, label: t('grid.relevance') },
    { value: 'price-asc' as const, label: t('grid.priceAsc') },
    { value: 'price-desc' as const, label: t('grid.priceDesc') },
    { value: 'popularity' as const, label: t('grid.popularity') || 'Popularidade' }
  ];

  return (
    <div className="space-y-0">
      {/* Color Family Filter */}
      {availableColorFamilies.length > 0 && toggleColorFamily && (
        <FilterAccordion
          title="Cores"
          defaultOpen={selectedColorFamilies.length > 0}
          count={selectedColorFamilies.length > 0 ? selectedColorFamilies.length : undefined}
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
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border transition-colors text-[11px] font-medium ${
                    isSelected
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-200 hover:border-neutral-400 active:bg-neutral-50 text-neutral-600'
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
          defaultOpen={true}
          count={selectedSizes.length > 0 ? selectedSizes.length : undefined}
        >
          <div className="flex flex-wrap gap-2">
            {availableSizes.map(size => {
              const isSelected = selectedSizes.includes(size);
              const count = sizeCounts[size] || 0;
              return (
                <button
                  key={size}
                  onClick={() => toggleSize(size)}
                  className={`min-w-[44px] h-10 px-4 inline-flex items-center justify-center rounded-md text-[12px] font-medium transition-all border ${
                    isSelected
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-paper text-neutral-700 border-neutral-300 hover:border-neutral-900 active:bg-neutral-100'
                  }`}
                  aria-pressed={isSelected}
                >
                  {size}
                  {count > 0 && (
                    <span className={`ml-1.5 text-[10px] ${isSelected ? 'text-neutral-400' : 'text-neutral-400'}`}>
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
          defaultOpen={true}
        >
          <PriceRangeSlider
            min={priceBounds.min}
            max={priceBounds.max}
            valueMin={priceMin}
            valueMax={priceMax}
            onChange={setPriceRange}
            locale={locale}
          />
        </FilterAccordion>
      )}

      {/* Sort Options */}
      <FilterAccordion title={t('grid.sortBy')} defaultOpen>
        <div className="space-y-3">
          {sortOptions.map(option => (
            <label
              key={option.value}
              className="flex items-center gap-3 cursor-pointer group py-1"
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                sortBy === option.value
                  ? 'border-neutral-900'
                  : 'border-neutral-300 group-hover:border-neutral-500'
              }`}>
                {sortBy === option.value && (
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-900" />
                )}
              </div>
              <span className={`text-[13px] transition-colors ${
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
  );
};
