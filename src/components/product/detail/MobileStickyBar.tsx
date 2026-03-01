/// Mobile Sticky Bar
/// Bottom sticky bar for mobile with actions and share popup

import React from 'react';
import { Heart, Share2, ChevronLeft, ShoppingBag, MessageCircle, Facebook, Twitter, Copy, Check } from 'lucide-react';

interface MobileStickyBarProps {
  isVisible: boolean;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
  isShareOpen: boolean;
  onToggleShare: () => void;
  linkCopied: boolean;
  onShare: (platform: 'whatsapp' | 'facebook' | 'twitter' | 'copy') => void;
  onBack: () => void;
  onAddToCart?: () => void;
  addToCartLabel?: string;
  addToCartDisabled?: boolean;
}

export function MobileStickyBar({
  isVisible,
  isWishlisted,
  onToggleWishlist,
  isShareOpen,
  onToggleShare,
  linkCopied,
  onShare,
  onBack,
  onAddToCart,
  addToCartLabel,
  addToCartDisabled,
}: MobileStickyBarProps) {
  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-100 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-40 md:hidden transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div
        className="flex items-stretch h-16 px-4 py-2 gap-2"
      >
        <button
          onClick={onToggleWishlist}
          className={`flex items-center justify-center rounded-xl border transition-all w-12 shrink-0 ${
            isWishlisted
              ? 'bg-black text-white border-black'
              : 'border-neutral-200 text-neutral-600 hover:border-black'
          }`}
        >
          <Heart className="w-4 h-4" fill={isWishlisted ? "currentColor" : "none"} />
        </button>

        <button
          onClick={onToggleShare}
          className={`flex items-center justify-center rounded-xl border transition-all w-12 shrink-0 ${
            isShareOpen
              ? 'bg-black text-white border-black'
              : 'border-neutral-200 text-neutral-600 hover:border-black'
          }`}
        >
          <Share2 className="w-4 h-4" />
        </button>

        {onAddToCart ? (
          <button
            onClick={onAddToCart}
            disabled={addToCartDisabled}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-black text-white transition-all hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {addToCartLabel || 'Adicionar à Bolsa'}
            </span>
          </button>
        ) : (
          <button
            onClick={onBack}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-black text-white transition-all hover:bg-neutral-800"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Voltar</span>
          </button>
        )}
      </div>

      {isShareOpen && (
        <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-2xl shadow-2xl border border-neutral-100 p-4 animate-in slide-in-from-bottom-2 fade-in duration-300">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2 block px-2">
            Compartilhar
          </span>

          <div className="flex flex-col gap-1">
            <button
              onClick={() => onShare('whatsapp')}
              className="flex items-center gap-3 p-3 hover:bg-neutral-50 rounded-xl transition-all group w-full text-left"
            >
              <div className="bg-green-500 text-white p-1.5 rounded-full">
                <MessageCircle className="w-3 h-3" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest">WhatsApp</span>
            </button>

            <button
              onClick={() => onShare('facebook')}
              className="flex items-center gap-3 p-3 hover:bg-neutral-50 rounded-xl transition-all group w-full text-left"
            >
              <div className="bg-blue-600 text-white p-1.5 rounded-full">
                <Facebook className="w-3 h-3" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest">Facebook</span>
            </button>

            <button
              onClick={() => onShare('twitter')}
              className="flex items-center gap-3 p-3 hover:bg-neutral-50 rounded-xl transition-all group w-full text-left"
            >
              <div className="bg-black text-white p-1.5 rounded-full">
                <Twitter className="w-3 h-3" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest">X / Twitter</span>
            </button>

            <div className="h-[1px] bg-neutral-100 my-2" />

            <button
              onClick={() => onShare('copy')}
              className="flex items-center gap-3 p-3 hover:bg-neutral-50 rounded-xl transition-all group w-full text-left"
            >
              <div className="bg-neutral-100 text-black p-1.5 rounded-full">
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
  );
}
