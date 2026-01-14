import React from 'react';
import { Locale } from '../../i18n';
import { formatCurrency } from '../../utils/currency';
import { PriceRangeSlider } from './PriceRangeSlider';
import { Shirt, SlidersHorizontal } from 'lucide-react';

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
  setSortBy,
  locale,
  t,
  isMobile = false
}) => {
  const sectionClass =
    'w-full rounded-3xl bg-white/60 border border-white/60 shadow-[0_18px_60px_rgba(15,23,42,0.18)] px-6 py-5 flex flex-col gap-4 backdrop-blur-xl';

  const pillRowClass = 'flex items-center justify-between gap-4';

  const sizePillClass = (isSelected: boolean) =>
    `min-w-[44px] h-9 px-4 inline-flex items-center justify-center rounded-full text-[11px] font-semibold tracking-[0.14em] uppercase transition-all ${
      isSelected
        ? 'bg-neutral-900 text-white shadow-[0_10px_30px_rgba(15,23,42,0.45)]'
        : 'bg-white/80 text-neutral-700 border border-neutral-200 hover:bg-neutral-50'
    }`;

  const sortPillClass = (active: boolean) =>
    `h-9 px-4 inline-flex items-center justify-center rounded-full text-[11px] font-semibold tracking-[0.14em] uppercase transition-all ${
      active
        ? 'bg-neutral-900 text-white shadow-[0_10px_30px_rgba(15,23,42,0.45)]'
        : 'bg-white/80 text-neutral-700 border border-neutral-200 hover:bg-neutral-50'
    }`;

  return (
    <div className="space-y-4">
      {availableSizes.length > 0 && (
        <div className={sectionClass} aria-labelledby="filter-size-label">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-2xl bg-white shadow-[0_6px_18px_rgba(15,23,42,0.12)] flex items-center justify-center text-neutral-700">
              <Shirt className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span
                id="filter-size-label"
                className="text-[12px] font-semibold text-neutral-800"
              >
                {t('grid.filterBySize')}
              </span>
            </div>
          </div>

          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-labelledby="filter-size-label"
          >
            {availableSizes.map(size => {
              const isSelected = selectedSizes.includes(size);
              const count = sizeCounts[size] || 0;
              return (
                <button
                  key={size}
                  onClick={() => toggleSize(size)}
                  className={sizePillClass(isSelected)}
                  aria-pressed={isSelected}
                  aria-label={`Filtrar por tamanho ${size}, ${count} produtos disponíveis`}
                >
                  {size}
                  {count > 0 && (
                    <span
                      className={`ml-1 text-[10px] ${
                        isSelected ? 'text-neutral-300' : 'text-neutral-400'
                      }`}
                    >
                      ({count})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {priceBounds.min < priceBounds.max && (
        <div className={sectionClass} aria-labelledby="filter-price-label">
          <div className={pillRowClass}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-white shadow-[0_6px_18px_rgba(15,23,42,0.12)] flex items-center justify-center text-neutral-700">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <span
                id="filter-price-label"
                className="text-[12px] font-semibold text-neutral-800"
              >
                {t('grid.filterByPrice')}
              </span>
            </div>
            <div className="flex flex-col items-end text-[11px] text-neutral-500">
              <span>{formatCurrency(priceMin ?? priceBounds.min, locale)}</span>
              <span className="text-neutral-400">
                {formatCurrency(priceMax ?? priceBounds.max, locale)}
              </span>
            </div>
          </div>

          <div role="group" aria-labelledby="filter-price-label">
            <PriceRangeSlider
              min={priceBounds.min}
              max={priceBounds.max}
              valueMin={priceMin}
              valueMax={priceMax}
              onChange={setPriceRange}
              locale={locale}
            />
          </div>
        </div>
      )}

      <div className={sectionClass} aria-labelledby="filter-sort-label">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-2xl bg-white shadow-[0_6px_18px_rgba(15,23,42,0.12)] flex items-center justify-center text-neutral-700">
            <SlidersHorizontal className="w-4 h-4 rotate-90" />
          </div>
          <span
            id="filter-sort-label"
            className="text-[12px] font-semibold text-neutral-800"
          >
            {t('grid.sortBy')}
          </span>
        </div>
        <div
          className="flex flex-wrap gap-2"
          role="radiogroup"
          aria-labelledby="filter-sort-label"
        >
          <button
            onClick={() => setSortBy('relevance')}
            className={sortPillClass(sortBy === 'relevance')}
            role="radio"
            aria-checked={sortBy === 'relevance'}
            aria-label="Ordenar por relevância"
          >
            {t('grid.relevance')}
          </button>
          <button
            onClick={() => setSortBy('price-asc')}
            className={sortPillClass(sortBy === 'price-asc')}
            role="radio"
            aria-checked={sortBy === 'price-asc'}
            aria-label="Ordenar por preço: menor para maior"
          >
            {t('grid.priceAsc')}
          </button>
          <button
            onClick={() => setSortBy('price-desc')}
            className={sortPillClass(sortBy === 'price-desc')}
            role="radio"
            aria-checked={sortBy === 'price-desc'}
            aria-label="Ordenar por preço: maior para menor"
          >
            {t('grid.priceDesc')}
          </button>
        </div>
      </div>
    </div>
  );
};
