import React from 'react';
import { ShoppingBag, ShieldCheck, Loader2 } from 'lucide-react';
import { CartItem } from '../../types';
import { Locale } from '../../i18n';
import { formatCurrency } from '../../utils/currency';

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  total: number;
  paymentMethod: 'credit_card' | 'pix';
  calculatingShipping: boolean;
  shippingDisplay: { price: number; days: number } | null;
  locale: Locale;
  getLoc: (obj: any) => string;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  items,
  subtotal,
  total,
  paymentMethod,
  calculatingShipping,
  shippingDisplay,
  locale,
  getLoc
}) => {
  return (
    <div className="bg-neutral-50 rounded-[3rem] p-10 md:p-12 sticky top-32 border border-neutral-100 shadow-sm">
      <div className="flex items-center gap-4 mb-10 border-b border-neutral-100 pb-6">
        <ShoppingBag className="w-5 h-5 text-neutral-400" />
        <h4 className="text-[10px] font-black uppercase tracking-[0.4em]">Sua Sacola</h4>
      </div>
      
      <div className="space-y-8 mb-12 max-h-[400px] overflow-y-auto pr-4 no-scrollbar">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex gap-6 items-center animate-in slide-in-from-right duration-500"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="w-20 h-24 bg-white rounded-2xl overflow-hidden flex-none border border-neutral-100 shadow-sm">
              <img src={item.image} className="w-full h-full object-cover" alt={getLoc(item.name)} />
            </div>
            <div className="flex-1">
              <h5 className="text-[11px] font-black uppercase tracking-tight leading-tight mb-1">
                {getLoc(item.name)}
              </h5>
              <p className="text-[9px] text-neutral-400 uppercase font-bold tracking-widest">
                {getLoc(item.color_name)} | {item.size}
              </p>
              <p className="text-[10px] font-black mt-2">Qtd: {item.quantity}</p>
            </div>
            <span className="text-[12px] font-black tracking-tighter">
              {formatCurrency(item.price * item.quantity, locale)}
            </span>
          </div>
        ))}
      </div>
      
      <div className="space-y-4 pt-10 border-t border-neutral-200">
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-neutral-400">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal, locale)}</span>
        </div>
        
        {/* FREIGHT DISPLAY LOGIC */}
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-neutral-400">
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
                <span className="text-green-500 font-black">GRÁTIS</span>
              </>
            ) : (
              <span className="text-neutral-300">Aguardando CEP</span>
            )}
          </div>
        </div>
        
        {shippingDisplay && !calculatingShipping && (
          <div className="text-right text-[8px] font-bold text-neutral-400 uppercase tracking-widest">
            Prazo Estimado: {shippingDisplay.days} dias úteis
          </div>
        )}

        {paymentMethod === 'pix' && (
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-green-500">
            <span>Desconto PIX (5%)</span>
            <span>-{formatCurrency(total * 0.05, locale)}</span>
          </div>
        )}
        
        <div className="flex justify-between items-center pt-8 mt-6 border-t border-neutral-100">
          <span className="text-xl font-black uppercase italic tracking-tighter">Total</span>
          <span className="text-4xl font-light tracking-tighter">
            {formatCurrency(paymentMethod === 'pix' ? total * 0.95 : total, locale)}
          </span>
        </div>
      </div>
      
      <div className="mt-12 p-8 bg-white rounded-3xl border border-neutral-100 flex items-center gap-5 shadow-sm">
        <ShieldCheck className="w-6 h-6 text-neutral-300" />
        <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400 leading-loose">
          Transação protegida por criptografia militar de 256 bits via Auricapri Cloud Protocol.
        </span>
      </div>
    </div>
  );
};

