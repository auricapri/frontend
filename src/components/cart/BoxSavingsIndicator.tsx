import React from 'react';
import { Package, Check, Sparkles } from 'lucide-react';
import { Locale } from '../../i18n';
import { formatCurrency } from '../../utils/currency';

interface BoxSavingsIndicatorProps {
  itemCount: number;
  locale: Locale;
  /** Cost of shipping per box (default R$18) */
  boxShippingCost?: number;
  /** Items per box capacity (default 3) */
  boxCapacity?: number;
}

/**
 * Visual indicator showing shipping savings when buying multiple items.
 * Shows a progress bar with slots representing box capacity.
 *
 * Logic:
 * - 1 item in box = pays full shipping alone
 * - 2 items in box = splits shipping cost
 * - 3 items (full box) = maximum savings per item
 */
const BoxSavingsIndicator: React.FC<BoxSavingsIndicatorProps> = ({
  itemCount,
  locale,
  boxShippingCost = 18,
  boxCapacity = 3,
}) => {
  // Calculate items in current box (cycle through boxes)
  const itemsInCurrentBox = itemCount === 0 ? 0 : ((itemCount - 1) % boxCapacity) + 1;
  const slotsRemaining = boxCapacity - itemsInCurrentBox;
  const isBoxComplete = itemsInCurrentBox === boxCapacity;

  // Calculate shipping cost per item
  const shippingPerItem = itemsInCurrentBox > 0 ? boxShippingCost / itemsInCurrentBox : boxShippingCost;
  const shippingIfFull = boxShippingCost / boxCapacity;
  const potentialSavings = (shippingPerItem - shippingIfFull) * itemsInCurrentBox;

  // Localized text
  const getText = () => {
    if (itemCount === 0) return null;

    if (isBoxComplete) {
      if (locale === 'pt') return { main: 'Caixa completa!', sub: 'Economia máxima no frete' };
      if (locale === 'es') return { main: '¡Caja completa!', sub: 'Ahorro máximo en envío' };
      return { main: 'Box complete!', sub: 'Maximum shipping savings' };
    }

    if (locale === 'pt') {
      return {
        main: `Adicione +${slotsRemaining} e economize`,
        sub: `${formatCurrency(potentialSavings, locale)} no frete`,
      };
    }
    if (locale === 'es') {
      return {
        main: `Añade +${slotsRemaining} y ahorra`,
        sub: `${formatCurrency(potentialSavings, locale)} en envío`,
      };
    }
    return {
      main: `Add +${slotsRemaining} and save`,
      sub: `${formatCurrency(potentialSavings, locale)} on shipping`,
    };
  };

  const text = getText();
  if (!text || itemCount === 0) return null;

  return (
    <div className={`rounded-2xl p-4 transition-all duration-500 ${
      isBoxComplete
        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100'
        : 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100'
    }`}>
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className={`p-2.5 rounded-xl ${
          isBoxComplete ? 'bg-green-100' : 'bg-amber-100'
        }`}>
          {isBoxComplete ? (
            <Sparkles className="w-4 h-4 text-green-600" />
          ) : (
            <Package className="w-4 h-4 text-amber-600" />
          )}
        </div>

        {/* Text & Progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-black uppercase tracking-wider ${
              isBoxComplete ? 'text-green-700' : 'text-amber-700'
            }`}>
              {text.main}
            </span>
            <span className={`text-[9px] font-bold ${
              isBoxComplete ? 'text-green-600' : 'text-amber-600'
            }`}>
              {text.sub}
            </span>
          </div>

          {/* Box slots visualization */}
          <div className="flex gap-1.5">
            {Array.from({ length: boxCapacity }).map((_, idx) => {
              const isFilled = idx < itemsInCurrentBox;
              return (
                <div
                  key={idx}
                  className={`flex-1 h-2 rounded-full transition-all duration-300 flex items-center justify-center ${
                    isFilled
                      ? isBoxComplete
                        ? 'bg-green-500'
                        : 'bg-amber-500'
                      : 'bg-neutral-200'
                  }`}
                >
                  {isFilled && isBoxComplete && (
                    <Check className="w-1.5 h-1.5 text-white" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Micro explanation */}
      {!isBoxComplete && (
        <p className="text-[8px] text-amber-600/70 mt-2 text-center font-medium">
          {locale === 'pt' && 'Cada caixa comporta 3 produtos com o mesmo frete'}
          {locale === 'es' && 'Cada caja cabe 3 productos con el mismo envío'}
          {locale === 'en' && 'Each box fits 3 products with the same shipping'}
        </p>
      )}
    </div>
  );
};

export default BoxSavingsIndicator;
