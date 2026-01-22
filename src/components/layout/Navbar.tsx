import React, { useState } from 'react';
import { ShoppingBag, Menu, X, Heart, ArrowLeft, Ticket, User, ChevronDown, Search } from 'lucide-react';
import { UserMode, Collection, UserProfile, Product, Category } from '../../types';
import { Gender } from '../../constants/enums';
import { Locale } from '../../i18n';
import { createGetLoc } from '../../utils/localization';
import { slugify } from '../../utils/urlUtils';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  wishlistCount: number;
  onOpenWishlist: () => void;
  onOpenCoupons: () => void;
  onOpenAuth: () => void;
  onLogout?: () => void;
  userMode: UserMode;
  onToggleMode: () => void;
  onNavigate: (view: 'home' | 'product' | 'admin' | 'checkout' | 'about' | 'new-arrivals', target?: string) => void;
  isScrolled: boolean;
  isProductView?: boolean;
  onBack?: () => void;
  isLoggedIn: boolean;
  currentUser?: UserProfile | null;
  t: (key: string) => any;
  currentLocale: Locale;
  onChangeLocale: (locale: Locale) => void;
  storeName: string;
  collections?: Collection[];
  onSelectCollection?: (collection: Collection) => void;
  selectedGender?: Gender;
  onGenderChange?: (gender: Gender) => void;
  products?: Product[];
  categories?: Category[];
  onSelectProduct?: (product: Product) => void;
  wishlistIds?: string[];
  onToggleWishlist?: (productId: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onOpenCart,
  wishlistCount,
  onOpenWishlist,
  onOpenCoupons,
  onOpenAuth,
  onLogout,
  userMode,
  onToggleMode,
  onNavigate,
  isScrolled,
  isProductView,
  onBack,
  isLoggedIn,
  currentUser,
  t,
  currentLocale,
  onChangeLocale: _onChangeLocale,
  storeName,
  collections = [],
  onSelectCollection,
  selectedGender = Gender.FEMALE,
  onGenderChange,
  products = [],
  categories = [],
  onSelectProduct,
  wishlistIds = [],
  onToggleWishlist
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const getLoc = React.useMemo(() => createGetLoc(currentLocale), [currentLocale]);

  const handleSelectCollection = (collection: Collection) => {
    if (onSelectCollection) {
      onSelectCollection(collection);
      setIsMenuOpen(false);
      setIsCollectionsOpen(false);
    }
  };

  // Determine if header should be in "Solid/Scrolled" state
  const isSolid = isScrolled || isProductView;

  // Check if test banner is visible
  const showTestBanner = import.meta.env.VITE_SHOW_TEST_BANNER === 'true';
  const topOffset = showTestBanner ? 'top-12' : 'top-0';

  const handleNav = (view: 'home' | 'product' | 'admin' | 'checkout' | 'about' | 'new-arrivals', target?: string) => {
    onNavigate(view, target);
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    setIsMenuOpen(false);
  };

  return (
    <>
      <nav
        className={`fixed ${topOffset} left-0 w-full z-50 transition-all duration-700 select-none will-change-transform
          ${isSolid ? 'h-24 md:h-20' : 'h-28 md:h-24'}
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

        {/* Mobile Layout: 2 Linhas */}
        <div className={`md:hidden relative w-full h-full flex flex-col transition-colors duration-500
          ${isSolid ? 'text-black' : 'text-white'}
        `}>
          {/* Linha 1: Título */}
          <div className="flex-none flex items-center justify-center">
            <div
              onClick={() => handleNav('home')}
              className="text-2xl font-light tracking-[0.5em] uppercase cursor-pointer transition-all duration-700 hover:opacity-60 active:scale-95 py-2"
            >
              {storeName}
            </div>
          </div>

          {/* Linha 2: Ícones */}
          <div className="flex-1 w-full px-6 flex items-center justify-between">
            {/* Left: Menu/Back */}
            <div className="flex items-center">
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

            {/* Right: Actions */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 -mr-2 hover:opacity-50 transition-all active:scale-90"
                aria-label="Search"
              >
                <Search className="w-5 h-5" strokeWidth={1.2} />
              </button>

              <button
                onClick={onOpenAuth}
                className="p-2 hover:opacity-50 transition-all active:scale-90"
                aria-label={isLoggedIn ? 'Account' : 'Login'}
              >
                <User
                  className={`w-5 h-5 ${isLoggedIn ? 'fill-current' : ''}`}
                  strokeWidth={1.2}
                />
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

        {/* Desktop Layout: 3 Colunas (Atual) */}
        <div className={`hidden md:flex relative w-full h-full max-w-[1920px] mx-auto px-12 items-center justify-between transition-colors duration-500
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
              className="text-4xl font-light tracking-[0.5em] uppercase cursor-pointer transition-all duration-700 hover:opacity-60 active:scale-95 py-2"
            >
              {storeName}
            </div>
          </div>

          {/* Right Col: Actions */}
          <div className="flex-1 flex items-center justify-end">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 -mr-2 hover:opacity-50 transition-all active:scale-90"
                aria-label="Search"
              >
                <Search className="w-5 h-5" strokeWidth={1.2} />
              </button>

              <button
                onClick={onOpenAuth}
                className="p-2 hover:opacity-50 transition-all active:scale-90"
                aria-label={isLoggedIn ? 'Account' : 'Login'}
              >
                <User
                  className={`w-5 h-5 ${isLoggedIn ? 'fill-current' : ''}`}
                  strokeWidth={1.2}
                />
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

      {/* Search Bar - Slides down from navbar */}
      <div
        className={`fixed left-0 w-full z-40 transition-all duration-700 ease-out overflow-hidden
          ${isSearchOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
          ${isSolid ? 'top-24 md:top-20' : 'top-28 md:top-24'}
        `}
        style={{ marginTop: showTestBanner ? '48px' : '0' }}
      >
        <div className={`border-b shadow-lg transition-all duration-700 ease-out
          ${isSolid
            ? 'bg-white/90 backdrop-blur-xl border-neutral-100'
            : 'bg-white/0 backdrop-blur-0 border-transparent'
          }`}
        >
          <div className="max-w-[1920px] mx-auto px-6 md:px-12 py-4">
            {/* Search Input Container */}
            <div className="flex items-center gap-2">
              {/* Input with icons */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" strokeWidth={1.5} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      const slug = slugify(searchQuery);
                      onNavigate('search-results' as any, slug);
                      setIsSearchOpen(false);
                    }
                  }}
                  placeholder="Digite para buscar produtos..."
                  className="w-full pl-10 pr-10 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400 transition-colors text-sm"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:opacity-50 transition-opacity"
                >
                  <X className="w-4 h-4 text-neutral-400" />
                </button>
              </div>

              {/* Search Button */}
              <button
                onClick={() => {
                  if (searchQuery.trim()) {
                    const slug = slugify(searchQuery);
                    onNavigate('search-results' as any, slug);
                    setIsSearchOpen(false);
                  }
                }}
                disabled={!searchQuery.trim()}
                className="px-6 py-3 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm font-medium whitespace-nowrap flex items-center gap-2"
              >
                <Search className="w-4 h-4" strokeWidth={2} />
                Buscar
              </button>
            </div>
          </div>
        </div>
      </div>

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
            
            {/* Menu Content - Scrollable */}
            <div className="flex-1 flex flex-col py-12 overflow-hidden">
              {/* Gender Toggle */}
              <div className="mb-10 pb-8 border-b border-neutral-100 flex-shrink-0">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-400 mb-4">Comprar por</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      onGenderChange?.(Gender.FEMALE);
                      setIsMenuOpen(false);
                    }}
                    className={`flex-1 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${
                      selectedGender === Gender.FEMALE
                        ? 'bg-black text-white'
                        : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                    }`}
                  >
                    {t('gender.female')}
                  </button>
                  <button
                    onClick={() => {
                      onGenderChange?.(Gender.MALE);
                      setIsMenuOpen(false);
                    }}
                    className={`flex-1 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${
                      selectedGender === Gender.MALE
                        ? 'bg-black text-white'
                        : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                    }`}
                  >
                    {t('gender.male')}
                  </button>
                </div>
              </div>

              {/* Scrollable Navigation Area */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden pr-2 -mr-2">
                <div className="space-y-6">
                  <button
                    onClick={() => handleNav('new-arrivals')}
                    className="block w-full text-3xl md:text-4xl font-light uppercase tracking-tight hover:opacity-70 transition-all text-left"
                  >
                    {t('nav.newArrivals')}
                  </button>

                  {/* Collections Collapse */}
                  <div>
                    <button
                      onClick={() => setIsCollectionsOpen(!isCollectionsOpen)}
                      className="w-full flex items-center justify-between text-3xl md:text-4xl font-light uppercase tracking-tight hover:opacity-70 transition-all text-left"
                    >
                      <span>{t('nav.collection')}</span>
                      <ChevronDown
                        className={`w-6 h-6 transition-transform duration-500 ease-out ${
                          isCollectionsOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {/* Collections List - Smooth height animation */}
                    <div
                      className={`overflow-hidden transition-all duration-500 ease-out ${
                        isCollectionsOpen ? 'max-h-[60vh] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'
                      }`}
                    >
                      <div className="pl-4 space-y-2 border-l-2 border-neutral-200">
                        {collections.map((col) => (
                          <button
                            key={col.id}
                            onClick={() => handleSelectCollection(col)}
                            className="w-full flex items-center gap-4 py-2.5 hover:opacity-70 transition-all text-left group"
                          >
                            {col.image_url && (
                              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-100">
                                <img
                                  src={col.image_url}
                                  alt={getLoc(col.name)}
                                  loading="lazy"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              </div>
                            )}
                            <span className="text-base font-medium text-neutral-700 group-hover:text-neutral-900">
                              {getLoc(col.name)}
                            </span>
                          </button>
                        ))}
                        {collections.length === 0 && (
                          <p className="text-sm text-neutral-400 py-2">Nenhuma coleção disponível</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleNav('about')}
                    className="block w-full text-3xl md:text-4xl font-light uppercase tracking-tight hover:opacity-70 transition-all text-left"
                  >
                    Sobre Nós
                  </button>
                </div>
              </div>

              {/* Profile Section */}
              <div className="pt-6 pb-4 border-t border-neutral-100 flex-shrink-0 mt-auto">
                {isLoggedIn && currentUser ? (
                  <div className="space-y-4">
                    {/* User Info */}
                    <div className="flex items-center gap-3 px-2">
                      <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-bold text-lg">
                        {currentUser.full_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{currentUser.full_name || 'Usuário'}</div>
                        <div className="text-xs text-neutral-500 truncate">{currentUser.email}</div>
                      </div>
                    </div>

                    {/* Profile Actions */}
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          // Navigate to account page
                        }}
                        className="w-full flex items-center gap-3 px-2 py-2.5 text-sm hover:bg-neutral-50 rounded-lg transition-colors"
                      >
                        <User className="w-4 h-4" strokeWidth={1.5} />
                        <span>{t('nav.myAccount')}</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          // Navigate to orders
                        }}
                        className="w-full flex items-center gap-3 px-2 py-2.5 text-sm hover:bg-neutral-50 rounded-lg transition-colors"
                      >
                        <ShoppingBag className="w-4 h-4" strokeWidth={1.5} />
                        <span>{t('nav.myOrders')}</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          // Navigate to wishlist
                        }}
                        className="w-full flex items-center gap-3 px-2 py-2.5 text-sm hover:bg-neutral-50 rounded-lg transition-colors"
                      >
                        <Heart className="w-4 h-4" strokeWidth={1.5} />
                        <span>{t('nav.wishlist')}</span>
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-2 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                        <span>{t('nav.logout')}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenAuth();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-xl hover:bg-neutral-800 transition-all active:scale-95"
                  >
                    <User className="w-5 h-5" strokeWidth={1.5} />
                    <span className="font-medium">{t('nav.loginRegister')}</span>
                  </button>
                )}
              </div>

              {/* Menu Footer */}
              <div className="pt-10 border-t border-neutral-100 flex-shrink-0">
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
