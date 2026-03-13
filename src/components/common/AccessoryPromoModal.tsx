import React, { useEffect, useState } from 'react';
import { X, Sparkles, ShoppingBag } from 'lucide-react';

const STORAGE_KEY = 'accessory_promo_seen_v1';

interface AccessoryPromoModalProps {
  onClose: () => void;
  onShopNow?: () => void;
}

export function AccessoryPromoModal({ onClose, onShopNow }: AccessoryPromoModalProps) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 sm:p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-paper rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-500">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-10 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-all"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Image / visual header */}
        <div className="relative h-52 bg-neutral-900 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-3">
                <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
                <span className="text-6xl font-black text-white tracking-tighter">15%</span>
                <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
              </div>
              <p className="text-white/70 text-xs font-black uppercase tracking-[0.4em]">de desconto</p>
            </div>
          </div>
          {/* Decorative circles */}
          <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-violet-600/20" />
          <div className="absolute -bottom-8 -right-8 w-36 h-36 rounded-full bg-yellow-400/10" />
          <div className="absolute top-8 right-16 w-20 h-20 rounded-full bg-white/5" />
        </div>

        {/* Content */}
        <div className="p-8 sm:p-10 space-y-5">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-violet-500 block mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" /> Promoção Especial
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-light tracking-tighter leading-tight">
              Acessório com <strong className="font-black text-violet-700">15% off</strong><br />
              ao comprar com uma roupa
            </h2>
          </div>

          <p className="text-sm text-neutral-500 leading-relaxed">
            Adicione qualquer vestido, conjunto ou top ao seu carrinho e ganhe <strong>15% de desconto automático</strong> em todos os acessórios da compra.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => { onShopNow?.(); onClose(); }}
              className="flex-1 py-4 bg-black text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.4em] hover:bg-neutral-800 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" /> Ver Coleção
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-4 bg-neutral-100 text-neutral-600 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.4em] hover:bg-neutral-200 transition-all active:scale-95"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useAccessoryPromoModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Use localStorage so it only shows once per browser (not every session)
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      const timer = setTimeout(() => {
        setShow(true);
        localStorage.setItem(STORAGE_KEY, '1');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  return { show, close: () => setShow(false) };
}
