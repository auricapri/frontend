import React, { useCallback } from 'react';
import { ShoppingBag, Menu, Heart, ArrowLeft, User, Search } from 'lucide-react';

export interface NavbarMobileBarProps {
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

export const NavbarMobileBar: React.FC<NavbarMobileBarProps> = ({
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
      className={`md:hidden relative w-full h-full max-w-[1920px] mx-auto px-6 flex flex-col justify-center transition-colors duration-500
        ${isSolid ? 'text-black' : 'text-white'}
      `}
    >
      {/* Row 1: Brand Name */}
      <div className="text-center">
        <a
          href="/"
          onClick={handleNavHome}
          className={`${isSolid ? 'text-lg' : 'text-2xl'} font-serif font-light tracking-[0.3em] uppercase cursor-pointer transition-all duration-700 hover:opacity-60 active:scale-95 no-underline text-inherit`}
        >
          {storeName}
        </a>
      </div>

      {/* Row 2: Menu + Actions */}
      <div className="flex items-center justify-between mt-2">
        {/* Left: Menu/Back */}
        <div className="flex items-center">
          {isProductView ? (
            <button
              onClick={onBack}
              className="group flex items-center gap-2 py-1 -ml-2 hover:opacity-50 transition-all active:scale-95"
            >
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" strokeWidth={1.5} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('nav.back')}</span>
            </button>
          ) : (
            <button
              onClick={onOpenMenu}
              className="p-1 -ml-1 hover:opacity-50 transition-all active:scale-90"
              aria-label="Abrir menu"
            >
              <Menu className="w-5 h-5" strokeWidth={1.2} />
            </button>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-1">
          <button
            onClick={onOpenSearch}
            className="p-1.5 hover:opacity-50 transition-all active:scale-90"
            aria-label="Buscar"
          >
            <Search className="w-5 h-5" strokeWidth={1.2} />
          </button>

          <button
            onClick={onOpenAuth}
            className="p-1.5 hover:opacity-50 transition-all active:scale-90"
            aria-label={isLoggedIn ? 'Minha conta' : 'Entrar'}
          >
            <User
              className={`w-5 h-5 ${isLoggedIn ? 'fill-current' : ''}`}
              strokeWidth={1.2}
            />
          </button>

          <button
            onClick={onOpenWishlist}
            className="p-1.5 relative hover:opacity-50 transition-all active:scale-90"
            aria-label="Lista de desejos"
          >
            <Heart className="w-5 h-5" strokeWidth={1.2} fill={wishlistCount > 0 ? 'currentColor' : 'none'} />
            {wishlistCount > 0 && (
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full" />
            )}
          </button>

          <button
            onClick={onOpenCart}
            className="p-1.5 relative hover:opacity-50 transition-all active:scale-90"
            aria-label="Carrinho"
          >
            <ShoppingBag className="w-5 h-5" strokeWidth={1.2} />
            {cartCount > 0 && (
              <span
                className={`absolute top-1.5 right-1.5 min-w-[14px] h-3.5 px-0.5 rounded-full text-[10px] font-black flex items-center justify-center
                  ${isSolid ? 'bg-black text-white' : 'bg-white text-black'}
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
