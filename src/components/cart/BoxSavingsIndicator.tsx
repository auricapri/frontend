import React from 'react';
import { Package, Check, Sparkles, Gift } from 'lucide-react';
import { Locale } from '../../i18n';
import { formatCurrency } from '../../utils/currency';

interface BoxSavingsIndicatorProps {
  itemCount: number;
  subtotal: number;
  locale: Locale;
  /** Cost saved per shared item (default R$35 - shipping cost) */
  savingsPerItem?: number;
  /** Items per box capacity (default 3) */
  boxCapacity?: number;
}

/**
 * Calculates the quantity discount based on box optimization.
 * Returns the discount value and whether to show as percentage or fixed amount.
 */
export function calculateQuantityDiscount(
  itemCount: number,
  subtotal: number,
  savingsPerItem: number = 35,
  boxCapacity: number = 3
): {
  discountValue: number;
  discountPercent: number;
  showAsPercent: boolean;
  itemsInCurrentBox: number;
  slotsRemaining: number;
  isBoxComplete: boolean;
  potentialExtraSavings: number;
} {
  if (itemCount === 0 || subtotal === 0) {
    return {
      discountValue: 0,
      discountPercent: 0,
      showAsPercent: false,
      itemsInCurrentBox: 0,
      slotsRemaining: boxCapacity,
      isBoxComplete: false,
      potentialExtraSavings: 0,
    };
  }

  // Items in current box (cycle through boxes)
  const itemsInCurrentBox = ((itemCount - 1) % boxCapacity) + 1;
  const slotsRemaining = boxCapacity - itemsInCurrentBox;
  const isBoxComplete = itemsInCurrentBox === boxCapacity;

  // Calculate total boxes and savings
  // Each item after the first in a box saves one shipping cost
  const fullBoxes = Math.floor(itemCount / boxCapacity);
  const itemsInPartialBox = itemCount % boxCapacity;

  // Savings = (items - boxes) * savingsPerItem
  // Because each box only needs 1 shipping, not per-item
  const totalBoxes = fullBoxes + (itemsInPartialBox > 0 ? 1 : 0);
  const itemsSavingShipping = itemCount - totalBoxes;
  const discountValue = itemsSavingShipping * savingsPerItem;

  // Calculate percentage
  const discountPercent = subtotal > 0 ? (discountValue / subtotal) * 100 : 0;

  // Round percentage to nearest integer
  const roundedPercent = Math.round(discountPercent);

  // Show as percent if >= 3%, otherwise show as R$ value
  const showAsPercent = roundedPercent >= 3;

  // Calculate potential extra savings if box was completed
  const potentialExtraSavings = slotsRemaining * savingsPerItem;

  return {
    discountValue,
    discountPercent: roundedPercent,
    showAsPercent,
    itemsInCurrentBox,
    slotsRemaining,
    isBoxComplete,
    potentialExtraSavings,
  };
}

/**
 * Visual indicator showing quantity-based discounts.
 * Encourages customers to add more items to maximize savings.
 */
const BoxSavingsIndicator: React.FC<BoxSavingsIndicatorProps> = ({
  itemCount,
  subtotal,
  locale,
  savingsPerItem = 35,
  boxCapacity = 3,
}) => {
  const {
    discountValue,
    discountPercent,
    showAsPercent,
    itemsInCurrentBox,
    slotsRemaining,
    isBoxComplete,
    potentialExtraSavings,
  } = calculateQuantityDiscount(itemCount, subtotal, savingsPerItem, boxCapacity);

  // Calculate what percent the potential savings would be
  const potentialPercent = subtotal > 0
    ? Math.round(((discountValue + potentialExtraSavings) / subtotal) * 100)
    : 0;
  const showPotentialAsPercent = potentialPercent >= 3;

  // Localized text
  const getText = () => {
    if (itemCount === 0) return null;

    // User has discount applied
    if (discountValue > 0 && isBoxComplete) {
      const discountText = showAsPercent
        ? `${discountPercent}% OFF`
        : `${formatCurrency(discountValue, locale)} OFF`;

      if (locale === 'pt') return { main: 'Desconto aplicado!', sub: discountText };
      if (locale === 'es') return { main: '¡Descuento aplicado!', sub: discountText };
      return { main: 'Discount applied!', sub: discountText };
    }

    // User can get more discount
    if (slotsRemaining > 0) {
      const potentialText = showPotentialAsPercent
        ? `${potentialPercent}% OFF`
        : `${formatCurrency(discountValue + potentialExtraSavings, locale)} OFF`;

      if (locale === 'pt') {
        return {
          main: `Adicione +${slotsRemaining} e ganhe`,
          sub: potentialText,
        };
      }
      if (locale === 'es') {
        return {
          main: `Añade +${slotsRemaining} y gana`,
          sub: potentialText,
        };
      }
      return {
        main: `Add +${slotsRemaining} and get`,
        sub: potentialText,
      };
    }

    return null;
  };

  const text = getText();
  if (!text || itemCount === 0) return null;

  // Show current discount if any
  const hasCurrentDiscount = discountValue > 0;
  const currentDiscountText = hasCurrentDiscount
    ? (showAsPercent ? `${discountPercent}% OFF` : formatCurrency(discountValue, locale))
    : null;

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
            <Gift className="w-4 h-4 text-amber-600" />
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
            <span className={`text-[11px] font-black ${
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

          {/* Show current savings if partial */}
          {hasCurrentDiscount && !isBoxComplete && (
            <p className="text-[8px] text-amber-600/80 mt-2 font-bold">
              {locale === 'pt' && `Você já tem ${currentDiscountText} de desconto`}
              {locale === 'es' && `Ya tienes ${currentDiscountText} de descuento`}
              {locale === 'en' && `You already have ${currentDiscountText} off`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BoxSavingsIndicator;
