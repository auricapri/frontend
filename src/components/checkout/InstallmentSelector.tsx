import React from 'react';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import type { InstallmentOption } from '../../types/payment.types';
import type { Locale } from '../../i18n';

interface InstallmentSelectorProps {
  options: InstallmentOption[];
  selectedInstallments: number;
  onSelect: (installments: number, code: string) => void;
  baseAmount: number;
  isLoading?: boolean;
  locale?: Locale;
  compact?: boolean;
}

export function InstallmentSelector({
  options,
  selectedInstallments,
  onSelect,
  baseAmount,
  isLoading = false,
  locale = 'pt',
  compact = false
}: InstallmentSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const selectedOption = options.find(o => o.installments === selectedInstallments);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6 bg-paper rounded-2xl border border-neutral-100">
        <Loader2 className="w-5 h-5 animate-spin text-neutral-600" />
        <span className="ml-3 text-xs font-bold uppercase tracking-widest text-neutral-600">
          Carregando parcelas...
        </span>
      </div>
    );
  }

  if (options.length === 0) {
    return null;
  }

  // Compact mode: dropdown
  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-widest text-neutral-600 font-serif">
            Parcelas
          </h4>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full p-4 bg-paper border border-neutral-200 rounded-xl flex items-center justify-between hover:border-neutral-300 transition-all"
          >
            <div className="text-left flex items-center gap-2">
              <span className="text-sm font-bold">
                {selectedOption
                  ? selectedOption.installments === 1
                    ? 'À vista'
                    : `${selectedOption.installments}x`
                  : 'Selecionar parcelas'}
              </span>
              {selectedOption && (
                <span className="text-xs text-neutral-700">
                  {selectedOption.installments === 1 ? '' : 'de '}{formatCurrency(selectedOption.installmentValue, locale)}
                </span>
              )}
              {/* À vista NUNCA tem taxa */}
              {selectedOption && selectedOption.installments === 1 && (
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  Sem juros
                </span>
              )}
              {/* Parcelado com taxa */}
              {selectedOption && selectedOption.installments > 1 && selectedOption.feeAmount > 0 && (
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  +{formatCurrency(selectedOption.feeAmount, locale)} taxa
                </span>
              )}
              {/* Parcelado sem taxa (promoção) */}
              {selectedOption && selectedOption.installments > 1 && (!selectedOption.feeAmount || selectedOption.feeAmount < 0.01) && (
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  Sem juros
                </span>
              )}
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-paper border border-neutral-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
              {options.map((option) => {
                const isAvista = option.installments === 1;
                // À vista NUNCA tem taxa, independente do que vier do backend
                const hasFee = !isAvista && option.feeAmount > 0;
                return (
                  <button
                    key={option.installments}
                    type="button"
                    onClick={() => {
                      onSelect(option.installments, option.code);
                      setIsOpen(false);
                    }}
                    className={`w-full p-4 flex items-center justify-between hover:bg-neutral-50 transition-all border-b border-neutral-100 last:border-b-0 ${
                      option.installments === selectedInstallments ? 'bg-neutral-50' : ''
                    }`}
                  >
                    <div className="text-left flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">
                          {isAvista ? 'À vista' : `${option.installments}x`}
                        </span>
                        <span className="text-xs text-neutral-700">
                          {isAvista ? '' : 'de '}{formatCurrency(option.installmentValue, locale)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {isAvista ? (
                          <span className="text-xs font-bold text-green-600">
                            Sem juros
                          </span>
                        ) : (
                          <>
                            <span className="text-xs text-neutral-600">
                              Total: {formatCurrency(option.totalValue, locale)}
                            </span>
                            {hasFee ? (
                              <span className="text-xs font-bold text-amber-600">
                                (+{formatCurrency(option.feeAmount, locale)} de taxa)
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-green-600">
                                Sem juros
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    {option.installments === selectedInstallments && (
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary below dropdown */}
        {selectedOption && (() => {
          const isAvista = selectedOption.installments === 1;
          // À vista NUNCA tem taxa
          const hasFee = !isAvista && selectedOption.feeAmount > 0;
          return (
            <div className={`p-4 rounded-xl border ${
              hasFee
                ? 'bg-amber-50 border-amber-200'
                : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-neutral-700 block">
                    {isAvista ? 'Pagamento à vista' : `${selectedOption.installments}x de`}
                  </span>
                  <span className="text-xl font-black">
                    {formatCurrency(selectedOption.installmentValue, locale)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black uppercase tracking-widest text-neutral-700 block">
                    Total a pagar
                  </span>
                  <span className="text-lg font-bold">
                    {formatCurrency(isAvista ? selectedOption.installmentValue : selectedOption.totalValue, locale)}
                  </span>
                  {hasFee ? (
                    <span className="text-xs text-amber-600 font-bold block">
                      Taxa: +{formatCurrency(selectedOption.feeAmount, locale)}
                    </span>
                  ) : (
                    <span className="text-xs text-green-600 font-bold block">
                      Sem taxa de juros
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  // Full mode: grid of options
  // À vista NUNCA tem taxa
  const selectedIsAvista = selectedOption?.installments === 1;
  const selectedHasFee = !selectedIsAvista && selectedOption && selectedOption.feeAmount > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black uppercase tracking-widest text-neutral-600 font-serif">
          Parcelas
        </h4>
        {selectedHasFee && (
          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
            + {formatCurrency(selectedOption.feeAmount, locale)} de taxa
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {options.map((option) => {
          const isSelected = option.installments === selectedInstallments;
          const isAvista = option.installments === 1;
          // À vista NUNCA tem taxa
          const hasFee = !isAvista && option.feeAmount > 0;

          return (
            <button
              key={option.installments}
              type="button"
              onClick={() => onSelect(option.installments, option.code)}
              className={`p-3 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-black bg-black text-white'
                  : hasFee
                    ? 'border-amber-200 bg-amber-50 hover:border-amber-300'
                    : 'border-neutral-100 bg-paper hover:border-neutral-300'
              }`}
            >
              <div className="text-center">
                <span className={`text-lg font-black ${isSelected ? 'text-white' : 'text-black'}`}>
                  {isAvista ? '1x' : `${option.installments}x`}
                </span>
                <span className={`text-xs block mt-1 ${isSelected ? 'text-white/70' : 'text-neutral-700'}`}>
                  {formatCurrency(option.installmentValue, locale)}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Summary */}
      {selectedOption && (
        <div className={`p-4 rounded-xl border ${
          selectedHasFee
            ? 'bg-amber-50 border-amber-200'
            : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-neutral-700 block">
                {selectedIsAvista ? 'Pagamento à vista' : `${selectedOption.installments}x de`}
              </span>
              <span className="text-xl font-black">
                {formatCurrency(selectedOption.installmentValue, locale)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-black uppercase tracking-widest text-neutral-700 block">
                Total
              </span>
              <span className="text-lg font-bold">
                {formatCurrency(selectedIsAvista ? selectedOption.installmentValue : selectedOption.totalValue, locale)}
              </span>
              {selectedHasFee ? (
                <span className="text-xs text-amber-600 block">
                  (inclui taxa de {formatCurrency(selectedOption.feeAmount, locale)})
                </span>
              ) : (
                <span className="text-xs text-green-600 block">
                  Sem taxa de juros
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
