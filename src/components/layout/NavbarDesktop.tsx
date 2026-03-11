import React, { useCallback } from 'react';
import { ShoppingBag, Menu, Heart, ArrowLeft, User, Search } from 'lucide-react';

export interface NavbarDesktopProps {
  storeName: string;
  isSolid: boolean;
  isProductView?: boolean;
  isLoggedIn: boolean;
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenAuth: () => void;
  onOpenMenu: () => void;
  onOpenSearch: () => void;
  onBack?: () => void;
  onNavigate: (view: 'home' | 'product' | 'admin' | 'checkout' | 'about' | 'new-arrivals', target?: string) => void;
  t: (key: string) => string;
}

export const NavbarDesktop: React.FC<NavbarDesktopProps> = ({
  storeName,
  isSolid,
  isProductView,
  isLoggedIn,
  cartCount,
  wishlistCount,
  onOpenCart,
  onOpenWishlist,
  onOpenAuth,
  onOpenMenu,
  onOpenSearch,
  onBack,
  onNavigate,
  t,
}) => {
  const handleNavHome = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onNavigate('home');
    },
    [onNavigate],
  );

  return (
    <div
      className={`hidden md:flex relative w-full h-full max-w-[1920px] mx-auto px-12 items-center justify-between transition-colors duration-500
        ${isSolid ? 'text-black' : 'text-white'}
      `}
    >
      {/* Left Col: Menu/Back */}
      <div className="flex-1 flex items-center justify-start">
        {isProductView ? (
          <button
            onClick={onBack}
            className="group flex items-center gap-3 py-2 -ml-2 hover:opacity-50 transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" strokeWidth={1.5} />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">{t('nav.back')}</span>
          </button>
        ) : (
          <button
            onClick={onOpenMenu}
            className="p-2 -ml-2 hover:opacity-50 transition-all active:scale-90"
            aria-label="Abrir menu"
          >
            <Menu className="w-6 h-6" strokeWidth={1.2} />
          </button>
        )}
      </div>

      {/* Center Col: Brand */}
      <div className="flex-none text-center">
        <a
          href="/"
          onClick={handleNavHome}
          className={`${isSolid ? 'text-xl' : 'text-4xl'} font-serif font-light tracking-[0.5em] uppercase cursor-pointer transition-all duration-700 hover:opacity-60 active:scale-95 py-2 no-underline text-inherit inline-block`}
        >
          {storeName}
        </a>
      </div>

      {/* Right Col: Actions */}
      <div className="flex-1 flex items-center justify-end">
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenSearch}
            className="p-2 -mr-2 hover:opacity-50 transition-all active:scale-90"
            aria-label="Buscar"
          >
            <Search className="w-5 h-5" strokeWidth={1.2} />
          </button>

          <button
            onClick={onOpenAuth}
            className="p-2 hover:opacity-50 transition-all active:scale-90"
            aria-label={isLoggedIn ? 'Minha conta' : 'Entrar'}
          >
            <User
              className={`w-5 h-5 ${isLoggedIn ? 'fill-current' : ''}`}
              strokeWidth={1.2}
            />
          </button>

          <button
            onClick={onOpenWishlist}
            className="p-2 relative hover:opacity-50 transition-all active:scale-90"
            aria-label="Lista de desejos"
          >
            <Heart className="w-5 h-5" strokeWidth={1.2} fill={wishlistCount > 0 ? 'currentColor' : 'none'} />
            {wishlistCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
            )}
          </button>

          <button
            onClick={onOpenCart}
            className="p-2 relative hover:opacity-50 transition-all active:scale-90"
            aria-label="Carrinho"
          >
            <ShoppingBag className="w-5 h-5" strokeWidth={1.2} />
            {cartCount > 0 && (
              <span
                className={`absolute top-2 right-2 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-black flex items-center justify-center
                  ${isSolid ? 'bg-black text-white' : 'bg-paper text-black'}
                `}
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
