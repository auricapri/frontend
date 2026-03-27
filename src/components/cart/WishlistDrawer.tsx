
import React, { useState } from 'react';
import { X, ShoppingBag, Trash2, ArrowRight, Link2, MessageCircle, ShoppingCart, Facebook } from 'lucide-react';

// Custom X (Twitter) icon component
const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
import { Product, UserMode } from '../../types';
import { Locale } from '../../i18n';
import { WishlistApi } from '../../api/wishlist.api';
import { ProductCard } from '../product/ProductCard';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: Product[];
  userMode: UserMode;
  onRemoveItem: (id: string) => void;
  onSelectProduct: (product: Product) => void;
  onBuyAll: () => void;
  t: (key: string) => any;
  locale: Locale;
  currentUserId?: string;
  wishlistVariantIds?: Record<string, string>;
}

const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  onClose,
  items,
  userMode,
  onRemoveItem,
  onSelectProduct,
  onBuyAll,
  t,
  locale,
  currentUserId,
  wishlistVariantIds = {},
}) => {
  const getLoc = (obj: any) => {
    if (!obj) return "";
    if (typeof obj === 'string') return obj;
    return obj[locale] || obj['pt'] || obj['en'] || Object.values(obj)[0] || "";
  };

  const [copiedLink, setCopiedLink] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const wishlistApi = new WishlistApi();

  // Get or generate share URL
  const getShareUrl = async (): Promise<string | null> => {
    if (!currentUserId) {
      return null;
    }

    // If we already have a share URL, return it
    if (shareUrl) {
      return shareUrl;
    }

    try {
      setIsGeneratingLink(true);
      const shareSlug = await wishlistApi.getShareSlug();
      const url = `${window.location.origin}/wishlist/${shareSlug}`;
      setShareUrl(url);
      return url;
    } catch (error: any) {
      console.error('Error generating share link:', error);
      return null;
    } finally {
      setIsGeneratingLink(false);
    }
  };

  // Copy to clipboard with fallback
  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      
      // Fallback: use temporary input element
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch {
        document.body.removeChild(textArea);
        return false;
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  };

  const handleShareLink = async () => {
    if (!currentUserId) {
      alert('Você precisa estar logado para compartilhar sua wishlist');
      return;
    }

    const url = await getShareUrl();
    if (!url) {
      alert('Erro ao gerar link de compartilhamento. Tente novamente.');
      return;
    }

    const success = await copyToClipboard(url);
    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } else {
      // If clipboard fails, show the URL in an alert so user can copy manually
      alert(`Link de compartilhamento:\n\n${url}\n\nCopie este link manualmente.`);
    }
  };

  const handleSocialShare = async (platform: string) => {
    if (!currentUserId) {
      alert('Você precisa estar logado para compartilhar sua wishlist');
      return;
    }

    const url = await getShareUrl();
    if (!url) {
      alert('Erro ao gerar link de compartilhamento. Tente novamente.');
      return;
    }

    const text = `Dá uma olhada na minha wishlist de luxo da Auricapri!`;
    
    // Try Web Share API first (works on mobile and modern browsers)
    if (platform === 'whatsapp' && navigator.share) {
      try {
        await navigator.share({
          title: 'Minha Wishlist Auricapri',
          text: text,
          url: url
        });
        return;
      } catch (error: any) {
        // User cancelled or share failed, fall through to WhatsApp web
        if (error.name !== 'AbortError') {
          console.error('Web Share API failed:', error);
        }
      }
    }
    
    // Fallback to platform-specific URLs
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div role="dialog" aria-modal="true" className="fixed top-0 right-0 h-full w-full md:w-[480px] bg-paper z-[70] shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-8 border-b border-gray-100 bg-paper">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-300">{t('wishlist.curation')}</span>
            <h2 className="text-2xl font-black font-serif tracking-tighter uppercase italic">{t('wishlist.title')} ({items.length})</h2>
          </div>
          <button onClick={onClose} aria-label="Close drawer" className="p-4 bg-neutral-50 rounded-full hover:rotate-90 transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Area - Fixed scroll with proper padding */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8 no-scrollbar bg-neutral-50/30">

          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-6 py-20">
              <div className="w-24 h-24 bg-paper rounded-full flex items-center justify-center shadow-sm">
                <ShoppingBag className="w-10 h-10 stroke-1" />
              </div>
              <span className="text-xl font-light text-neutral-400 uppercase tracking-widest">{t('wishlist.empty')}</span>
              <button onClick={onClose} className="px-10 py-4 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">{t('wishlist.discover')}</button>
            </div>
          ) : (
            <>
              {/* Items Grid - 2 columns */}
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                {items.map((item) => {
                  const selectedVariantId = wishlistVariantIds[item.id];
                  const selectedVariant = selectedVariantId
                    ? item.variants?.find(v => v.id === selectedVariantId)
                    : null;
                  return (
                  <div key={item.id} className="relative">
                    <ProductCard
                      product={item}
                      userMode={userMode}
                      locale={locale}
                      variant="grid"
                      showWishlist={false}
                      showQuickAdd={false}
                      showDiscountBadge={true}
                      showColorSwatches={true}
                      onClick={() => { onSelectProduct(item); onClose(); }}
                    />
                    {/* Selected variant badge */}
                    {selectedVariant && (
                      <div className="absolute bottom-2 left-2 right-8 flex items-center gap-1 bg-black/80 backdrop-blur-sm text-white rounded-lg px-2 py-1 z-10">
                        {selectedVariant.color_hex && (
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/30"
                            style={{ backgroundColor: selectedVariant.color_hex }}
                          />
                        )}
                        <span className="text-[9px] font-bold uppercase tracking-wider truncate">
                          {[getLoc(selectedVariant.color_name), selectedVariant.size].filter(Boolean).join(' · ')}
                        </span>
                      </div>
                    )}
                    {/* Remove from wishlist button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemoveItem(item.id); }}
                      className="absolute top-2 right-2 p-2 bg-paper/90 backdrop-blur-sm text-red-400 hover:bg-red-500 hover:text-white rounded-full shadow-sm transition-all z-10"
                      aria-label="Remover da wishlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  );
                })}
              </div>

              {/* Share & Gift Section */}
              <div className="pt-10 border-t border-neutral-200">
                <div className="mb-6 p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-700 mb-1">Endereço de entrega obrigatório</p>
                  <p className="text-[10px] text-neutral-400 leading-relaxed">
                    Quem receber o link só poderá enviar itens para o seu endereço cadastrado. Certifique-se de ter um endereço salvo no seu perfil antes de compartilhar.
                  </p>
                </div>
                <div className="mb-6">
                  <h4 className="font-serif text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 mb-6">{t('wishlist.shareTitle')}</h4>
                  <div className="grid grid-cols-4 gap-4">
                    <button 
                      onClick={handleShareLink}
                      disabled={isGeneratingLink || !currentUserId}
                      title="Copiar Link de Presente"
                      className="flex items-center justify-center p-5 bg-paper border border-neutral-200 rounded-2xl hover:border-black transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      {isGeneratingLink ? (
                        <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
                      ) : copiedLink ? (
                        <Link2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <Link2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      )}
                    </button>
                    <button 
                      onClick={() => handleSocialShare('whatsapp')}
                      disabled={isGeneratingLink || !currentUserId}
                      title="Compartilhar no WhatsApp"
                      className="flex items-center justify-center p-5 bg-paper border border-neutral-200 rounded-2xl hover:border-black transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </button>
                    <button 
                      onClick={() => handleSocialShare('facebook')}
                      disabled={isGeneratingLink || !currentUserId}
                      title="Compartilhar no Facebook"
                      className="flex items-center justify-center p-5 bg-paper border border-neutral-200 rounded-2xl hover:border-black transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <Facebook className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </button>
                    <button
                      onClick={() => handleSocialShare('twitter')}
                      disabled={isGeneratingLink || !currentUserId}
                      title="Compartilhar no X"
                      className="flex items-center justify-center p-5 bg-paper border border-neutral-200 rounded-2xl hover:border-black transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <XIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {items.length > 0 && (
          <div className="p-4 md:p-8 border-t border-gray-100 bg-paper shadow-2xl" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
            <button
              onClick={onBuyAll}
              className="w-full bg-black text-white py-5 md:py-6 rounded-2xl flex items-center justify-between px-6 md:px-8 hover:bg-neutral-800 transition-all group shadow-xl active:scale-95"
            >
              <div className="flex items-center gap-4">
                <ShoppingCart className="w-5 h-5" />
                <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] md:tracking-[0.4em]">Adicionar Todos</span>
              </div>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default WishlistDrawer;
