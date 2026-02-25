import React, { useRef, useCallback, useState, useEffect } from 'react';
import { CreditCard, ArrowLeftRight, AlertCircle, GripVertical } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { InstallmentSelector } from './InstallmentSelector';
import type { InstallmentOption } from '../../types/payment.types';
import type { Locale } from '../../i18n';

interface SplitCardAmountProps {
  totalAmount: number;
  card1Amount: number;
  card2Amount: number;
  onCard1AmountChange: (amount: number) => void;
  onCard2AmountChange: (amount: number) => void;
  card1Installments: number;
  card1Options: InstallmentOption[];
  onCard1InstallmentsChange: (installments: number, code: string) => void;
  card2Installments: number;
  card2Options: InstallmentOption[];
  onCard2InstallmentsChange: (installments: number, code: string) => void;
  isLoading?: boolean;
  locale?: Locale;
}

export function SplitCardAmount({
  totalAmount,
  card1Amount,
  card2Amount,
  onCard1AmountChange,
  onCard2AmountChange,
  card1Installments,
  card1Options,
  onCard1InstallmentsChange,
  card2Installments,
  card2Options,
  onCard2InstallmentsChange,
  isLoading = false,
  locale = 'pt'
}: SplitCardAmountProps) {
  // Validation
  const difference = (card1Amount + card2Amount) - totalAmount;
  const isValid = Math.abs(difference) < 0.01;
  const isMissing = difference < -0.01;

  // Calculate percentages for visual (clamped to 0-100)
  const card1Percentage = Math.max(0, Math.min(100, (card1Amount / totalAmount) * 100));
  const card2Percentage = Math.max(0, Math.min(100, (card2Amount / totalAmount) * 100));

  // Local state for free-form input
  const [card1InputValue, setCard1InputValue] = useState(card1Amount.toFixed(2).replace('.', ','));
  const [card2InputValue, setCard2InputValue] = useState(card2Amount.toFixed(2).replace('.', ','));
  const [card1Focused, setCard1Focused] = useState(false);
  const [card2Focused, setCard2Focused] = useState(false);

  // Sync external values when not focused
  useEffect(() => {
    if (!card1Focused) {
      setCard1InputValue(card1Amount.toFixed(2).replace('.', ','));
    }
  }, [card1Amount, card1Focused]);

  useEffect(() => {
    if (!card2Focused) {
      setCard2InputValue(card2Amount.toFixed(2).replace('.', ','));
    }
  }, [card2Amount, card2Focused]);

  // Handle input changes - just update local state, allow any input
  const handleCard1InputChange = (value: string) => {
    // Allow numbers, comma, dot, and empty
    const sanitized = value.replace(/[^\d,.\s]/g, '');
    setCard1InputValue(sanitized);
  };

  const handleCard2InputChange = (value: string) => {
    const sanitized = value.replace(/[^\d,.\s]/g, '');
    setCard2InputValue(sanitized);
  };

  // Apply value on blur or enter
  const applyCard1Value = () => {
    const numValue = parseFloat(card1InputValue.replace(',', '.').replace(/\s/g, ''));
    if (!isNaN(numValue) && numValue >= 0) {
      onCard1AmountChange(numValue);
    } else {
      // Reset to current valid value
      setCard1InputValue(card1Amount.toFixed(2).replace('.', ','));
    }
    setCard1Focused(false);
  };

  const applyCard2Value = () => {
    const numValue = parseFloat(card2InputValue.replace(',', '.').replace(/\s/g, ''));
    if (!isNaN(numValue) && numValue >= 0) {
      onCard2AmountChange(numValue);
    } else {
      setCard2InputValue(card2Amount.toFixed(2).replace('.', ','));
    }
    setCard2Focused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent, applyFn: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyFn();
      (e.target as HTMLInputElement).blur();
    }
  };

  // Quick split buttons - sets both values
  const handleQuickSplit = (card1Ratio: number) => {
    const card1Value = Math.round(totalAmount * card1Ratio * 100) / 100;
    const card2Value = Math.round((totalAmount - card1Value) * 100) / 100;
    onCard1AmountChange(card1Value);
    onCard2AmountChange(card2Value);
  };

  const splitOptions = [
    { label: '50/50', ratio: 0.5 },
    { label: '60/40', ratio: 0.6 },
    { label: '70/30', ratio: 0.7 },
  ];

  // Check if a quick split option is selected
  const isQuickSplitSelected = (ratio: number) => {
    const expectedCard1 = totalAmount * ratio;
    return Math.abs(card1Amount - expectedCard1) < 0.01 && isValid;
  };

  // Draggable slider logic
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleSliderChange = useCallback((clientX: number) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const width = rect.width;

    // Calculate ratio (clamped between 10% and 90% for minimum card values)
    let ratio = Math.max(0.1, Math.min(0.9, x / width));

    // Round to nearest 5% for easier snapping
    ratio = Math.round(ratio * 20) / 20;

    const card1Value = Math.round(totalAmount * ratio * 100) / 100;
    const card2Value = Math.round((totalAmount - card1Value) * 100) / 100;

    onCard1AmountChange(card1Value);
    onCard2AmountChange(card2Value);
  }, [totalAmount, onCard1AmountChange, onCard2AmountChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    handleSliderChange(e.clientX);
  }, [handleSliderChange]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    if (e.touches.length > 0) {
      handleSliderChange(e.touches[0].clientX);
    }
  }, [handleSliderChange]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleSliderChange(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleSliderChange(e.touches[0].clientX);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, handleSliderChange]);

  // Calculate totals with fees
  const card1SelectedOption = card1Options.find(o => o.installments === card1Installments);
  const card2SelectedOption = card2Options.find(o => o.installments === card2Installments);
  const totalWithFees = (card1SelectedOption?.totalValue || card1Amount) + (card2SelectedOption?.totalValue || card2Amount);
  const totalFees = totalWithFees - totalAmount;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-neutral-100 rounded-xl">
          <ArrowLeftRight className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider">Dividir Valor</h4>
          <p className="text-xs text-neutral-600 mt-0.5">
            Total: {formatCurrency(totalAmount, locale)}
          </p>
        </div>
      </div>

      {/* Quick Split Buttons */}
      <div className="flex gap-2">
        {splitOptions.map(option => (
          <button
            key={option.label}
            type="button"
            onClick={() => handleQuickSplit(option.ratio)}
            className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${
              isQuickSplitSelected(option.ratio)
                ? 'bg-black text-white'
                : 'bg-neutral-100 hover:bg-neutral-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Interactive Draggable Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-neutral-600 uppercase tracking-wider px-1">
          <span>Cartão 1: {card1Percentage.toFixed(0)}%</span>
          <span className="text-amber-600">Cartão 2: {card2Percentage.toFixed(0)}%</span>
        </div>
        <div
          ref={sliderRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className={`relative h-10 rounded-full overflow-hidden flex bg-neutral-100 cursor-pointer select-none ${
            isDragging ? 'ring-2 ring-neutral-400 ring-offset-2' : ''
          }`}
        >
          {/* Card 1 portion */}
          <div
            className="h-full bg-gradient-to-r from-neutral-700 to-neutral-900 transition-all duration-75 flex items-center justify-end"
            style={{ width: `${card1Percentage}%` }}
          >
            {card1Percentage >= 20 && (
              <span className="text-white text-[10px] font-bold pr-3">
                {formatCurrency(card1Amount, locale)}
              </span>
            )}
          </div>

          {/* Drag Handle */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-8 h-8 bg-white rounded-full shadow-lg border-2 border-neutral-300 flex items-center justify-center transition-transform ${
              isDragging ? 'scale-110 border-neutral-500' : 'hover:scale-105'
            }`}
            style={{ left: `${card1Percentage}%` }}
          >
            <GripVertical className="w-4 h-4 text-neutral-600" />
          </div>

          {/* Card 2 portion */}
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-75 flex items-center justify-start"
            style={{ width: `${card2Percentage}%` }}
          >
            {card2Percentage >= 20 && (
              <span className="text-amber-900 text-[10px] font-bold pl-3">
                {formatCurrency(card2Amount, locale)}
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-center text-neutral-600">
          Arraste para ajustar a divisão entre os cartões
        </p>
      </div>

      {/* Card Amount Inputs */}
      <div className="grid grid-cols-2 gap-4">
        {/* Card 1 */}
        <div className={`p-4 rounded-2xl border-2 ${
          !isValid && card1Amount > 0 ? 'border-red-200 bg-red-50/30' : 'border-neutral-200 bg-neutral-50/50'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-neutral-800" />
            <span className="text-xs font-black uppercase tracking-wider text-neutral-800">
              Cartão 1
            </span>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 text-sm">R$</span>
            <input
              type="text"
              inputMode="decimal"
              value={card1InputValue}
              onChange={(e) => handleCard1InputChange(e.target.value)}
              onFocus={() => setCard1Focused(true)}
              onBlur={applyCard1Value}
              onKeyDown={(e) => handleKeyDown(e, applyCard1Value)}
              className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl text-lg font-bold focus:outline-none transition-all ${
                !isValid && card1Amount > 0
                  ? 'border-red-300 focus:border-red-400'
                  : 'border-neutral-200 focus:border-neutral-400'
              }`}
            />
          </div>
        </div>

        {/* Card 2 */}
        <div className={`p-4 rounded-2xl border-2 ${
          !isValid && card2Amount > 0 ? 'border-red-200 bg-red-50/30' : 'border-amber-200 bg-amber-50/50'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-black uppercase tracking-wider text-amber-700">
              Cartão 2
            </span>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 text-sm">R$</span>
            <input
              type="text"
              inputMode="decimal"
              value={card2InputValue}
              onChange={(e) => handleCard2InputChange(e.target.value)}
              onFocus={() => setCard2Focused(true)}
              onBlur={applyCard2Value}
              onKeyDown={(e) => handleKeyDown(e, applyCard2Value)}
              className={`w-full pl-10 pr-4 py-3 bg-white border rounded-xl text-lg font-bold focus:outline-none transition-all ${
                !isValid && card2Amount > 0
                  ? 'border-red-300 focus:border-red-400'
                  : 'border-amber-200 focus:border-amber-400'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Validation Error Message */}
      {!isValid && (card1Amount > 0 || card2Amount > 0) && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-red-600 block">
              {isMissing
                ? `Faltando ${formatCurrency(Math.abs(difference), locale)}`
                : `Sobrando ${formatCurrency(difference, locale)}`
              }
            </span>
            <span className="text-xs text-red-500 mt-0.5 block">
              A soma dos valores deve ser igual a {formatCurrency(totalAmount, locale)}
            </span>
          </div>
        </div>
      )}

      {/* Installment Selectors - only show when values are valid */}
      {isValid && (
        <div className="space-y-6">
          {/* Card 1 Installments */}
          <div className="p-4 rounded-2xl border border-neutral-200 bg-white">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[10px] font-bold">
                1
              </div>
              <span className="text-xs font-black uppercase tracking-wider">
                Parcelas Cartão 1 ({formatCurrency(card1Amount, locale)})
              </span>
            </div>
            <InstallmentSelector
              options={card1Options}
              selectedInstallments={card1Installments}
              onSelect={onCard1InstallmentsChange}
              baseAmount={card1Amount}
              isLoading={isLoading}
              locale={locale}
              compact
            />
          </div>

          {/* Card 2 Installments */}
          <div className="p-4 rounded-2xl border border-amber-200 bg-white">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold">
                2
              </div>
              <span className="text-xs font-black uppercase tracking-wider">
                Parcelas Cartão 2 ({formatCurrency(card2Amount, locale)})
              </span>
            </div>
            <InstallmentSelector
              options={card2Options}
              selectedInstallments={card2Installments}
              onSelect={onCard2InstallmentsChange}
              baseAmount={card2Amount}
              isLoading={isLoading}
              locale={locale}
              compact
            />
          </div>
        </div>
      )}

      {/* Total Summary - only show when valid */}
      {isValid && (
        <div className={`p-4 rounded-xl border ${
          totalFees > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-neutral-700 block">
                Total com Taxas
              </span>
              <span className="text-xl font-black">
                {formatCurrency(totalWithFees, locale)}
              </span>
            </div>
            {totalFees > 0 && (
              <div className="text-right">
                <span className="text-xs font-black uppercase tracking-wider text-amber-600 block">
                  Taxa Total
                </span>
                <span className="text-lg font-bold text-amber-600">
                  +{formatCurrency(totalFees, locale)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
