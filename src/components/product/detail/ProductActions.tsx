/// Product Actions
/// Quantity controls, add to cart, wishlist, share, and trust badges

import React from 'react';
import {
  Check, Copy, Facebook, Heart, MessageCircle,
  Minus, Plus, RefreshCw, Share2, ShieldCheck, Truck, Twitter
} from 'lucide-react';

interface ProductActionsProps {
  quantity: number;
  onDecrement: () => void;
  onIncrement: () => void;
  maxQuantity: number;
  onAddToCart: () => void;
  addDisabled: boolean;
  addLabel: string;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
  isShareOpen: boolean;
  onToggleShare: () => void;
  linkCopied: boolean;
  onShare: (platform: 'whatsapp' | 'facebook' | 'twitter' | 'copy') => void;
}

export function ProductActions({
  quantity,
  onDecrement,
  onIncrement,
  maxQuantity,
  onAddToCart,
  addDisabled,
  addLabel,
  isWishlisted,
  onToggleWishlist,
  isShareOpen,
  onToggleShare,
  linkCopied,
  onShare,
}: ProductActionsProps) {
  return (
    <div className="pt-6 border-t border-neutral-100 bg-paper">
      <div className="flex flex-col gap-4">
        <div className="flex items-stretch gap-3 h-16">
          <div className="flex flex-none items-center bg-neutral-50 rounded-2xl border border-neutral-100 px-4 space-x-6">
            <button onClick={onDecrement} className="p-2 hover:opacity-50 transition-opacity">
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-sm font-black w-4 text-center">{quantity}</span>
            <button
              onClick={onIncrement}
              className={`p-2 transition-opacity ${
                quantity >= maxQuantity ? 'opacity-20 cursor-not-allowed' : 'hover:opacity-50'
              }`}
              disabled={quantity >= maxQuantity}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onAddToCart}
            disabled={addDisabled}
            className="flex-1 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-neutral-800 transition-all active:scale-[0.98] disabled:opacity-20 flex items-center justify-center text-center px-4"
          >
            {addLabel}
          </button>

          <button
            onClick={onToggleWishlist}
            aria-label="Toggle wishlist"
            className={`hidden md:flex flex-none aspect-square border rounded-2xl items-center justify-center transition-all duration-500 ${
              isWishlisted
                ? 'bg-black text-white border-black shadow-lg'
                : 'border-neutral-100 text-neutral-300 hover:text-black hover:border-black hover:bg-neutral-50'
            }`}
          >
            <Heart
              className="w-5 h-5 transition-transform active:scale-125"
              fill={isWishlisted ? 'currentColor' : 'none'}
            />
          </button>

          <div className="hidden md:block relative">
            <button
              onClick={onToggleShare}
              className={`h-full aspect-square border rounded-2xl flex items-center justify-center transition-all duration-500 ${
                isShareOpen
                  ? 'bg-black text-white border-black shadow-lg'
                  : 'border-neutral-100 text-neutral-300 hover:text-black hover:border-black hover:bg-neutral-50'
              }`}
            >
              <Share2 className="w-5 h-5" />
            </button>

            {isShareOpen && (
              <div className="absolute bottom-[110%] right-0 min-w-[220px] bg-paper rounded-[2rem] shadow-2xl border border-neutral-100 p-4 animate-in slide-in-from-bottom-2 fade-in duration-300 z-50">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2 block px-2">
                  Compartilhar
                </span>

                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => onShare('whatsapp')}
                    className="flex items-center gap-3 p-3 hover:bg-neutral-50 rounded-xl transition-all group w-full text-left"
                  >
                    <div className="bg-green-500 text-white p-1.5 rounded-full group-hover:scale-110 transition-transform">
                      <MessageCircle className="w-3 h-3" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">WhatsApp</span>
                  </button>

                  <button
                    onClick={() => onShare('facebook')}
                    className="flex items-center gap-3 p-3 hover:bg-neutral-50 rounded-xl transition-all group w-full text-left"
                  >
                    <div className="bg-blue-600 text-white p-1.5 rounded-full group-hover:scale-110 transition-transform">
                      <Facebook className="w-3 h-3" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Facebook</span>
                  </button>

                  <button
                    onClick={() => onShare('twitter')}
                    className="flex items-center gap-3 p-3 hover:bg-neutral-50 rounded-xl transition-all group w-full text-left"
                  >
                    <div className="bg-black text-white p-1.5 rounded-full group-hover:scale-110 transition-transform">
                      <Twitter className="w-3 h-3" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">X / Twitter</span>
                  </button>

                  <div className="h-[1px] bg-neutral-100 my-2" />

                  <button
                    onClick={() => onShare('copy')}
                    className="flex items-center gap-3 p-3 hover:bg-neutral-50 rounded-xl transition-all group w-full text-left"
                  >
                    <div className="bg-neutral-100 text-black p-1.5 rounded-full group-hover:scale-110 transition-transform">
                      {linkCopied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      {linkCopied ? 'Copiado!' : 'Copiar Link'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center gap-4 pt-2">
          <div className="flex items-center gap-2 text-neutral-600">
            <RefreshCw className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Troca fácil</span>
          </div>
          <div className="flex items-center gap-2 text-neutral-600">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Pagamento seguro</span>
          </div>
          <div className="flex items-center gap-2 text-neutral-600">
            <Truck className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Envio para todo Brasil</span>
          </div>
        </div>
      </div>
    </div>
  );
}
