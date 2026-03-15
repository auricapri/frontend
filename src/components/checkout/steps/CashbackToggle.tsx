import { formatCurrency } from '../../../utils/currency';
import type { Locale } from '../../../i18n';

interface CashbackToggleProps {
  availableCashback: number;
  useCashback: boolean;
  onToggle: () => void;
  locale: Locale;
}

export function CashbackToggle({ availableCashback, useCashback, onToggle, locale }: CashbackToggleProps) {
  return (
    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
          <span className="text-white text-[10px] font-normal">R$</span>
        </div>
        <div>
          <span className="text-xs font-normal uppercase tracking-wider block text-emerald-900">Cashback Disponível</span>
          <span className="text-lg font-light tracking-tighter text-emerald-700">
            {formatCurrency(availableCashback, locale)}
          </span>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`relative w-14 h-8 rounded-full transition-all duration-300 ${useCashback ? 'bg-emerald-600' : 'bg-neutral-300'}`}
      >
        <div
          className={`absolute top-1 left-1 w-6 h-6 bg-paper rounded-full shadow-md transition-transform duration-300 ${
            useCashback ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
