import React from 'react';
import { ShoppingBag, Menu, X, Heart, ArrowLeft, Ticket, User, Globe } from 'lucide-react';
import { UserMode } from '../../types';
import { Locale } from '../../i18n';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  wishlistCount: number;
  onOpenWishlist: () => void;
  onOpenCoupons: () => void;
  onOpenAuth: () => void;
  userMode: UserMode;
  onToggleMode: () => void;
  onNavigate: (view: 'home' | 'product' | 'admin' | 'checkout' | 'about', target?: string) => void;
  isScrolled: boolean;
  isProductView?: boolean;
  onBack?: () => void;
  isLoggedIn: boolean;
  t: (key: string) => any;
  currentLocale: Locale;
  onChangeLocale: (locale: Locale) => void;
  storeName: string;
}

const Navbar: React.FC<NavbarProps> = ({ 
  cartCount, 
  onOpenCart, 
  wishlistCount,
  onOpenWishlist,
  onOpenCoupons,
  onOpenAuth,
  userMode, 
  onToggleMode, 
  onNavigate, 
  isScrolled,
  isProductView,
  onBack,
  isLoggedIn,
  t,
  currentLocale,
  onChangeLocale,
  storeName
}) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  // Determine if header should be in "Solid/Scrolled" state
  const isSolid = isScrolled || isProductView;

  // Check if test banner is visible
  const showTestBanner = import.meta.env.VITE_SHOW_TEST_BANNER === 'true';
  const topOffset = showTestBanner ? 'top-12' : 'top-0';

  const handleNav = (view: 'home' | 'product' | 'admin' | 'checkout' | 'about', target?: string) => {
    onNavigate(view, target);
    setIsMenuOpen(false);
  };

  const languages: Locale[] = ['en', 'pt', 'es', 'fr'];

  return (
    <>
      <nav 
        className={`fixed ${topOffset} left-0 w-full z-50 transition-all duration-700 select-none will-change-transform
          ${isSolid ? 'h-16 md:h-20' : 'h-20 md:h-24'}
        `}
        style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* Background Layer - Smooth Opacity Fade */}
        <div 
          className={`absolute inset-0 transition-all duration-700 ease-out border-b
            ${isSolid 
              ? 'bg-white/90 backdrop-blur-xl opacity-100 border-neutral-100' 
              : 'bg-white/0 backdrop-blur-0 opacity-0 border-transparent'}
          `}
          style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
        />

        {/* Content Container */}
        <div className={`relative w-full h-full max-w-[1920px] mx-auto px-6 md:px-12 flex items-center justify-between transition-colors duration-500
          ${isSolid ? 'text-black' : 'text-white'}
        `}>
            
            {/* Left Col: Menu/Back */}
            <div className="flex-1 flex items-center justify-start">
                {isProductView ? (
                    <button 
                      onClick={onBack} 
                      className="group flex items-center gap-3 py-2 -ml-2 hover:opacity-50 transition-all active:scale-95"
                    >
                        <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" strokeWidth={1.5} />
                        <span className="hidden sm:inline text-[9px] font-black uppercase tracking-[0.3em]">{t('nav.back')}</span>
                    </button>
                ) : (
                    <button 
                      onClick={() => setIsMenuOpen(true)} 
                      className="p-2 -ml-2 hover:opacity-50 transition-all active:scale-90"
                    >
                        <Menu className="w-6 h-6" strokeWidth={1.2} />
                    </button>
                )}
            </div>

            {/* Center Col: Brand */}
            <div className="flex-none text-center">
                 <div 
                   onClick={() => handleNav('home')} 
                   className="text-lg md:text-2xl font-light tracking-[0.5em] uppercase cursor-pointer transition-all duration-700 hover:opacity-60 active:scale-95"
                 >
                    {storeName}
                </div>
            </div>

            {/* Right Col: Actions */}
            <div className="flex-1 flex items-center justify-end">
                <div className="flex items-center space-x-1 sm:space-x-4 md:space-x-2">
                    <button 
                      onClick={onOpenAuth} 
                      className="p-2 -mr-2 hover:opacity-50 transition-all active:scale-90"
                      aria-label="Account"
                    >
                        <User className={`w-5 h-5 ${isLoggedIn ? 'fill-current' : ''}`} strokeWidth={1.2} />
                    </button>
                    
                    <button 
                      onClick={onOpenWishlist} 
                      className="p-2 relative hover:opacity-50 transition-all active:scale-90"
                      aria-label="Wishlist"
                    >
                        <Heart className="w-5 h-5" strokeWidth={1.2} fill={wishlistCount > 0 ? "currentColor" : "none"} />
                        {wishlistCount > 0 && (
                            <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                        )}
                    </button>

                    <button 
                      onClick={onOpenCart} 
                      className="p-2 relative hover:opacity-50 transition-all active:scale-90"
                      aria-label="Cart"
                    >
                        <ShoppingBag className="w-5 h-5" strokeWidth={1.2} />
                        {cartCount > 0 && (
                            <span className={`absolute top-2 right-2 min-w-[16px] h-4 px-1 rounded-full text-[8px] font-black flex items-center justify-center
                              ${isSolid ? 'bg-black text-white' : 'bg-white text-black'}
                            `}>
                                {cartCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </div>
      </nav>

      {/* Fullscreen Overlay Menu */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-white z-50 transition-all duration-700"
          style={{ 
            opacity: isMenuOpen ? 1 : 0,
            transform: isMenuOpen ? 'translateY(0)' : 'translateY(-50px)',
            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <div className="h-full max-w-[1920px] mx-auto px-6 md:px-12 py-6 flex flex-col">
            {/* Menu Header */}
            <div className="h-20 flex items-center justify-between border-b border-neutral-100">
              <h2 className="text-lg font-light tracking-[0.2em] uppercase">{storeName}</h2>
              <button 
                onClick={() => setIsMenuOpen(false)} 
                className="p-4 bg-neutral-50 rounded-full hover:opacity-70 transition-all active:scale-90"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Menu Content */}
            <div className="flex-1 flex flex-col justify-between py-12">
              <div className="space-y-8">
                <button
                  onClick={() => handleNav('home', 'hero')}
                  className="block w-full text-4xl font-light uppercase tracking-tight hover:opacity-70 transition-all text-left"
                >
                  {t('nav.newArrivals')}
                </button>
                <button
                  onClick={() => handleNav('home', 'collection')}
                  className="block w-full text-4xl font-light uppercase tracking-tight hover:opacity-70 transition-all text-left"
                >
                  {t('nav.collection')}
                </button>
                <button
                  onClick={() => handleNav('about')}
                  className="block w-full text-4xl font-light uppercase tracking-tight hover:opacity-70 transition-all text-left"
                >
                  Sobre Nós
                </button>
              </div>
              
              {/* Menu Footer */}
              <div className="pt-10 border-t border-neutral-100">
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenCoupons();
                    }}
                    className="flex-1 min-w-[120px] p-5 bg-neutral-50 rounded-3xl flex items-center justify-between hover:opacity-95 transition-all active:scale-95"
                  >
                    <div className="flex items-center gap-4">
                      <Ticket className="w-6 h-6" strokeWidth={1} />
                      <span className="text-[9px] font-black uppercase tracking-[0.3em]">{t('nav.coupons')}</span>
                    </div>
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </button>
                  
                  <button
                    onClick={onToggleMode}
                    className="flex-1 min-w-[120px] p-5 border-2 border-neutral-100 rounded-3xl flex items-center justify-between hover:opacity-95 transition-all active:scale-95"
                  >
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-400">Ambiente</span>
                      <span className="text-xs font-black uppercase tracking-wide">{userMode}</span>
                    </div>
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
