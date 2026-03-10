import React, { useState, useCallback } from 'react';
import { UserMode, Collection, UserProfile, Product, Category } from '../../types';
import { Gender } from '../../constants/enums';
import { Locale } from '../../i18n';
import { NavbarSearch } from './NavbarSearch';
import { NavbarMobile } from './NavbarMobile';
import { NavbarMobileBar } from './NavbarMobileBar';
import { NavbarDesktop } from './NavbarDesktop';

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
  onNavigate: (view: 'home' | 'product' | 'admin' | 'checkout' | 'about' | 'new-arrivals' | 'gallery', target?: string) => void;
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
  categories: _categories = [],
  onSelectProduct,
  wishlistIds: _wishlistIds = [],
  onToggleWishlist: _onToggleWishlist,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isSolid = isScrolled || isProductView;
  const showTestBanner = import.meta.env.VITE_SHOW_TEST_BANNER === 'true';
  const topOffset = showTestBanner ? 'top-20' : 'top-8';

  const handleNav = useCallback(
    (view: 'home' | 'product' | 'admin' | 'checkout' | 'about' | 'new-arrivals' | 'gallery', target?: string) => {
      onNavigate(view, target);
      setIsMenuOpen(false);
    },
    [onNavigate],
  );

  const handleSelectCollection = useCallback(
    (collection: Collection) => {
      if (onSelectCollection) {
        onSelectCollection(collection);
        setIsMenuOpen(false);
      }
    },
    [onSelectCollection],
  );

  const handleOpenMenu = useCallback(() => setIsMenuOpen(true), []);
  const handleCloseMenu = useCallback(() => setIsMenuOpen(false), []);
  const handleOpenSearch = useCallback(() => setIsSearchOpen(true), []);
  const handleCloseSearch = useCallback(() => setIsSearchOpen(false), []);

  return (
    <>
      <header>
        <nav
          className={`fixed ${topOffset} left-0 w-full z-50 transition-all duration-700 select-none will-change-transform
            ${isSolid ? 'h-16 md:h-14' : 'h-32 md:h-24'}
          `}
          style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          {/* Background Layer */}
          <div
            className={`absolute inset-0 pointer-events-none transition-all duration-700 ease-out border-b
              ${isSolid
                ? 'bg-white/90 backdrop-blur-xl opacity-100 border-neutral-100'
                : 'bg-white/0 backdrop-blur-0 opacity-0 border-transparent'}
            `}
            style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
          />

          <NavbarMobileBar
            storeName={storeName}
            isSolid={!!isSolid}
            isProductView={isProductView}
            isLoggedIn={isLoggedIn}
            cartCount={cartCount}
            wishlistCount={wishlistCount}
            onOpenCart={onOpenCart}
            onOpenWishlist={onOpenWishlist}
            onOpenAuth={onOpenAuth}
            onOpenMenu={handleOpenMenu}
            onOpenSearch={handleOpenSearch}
            onBack={onBack}
            onNavigate={onNavigate}
            t={t}
          />

          <NavbarDesktop
            storeName={storeName}
            isSolid={!!isSolid}
            isProductView={isProductView}
            isLoggedIn={isLoggedIn}
            cartCount={cartCount}
            wishlistCount={wishlistCount}
            onOpenCart={onOpenCart}
            onOpenWishlist={onOpenWishlist}
            onOpenAuth={onOpenAuth}
            onOpenMenu={handleOpenMenu}
            onOpenSearch={handleOpenSearch}
            onBack={onBack}
            onNavigate={onNavigate}
            t={t}
          />
        </nav>
      </header>

      <NavbarSearch
        isOpen={isSearchOpen}
        isSolid={!!isSolid}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onClose={handleCloseSearch}
        onNavigate={onNavigate}
        products={products}
        currentLocale={currentLocale}
        onSelectProduct={onSelectProduct}
        showTestBanner={showTestBanner}
      />

      <NavbarMobile
        isOpen={isMenuOpen}
        onClose={handleCloseMenu}
        storeName={storeName}
        collections={collections}
        onSelectCollection={handleSelectCollection}
        selectedGender={selectedGender}
        onGenderChange={onGenderChange}
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        userMode={userMode}
        onToggleMode={onToggleMode}
        onNavigate={handleNav}
        onOpenAuth={onOpenAuth}
        onOpenWishlist={onOpenWishlist}
        onOpenCoupons={onOpenCoupons}
        onLogout={onLogout}
        t={t}
        currentLocale={currentLocale}
      />
    </>
  );
};

export default Navbar;
