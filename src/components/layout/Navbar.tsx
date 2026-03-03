import React, { useState, useMemo } from 'react';
import { ShoppingBag, Menu, X, Heart, ArrowLeft, Ticket, User, ChevronDown, Search } from 'lucide-react';
import { UserMode, Collection, UserProfile, Product, Category } from '../../types';
import { Gender } from '../../constants/enums';
import { Locale } from '../../i18n';
import { createGetLoc } from '../../utils/localization';
import { slugify } from '../../utils/urlUtils';
import { getOptimizedImageUrl } from '../../utils/image';
import { formatCurrency } from '../../utils/currency';

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

  // Search autocomplete
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2 || !products.length) return [];
    const q = searchQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return products
      .filter(p => {
        const name = getLoc(p.name).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return name.includes(q) && p.is_active;
      })
      .slice(0, 5);
  }, [searchQuery, products, getLoc]);

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
  // Benefits bar is always h-8 (32px = top-8), test banner adds h-12 (48px)
  const topOffset = showTestBanner ? 'top-20' : 'top-8';

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
      <header>
      <nav
        className={`fixed ${topOffset} left-0 w-full z-50 transition-all duration-700 select-none will-change-transform
          ${isSolid ? 'h-16 md:h-14' : 'h-32 md:h-24'}
        `}
        style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* Background Layer - Smooth Opacity Fade */}
        <div
          className={`absolute inset-0 pointer-events-none transition-all duration-700 ease-out border-b
            ${isSolid
              ? 'bg-white/90 backdrop-blur-xl opacity-100 border-neutral-100'
              : 'bg-white/0 backdrop-blur-0 opacity-0 border-transparent'}
          `}
          style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
        />

        {/* Mobile Layout: Stacked (Title on top, buttons below) */}
        <div className={`md:hidden relative w-full h-full max-w-[1920px] mx-auto px-6 flex flex-col justify-center transition-colors duration-500
          ${isSolid ? 'text-black' : 'text-white'}
        `}>
          {/* Row 1: Brand Name */}
          <div className="text-center">
            <a
              href="/"
              onClick={(e) => { e.preventDefault(); handleNav('home'); }}
              className={`${isSolid ? 'text-lg' : 'text-2xl'} font-light tracking-[0.3em] uppercase cursor-pointer transition-all duration-700 hover:opacity-60 active:scale-95 no-underline text-inherit`}
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
                  onClick={() => setIsMenuOpen(true)}
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
                onClick={() => setIsSearchOpen(true)}
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
                <Heart className="w-5 h-5" strokeWidth={1.2} fill={wishlistCount > 0 ? "currentColor" : "none"} />
                {wishlistCount > 0 && (
                  <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                )}
              </button>

              <button
                onClick={onOpenCart}
                className="p-1.5 relative hover:opacity-50 transition-all active:scale-90"
                aria-label="Carrinho"
              >
                <ShoppingBag className="w-5 h-5" strokeWidth={1.2} />
                {cartCount > 0 && (
                  <span className={`absolute top-1.5 right-1.5 min-w-[14px] h-3.5 px-0.5 rounded-full text-[10px] font-black flex items-center justify-center
                    ${isSolid ? 'bg-black text-white' : 'bg-white text-black'}
                  `}>
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Layout: 3 Columns */}
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
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">{t('nav.back')}</span>
              </button>
            ) : (
              <button
                onClick={() => setIsMenuOpen(true)}
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
              onClick={(e) => { e.preventDefault(); handleNav('home'); }}
              className={`${isSolid ? 'text-xl' : 'text-4xl'} font-light tracking-[0.5em] uppercase cursor-pointer transition-all duration-700 hover:opacity-60 active:scale-95 py-2 no-underline text-inherit inline-block`}
            >
              {storeName}
            </a>
          </div>

          {/* Right Col: Actions */}
          <div className="flex-1 flex items-center justify-end">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsSearchOpen(true)}
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
                <Heart className="w-5 h-5" strokeWidth={1.2} fill={wishlistCount > 0 ? "currentColor" : "none"} />
                {wishlistCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                )}
              </button>

              <button
                onClick={onOpenCart}
                className="p-2 relative hover:opacity-50 transition-all active:scale-90"
                aria-label="Carrinho"
              >
                <ShoppingBag className="w-5 h-5" strokeWidth={1.2} />
                {cartCount > 0 && (
                  <span className={`absolute top-2 right-2 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-black flex items-center justify-center
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
      </header>

      {/* Search Bar - Slides down from navbar */}
      <div
        className={`fixed left-0 w-full z-[55] transition-all duration-700 ease-out overflow-hidden
          ${isSearchOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}
          ${isSolid ? 'top-16 md:top-14' : 'top-32 md:top-24'}
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
                  aria-label="Fechar busca"
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
                className="px-3 md:px-6 py-3 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm font-medium whitespace-nowrap flex items-center gap-2"
              >
                <Search className="w-4 h-4" strokeWidth={2} />
                <span className="hidden md:inline">Buscar</span>
              </button>
            </div>

            {/* Autocomplete Suggestions */}
            {isSearchOpen && searchSuggestions.length > 0 && (
              <div className="mt-2 bg-white rounded-lg border border-neutral-100 shadow-lg overflow-hidden">
                {searchSuggestions.map((product) => {
                  const img = product.variants?.[0]?.variant_images?.[0] || product.base_images?.[0];
                  const price = product.variants?.[0]?.retail_price || 0;
                  return (
                    <button
                      key={product.id}
                      onClick={() => {
                        onSelectProduct?.(product);
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-50 transition-colors text-left"
                    >
                      {img && (
                        <img
                          src={getOptimizedImageUrl(img, 'thumbnail')}
                          alt={getLoc(product.name)}
                          className="w-10 h-12 object-cover rounded-md flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-800 truncate">{getLoc(product.name)}</p>
                        {price > 0 && <p className="text-xs text-neutral-500">{formatCurrency(price, currentLocale)}</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
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
                aria-label="Fechar menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Menu Content - Scrollable */}
            <div className="flex-1 flex flex-col py-6 overflow-hidden">
              {/* Gender Toggle */}
              <div className="mb-5 pb-5 border-b border-neutral-100 flex-shrink-0">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 mb-4">Comprar por</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      onGenderChange?.(Gender.FEMALE);
                      setIsMenuOpen(false);
                    }}
                    className={`flex-1 py-2.5 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${
                      selectedGender === Gender.FEMALE
                        ? 'bg-black text-white'
                        : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                    }`}
                  >
                    {t('gender.female')}
                  </button>
                  <button
                    disabled
                    className="flex-1 py-2.5 rounded-2xl text-sm font-black uppercase tracking-widest transition-all bg-neutral-100 text-neutral-500 opacity-50 cursor-not-allowed"
                  >
                    {t('gender.male')} (Em breve)
                  </button>
                </div>
              </div>

              {/* Scrollable Navigation Area */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden pr-2 -mr-2">
                <div className="space-y-6">
                  <a
                    href="/novidades"
                    onClick={(e) => { e.preventDefault(); handleNav('new-arrivals'); }}
                    className="block w-full text-3xl md:text-4xl font-light uppercase tracking-tight hover:opacity-70 transition-all text-left no-underline text-inherit"
                  >
                    {t('nav.newArrivals')}
                  </a>

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
                        isCollectionsOpen ? 'max-h-[5000px] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0 pointer-events-none'
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

                  <a
                    href="/about"
                    onClick={(e) => { e.preventDefault(); handleNav('about'); }}
                    className="block w-full text-3xl md:text-4xl font-light uppercase tracking-tight hover:opacity-70 transition-all text-left no-underline text-inherit"
                  >
                    Sobre Nós
                  </a>
                </div>
              </div>

              {/* Profile Section */}
              {isLoggedIn && currentUser && (
                <div className="pt-6 pb-4 border-t border-neutral-100 flex-shrink-0 mt-auto">
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
                          onOpenAuth();
                        }}
                        className="w-full flex items-center gap-3 px-2 py-2.5 text-sm hover:bg-neutral-50 rounded-lg transition-colors"
                      >
                        <User className="w-4 h-4" strokeWidth={1.5} />
                        <span>{t('nav.myAccount')}</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onNavigate('my-orders' as any);
                        }}
                        className="w-full flex items-center gap-3 px-2 py-2.5 text-sm hover:bg-neutral-50 rounded-lg transition-colors"
                      >
                        <ShoppingBag className="w-4 h-4" strokeWidth={1.5} />
                        <span>{t('nav.myOrders')}</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenWishlist();
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
                </div>
              )}

              {/* Menu Footer */}
              <div className="pt-4 border-t border-neutral-100 flex-shrink-0">
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenCoupons();
                    }}
                    className="flex-1 min-w-[120px] p-3 bg-neutral-50 rounded-2xl flex items-center justify-between hover:opacity-95 transition-all active:scale-95"
                  >
                    <div className="flex items-center gap-3">
                      <Ticket className="w-5 h-5" strokeWidth={1} />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em]">{t('nav.coupons')}</span>
                    </div>
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </button>

                  {currentUser?.role === 'admin' && (
                    <button
                      onClick={onToggleMode}
                      className="flex-1 min-w-[120px] p-3 border-2 border-neutral-100 rounded-2xl flex items-center justify-between hover:opacity-95 transition-all active:scale-95"
                    >
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">Ambiente</span>
                        <span className="text-xs font-black uppercase tracking-wide">{userMode}</span>
                      </div>
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                    </button>
                  )}
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
