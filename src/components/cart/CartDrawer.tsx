
import React from 'react';
import { X, Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { CartItem, UserMode } from '../../types';
import { Locale } from '../../i18n';
import { formatCurrency } from '../../utils/currency';
import BoxSavingsIndicator from './BoxSavingsIndicator';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  userMode: UserMode;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
  t: (key: string) => any;
  locale: Locale;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ 
  isOpen, 
  onClose, 
  items, 
  userMode: _userMode, 
  onUpdateQuantity, 
  onRemoveItem, 
  onCheckout,
  t, 
  locale 
}) => {
  const getLoc = (obj: any) => {
    if (!obj) return "";
    if (typeof obj === 'string') return obj;
    return obj[locale] || obj['pt'] || obj['en'] || Object.values(obj)[0] || "";
  };

  const subtotal = items.reduce((sum, item) => {
    const price = item.price;
    return sum + (price * item.quantity);
  }, 0);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-white z-[70] shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 md:p-8 border-b border-gray-100">
          <h2 className="text-xl font-light tracking-widest uppercase">{t('cart.title')} ({items.length})</h2>
          <button onClick={onClose} aria-label="Close drawer" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Box Savings Indicator */}
        {items.length > 0 && (
          <div className="px-6 md:px-8 pt-4">
            <BoxSavingsIndicator
              itemCount={items.reduce((sum, item) => sum + item.quantity, 0)}
              locale={locale}
            />
          </div>
        )}

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 no-scrollbar">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
              <span className="text-4xl font-light">{t('cart.empty')}</span>
              <button onClick={onClose} className="text-sm underline tracking-widest text-black">{t('cart.continue')}</button>
            </div>
          ) : (
            items.map((item) => {
              const price = item.price;
              return (
                <div key={`${item.variant_id}-${item.size}-${item.color_hex}`} className="flex space-x-6 animate-in fade-in slide-in-from-right duration-300">
                  <div className="w-24 h-32 bg-gray-100 flex-none overflow-hidden rounded-xl">
                    <img src={item.image} alt={getLoc(item.name)} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="text-[11px] font-black uppercase tracking-tight leading-tight">{getLoc(item.name)}</h3>
                        <p className="text-sm font-light">{formatCurrency(price * item.quantity, locale)}</p>
                      </div>
                      <p className="text-[9px] text-gray-400 mt-1 uppercase font-bold tracking-widest">{getLoc(item.color_name)} / {item.size}</p>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center bg-neutral-50 rounded-lg border border-neutral-100">
                        <button 
                          onClick={() => onUpdateQuantity(item.variant_id, -1)}
                          className="px-3 py-2 hover:bg-neutral-100 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 text-[10px] font-black">{item.quantity}</span>
                        <button 
                           onClick={() => onUpdateQuantity(item.variant_id, 1)}
                           className="px-3 py-2 hover:bg-neutral-100 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button 
                        onClick={() => onRemoveItem(item.variant_id)}
                        className="p-3 text-neutral-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer / Checkout */}
        {items.length > 0 && (
          <div className="p-8 md:p-10 border-t border-gray-100 bg-white">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[10px] uppercase tracking-[0.3em] font-black text-neutral-400">{t('cart.subtotal')}</span>
              <span className="text-2xl font-light">{formatCurrency(subtotal, locale)}</span>
            </div>
            <p className="text-[9px] text-neutral-300 mb-8 text-center uppercase tracking-widest font-black">{t('cart.shippingInfo')}</p>
            <button 
              onClick={onCheckout}
              className="w-full bg-black text-white py-8 rounded-[2rem] flex items-center justify-between px-10 hover:bg-neutral-800 transition-all shadow-2xl active:scale-95 group"
            >
              <span className="uppercase tracking-[0.4em] text-[11px] font-black">{t('cart.checkout')}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
