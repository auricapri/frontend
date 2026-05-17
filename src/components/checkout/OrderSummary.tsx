import React from 'react';
import { ShoppingBag, ShieldCheck, Loader2 } from 'lucide-react';
import { CartItem, UserMode } from '../../types';
import { Locale } from '../../i18n';
import { formatCurrency } from '../../utils/currency';
import { ShippingOption } from '../../services/logistics.service';
import { PaymentMethod } from '../../constants/enums';
import { OptimizedImage } from '../ui';
import BoxSavingsIndicator from '../cart/BoxSavingsIndicator';

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  total: number;
  paymentMethod: PaymentMethod;
  calculatingShipping: boolean;
  shippingDisplay: { price: number; days: number } | null;
  locale: Locale;
  getLoc: (obj: unknown) => string; // allow: pragmatic any
  userMode?: UserMode;
  shippingOptions?: ShippingOption[];
  selectedShippingOption?: ShippingOption | null;
  onSelectShippingOption?: (option: ShippingOption) => void;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  items,
  subtotal,
  total,
  paymentMethod,
  calculatingShipping,
  shippingDisplay,
  locale,
  getLoc,
  userMode,
  shippingOptions = [],
  selectedShippingOption,
  onSelectShippingOption
}) => {
  return (
    <div className="bg-neutral-50 rounded-[3rem] p-10 md:p-12 sticky top-32 border border-neutral-100 shadow-sm">
      <div className="flex items-center gap-4 mb-6 border-b border-neutral-100 pb-6">
        <ShoppingBag className="w-5 h-5 text-neutral-400" />
        <h4 className="text-[10px] font-normal uppercase tracking-[0.4em]">Sua Sacola</h4>
      </div>

      {/* Box Savings Indicator */}
      {items.length > 0 && userMode !== UserMode.ATACADO && (
        <div className="mb-8">
          <BoxSavingsIndicator
            itemCount={items.reduce((sum, item) => sum + (item?.quantity || 0), 0)}
            subtotal={subtotal}
            locale={locale}
          />
        </div>
      )}

      <div className="space-y-8 mb-12 max-h-[400px] overflow-y-auto pr-4 no-scrollbar">
        {Array.isArray(items) && items.length > 0 ? items.map((item, idx) => (
          <div
            key={idx}
            className="flex gap-6 items-center animate-in slide-in-from-right duration-500"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="w-20 h-24 bg-paper rounded-2xl overflow-hidden flex-none border border-neutral-100 shadow-sm">
              <OptimizedImage 
                src={item?.image} 
                alt={getLoc(item?.name)} 
                size="thumbnail"
                objectFit="cover"
                className="w-full h-full"
              />
            </div>
            <div className="flex-1">
              <h5 className="text-[11px] font-normal uppercase tracking-tight leading-tight mb-1">
                {getLoc(item?.name)}
              </h5>
              <p className="text-[10px] text-neutral-400 uppercase font-normal tracking-widest">
                {getLoc(item?.color_name)} | {item?.size || 'N/A'}
              </p>
              <p className="text-[10px] font-normal mt-2">Qtd: {item?.quantity || 0}</p>
            </div>
            <span className="text-[12px] font-normal tracking-tighter">
              {formatCurrency((item?.price || 0) * (item?.quantity || 0), locale)}
            </span>
          </div>
        )) : (
          <div className="text-center py-8 text-neutral-400 text-sm">Nenhum item no carrinho</div>
        )}
      </div>
      
      <div className="space-y-4 pt-10 border-t border-neutral-200">
        <div className="flex justify-between items-center text-[10px] font-normal uppercase tracking-widest text-neutral-400">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal, locale)}</span>
        </div>
        
        {/* FREIGHT DISPLAY LOGIC */}
        {userMode === UserMode.ATACADO && Array.isArray(shippingOptions) && shippingOptions.length > 0 ? (
          <div className="space-y-3">
            <div className="text-[10px] font-normal uppercase tracking-widest text-neutral-400 mb-2">
              Opções de Frete
            </div>
            {shippingOptions.map((option, idx) => {
              if (!option) return null;
              const isSelected = selectedShippingOption?.method === option.method;
              const safeOptions = Array.isArray(shippingOptions) ? shippingOptions.filter(o => o) : [];
              const isCheapest = safeOptions.length > 0 && option.real_cost === Math.min(...safeOptions.map(o => o?.real_cost || Infinity));
              const isFastest = safeOptions.length > 0 && option.estimated_days === Math.min(...safeOptions.map(o => o?.estimated_days || Infinity));
              
              return (
                <button
                  key={idx}
                  onClick={() => onSelectShippingOption?.(option)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    isSelected 
                      ? 'border-neutral-900 bg-paper' 
                      : 'border-neutral-100 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-[11px] font-normal uppercase tracking-tight">
                        {option.method} - {option.provider}
                      </div>
                      <div className="flex gap-2 mt-1">
                        {isCheapest && (
                          <span className="text-[10px] font-normal uppercase tracking-widest text-green-600 bg-green-50 px-2 py-0.5 rounded">
                            Mais Barato
                          </span>
                        )}
                        {isFastest && (
                          <span className="text-[10px] font-normal uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            Mais Rápido
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[12px] font-normal tracking-tighter">
                        {formatCurrency(option.display_price_was, locale)}
                      </div>
                      <div className="text-[10px] text-neutral-400 uppercase tracking-widest mt-0.5">
                        {option.estimated_days} dias
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center text-[10px] font-normal uppercase tracking-widest text-neutral-400">
              <span>Frete</span>
              <div className="flex items-center gap-2">
                {calculatingShipping ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Calc...
                  </span>
                ) : shippingDisplay ? (
                  <>
                    <span className="line-through text-neutral-500 decoration-red-500 decoration-2 font-medium">
                      {formatCurrency(shippingDisplay.price, locale)}
                    </span>
                    <span className="text-green-500 font-normal">GRÁTIS</span>
                  </>
                ) : (
                  <span className="text-neutral-300">Aguardando CEP</span>
                )}
              </div>
            </div>
            
            {shippingDisplay && !calculatingShipping && (
              <div className="text-right text-[10px] font-normal text-neutral-400 uppercase tracking-widest">
                Prazo Estimado: {shippingDisplay.days} dias úteis
              </div>
            )}
          </>
        )}

        {paymentMethod === PaymentMethod.PIX && (
          <div className="flex justify-between items-center text-[10px] font-normal uppercase tracking-widest text-green-500">
            <span>Desconto PIX (5%)</span>
            <span>-{formatCurrency(total * 0.05, locale)}</span>
          </div>
        )}
        
        <div className="flex justify-between items-center pt-8 mt-6 border-t border-neutral-100">
          <span className="text-xl font-normal uppercase tracking-tighter">Total</span>
          <span className="text-4xl font-light tracking-tighter">
            {formatCurrency(paymentMethod === PaymentMethod.PIX ? total * 0.95 : total, locale)}
          </span>
        </div>
      </div>
      
      <div className="mt-12 p-8 bg-paper rounded-3xl border border-neutral-100 flex items-center gap-5 shadow-sm">
        <ShieldCheck className="w-6 h-6 text-neutral-300" />
        <span className="text-[10px] font-normal uppercase tracking-widest text-neutral-400 leading-loose">
          Pagamento seguro via Asaas. Seus dados são protegidos com criptografia SSL 256 bits.
        </span>
      </div>
    </div>
  );
};

