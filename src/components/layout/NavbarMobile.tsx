import React, { useCallback } from 'react';
import { X, Ticket, ArrowLeft, ChevronDown } from 'lucide-react';
import { UserMode, Collection, UserProfile } from '../../types';
import { Gender } from '../../constants/enums';
import { Locale } from '../../i18n';
import { createGetLoc } from '../../utils/localization';
import { NavbarUserMenu } from './NavbarUserMenu';

export interface NavbarMobileProps {
  isOpen: boolean;
  onClose: () => void;
  storeName: string;
  collections: Collection[];
  onSelectCollection: (collection: Collection) => void;
  selectedGender: Gender;
  onGenderChange?: (gender: Gender) => void;
  isLoggedIn: boolean;
  currentUser?: UserProfile | null;
  userMode: UserMode;
  onToggleMode: () => void;
  onNavigate: (view: 'home' | 'product' | 'admin' | 'checkout' | 'about' | 'new-arrivals' | 'gallery' | 'my-orders', target?: string) => void;
  onOpenAuth: () => void;
  onOpenWishlist: () => void;
  onOpenCoupons: () => void;
  onLogout?: () => void;
  t: (key: string) => any;
  currentLocale: Locale;
}

export const NavbarMobile: React.FC<NavbarMobileProps> = ({
  isOpen,
  onClose,
  storeName,
  collections,
  onSelectCollection,
  selectedGender,
  onGenderChange,
  isLoggedIn,
  currentUser,
  userMode,
  onToggleMode,
  onNavigate,
  onOpenAuth,
  onOpenWishlist,
  onOpenCoupons,
  onLogout,
  t,
  currentLocale,
}) => {
  const [isCollectionsOpen, setIsCollectionsOpen] = React.useState(false);
  const getLoc = React.useMemo(() => createGetLoc(currentLocale), [currentLocale]);

  const handleNav = useCallback(
    (view: 'home' | 'product' | 'admin' | 'checkout' | 'about' | 'new-arrivals' | 'gallery' | 'my-orders', target?: string) => {
      onNavigate(view, target);
      onClose();
    },
    [onNavigate, onClose],
  );

  const handleSelectCollection = useCallback(
    (collection: Collection) => {
      onSelectCollection(collection);
      onClose();
      setIsCollectionsOpen(false);
    },
    [onSelectCollection, onClose],
  );

  const handleLogout = useCallback(() => {
    if (onLogout) onLogout();
    onClose();
  }, [onLogout, onClose]);

  const handleMyAccount = useCallback(() => {
    onClose();
    onOpenAuth();
  }, [onClose, onOpenAuth]);

  const handleMyOrders = useCallback(() => {
    onClose();
    onNavigate('my-orders');
  }, [onClose, onNavigate]);

  const handleWishlist = useCallback(() => {
    onClose();
    onOpenWishlist();
  }, [onClose, onOpenWishlist]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-paper z-50 transition-all duration-700"
      style={{
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? 'translateY(0)' : 'translateY(-50px)',
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div className="h-full max-w-[1920px] mx-auto px-6 md:px-12 py-6 flex flex-col">
        {/* Menu Header */}
        <div className="h-20 flex items-center justify-between border-b border-neutral-100">
          <h2 className="text-lg font-light tracking-[0.2em] uppercase">{storeName}</h2>
          <button
            onClick={onClose}
            className="p-4 bg-neutral-50 rounded-full hover:opacity-70 transition-all active:scale-90"
            aria-label="Fechar menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Menu Content */}
        <div className="flex-1 flex flex-col py-6 overflow-hidden">
          {/* Gender Toggle */}
          <div className="mb-5 pb-5 border-b border-neutral-100 flex-shrink-0">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 mb-4">Comprar por</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  onGenderChange?.(Gender.FEMALE);
                  onClose();
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

          {/* Scrollable Navigation */}
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
                href="/galeria"
                onClick={(e) => { e.preventDefault(); handleNav('gallery'); }}
                className="block w-full text-3xl md:text-4xl font-light uppercase tracking-tight hover:opacity-70 transition-all text-left no-underline text-inherit"
              >
                Galeria
              </a>

              <a
                href="/about"
                onClick={(e) => { e.preventDefault(); handleNav('about'); }}
                className="block w-full text-3xl md:text-4xl font-light uppercase tracking-tight hover:opacity-70 transition-all text-left no-underline text-inherit"
              >
                Sobre Nós
              </a>
            </div>

            {/* User Profile Section — inside scroll so it doesn't push footer off screen */}
            {isLoggedIn && currentUser && (
              <NavbarUserMenu
                currentUser={currentUser}
                onMyAccount={handleMyAccount}
                onMyOrders={handleMyOrders}
                onWishlist={handleWishlist}
                onLogout={handleLogout}
                t={t}
              />
            )}
          </div>

          {/* Menu Footer */}
          <div className="pt-4 border-t border-neutral-100 flex-shrink-0">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  onClose();
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
  );
};
