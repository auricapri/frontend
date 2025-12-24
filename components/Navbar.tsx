import React from 'react';
import { ShoppingBag, Menu, X, Heart, ArrowLeft, Ticket, User, Globe } from 'lucide-react';
import { UserMode } from '../types';
import { Locale } from '../i18n';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  wishlistCount: number;
  onOpenWishlist: () => void;
  onOpenCoupons: () => void;
  onOpenAuth: () => void;
  userMode: UserMode;
  onToggleMode: () => void;
  onNavigate: (view: 'home' | 'product' | 'admin' | 'checkout', target?: string) => void;
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

  const handleNav = (view: 'home' | 'product' | 'admin' | 'checkout', target?: string) => {
    onNavigate(view, target);
    setIsMenuOpen(false);
  };

  const languages: Locale[] = ['en', 'pt', 'es', 'fr'];

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-700 select-none will-change-transform
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
                      className="p-3 hover:opacity-50 transition-all relative active:scale-90"
                    >
                        <User className={`w-5 h-5 ${isLoggedIn ? 'fill-current' : ''}`} strokeWidth={1.2} />
                    </button>
                    
                    <button 
                      onClick={onOpenWishlist} 
                      className="p-3 relative hover:opacity-50 transition-all active:scale-90"
                    >
                        <Heart className={`w-5 h-5 ${wishlistCount > 0 ? 'fill-current' : ''}`} strokeWidth={1.2} />
                        {wishlistCount > 0 && (
                          <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-red-500 shadow-sm animate-pulse" />
                        )}
                    </button>

                    <button 
                      onClick={onOpenCart} 
                      className="p-3 relative hover:opacity-50 transition-all active:scale-90"
                    >
                        <ShoppingBag className="w-5 h-5" strokeWidth={1.2} />
                        {cartCount > 0 && (
                            <span className={`absolute top-2 right-2 text-[8px] w-4 h-4 flex items-center justify-center rounded-full font-black transition-colors duration-500
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
        <div className="fixed inset-0 z-[100] bg-white text-black flex flex-col animate-in fade-in slide-in-from-top duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]">
          <header className="h-20 px-8 flex justify-between items-center border-b border-neutral-100">
             <div className="text-xl font-light tracking-[0.4em] uppercase">{storeName}</div>
             <button onClick={() => setIsMenuOpen(false)} className="p-4 bg-neutral-50 rounded-full hover:rotate-90 transition-all duration-500">
               <X className="w-6 h-6" />
             </button>
          </header>
          
          <div className="flex-1 p-10 md:p-16 flex flex-col justify-between overflow-y-auto no-scrollbar">
            <div className="space-y-8 md:space-y-12 text-4xl md:text-6xl font-light uppercase tracking-tighter">
                <button 
                  className="block w-full text-left hover:pl-6 transition-all duration-500 ease-out" 
                  onClick={() => handleNav('home', 'hero')}
                >
                  {t('nav.newArrivals')}
                </button>
                <button 
                  className="block w-full text-left hover:pl-6 transition-all duration-500 ease-out" 
                  onClick={() => handleNav('home', 'collection')}
                >
                  {t('nav.collection')}
                </button>
                <button 
                  className="block w-full text-left opacity-20 cursor-not-allowed"
                >
                  {t('nav.editorial')}
                </button>
            </div>
            
            <div className="pt-16 border-t border-neutral-100 flex flex-col gap-8">
                {/* Language Selection Row */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.3em] text-neutral-400 px-4">
                    <Globe className="w-3 h-3" />
                    <span>Language / Idioma</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {languages.map(lang => (
                      <button
                        key={lang}
                        onClick={() => onChangeLocale(lang)}
                        className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border
                          ${currentLocale === lang 
                            ? 'bg-black text-white border-black shadow-lg scale-105' 
                            : 'bg-white text-neutral-400 border-neutral-100 hover:border-black hover:text-black'}
                        `}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Secondary Actions Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                      onClick={() => { setIsMenuOpen(false); onOpenCoupons(); }} 
                      className="flex items-center justify-between p-8 bg-neutral-50 rounded-[2rem] hover:bg-neutral-100 transition-all active:scale-95 group"
                    >
                        <div className="flex items-center gap-4">
                          <Ticket className="w-6 h-6" strokeWidth={1} />
                          <span className="text-[10px] font-black uppercase tracking-[0.3em]">{t('nav.coupons')}</span>
                        </div>
                        <ArrowLeft className="w-4 h-4 rotate-180 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0" />
                    </button>
                    <button 
                      onClick={onToggleMode} 
                      className="flex items-center justify-between p-8 border-2 border-neutral-100 rounded-[2rem] hover:border-black transition-all active:scale-95 group"
                    >
                        <div className="flex flex-col items-start gap-1">
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400">Ambiente</span>
                          <span className="text-xs font-black uppercase tracking-widest">{userMode}</span>
                        </div>
                        <ArrowLeft className="w-4 h-4 rotate-180 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0" />
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;