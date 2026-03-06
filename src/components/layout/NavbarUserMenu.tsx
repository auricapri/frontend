import React, { useCallback } from 'react';
import { User, ShoppingBag, Heart, ArrowLeft } from 'lucide-react';
import { UserProfile } from '../../types';

export interface NavbarUserMenuProps {
  currentUser: UserProfile;
  onMyAccount: () => void;
  onMyOrders: () => void;
  onWishlist: () => void;
  onLogout: () => void;
  t: (key: string) => string;
}

export const NavbarUserMenu: React.FC<NavbarUserMenuProps> = ({
  currentUser,
  onMyAccount,
  onMyOrders,
  onWishlist,
  onLogout,
  t,
}) => {
  const handleMyAccount = useCallback(() => {
    onMyAccount();
  }, [onMyAccount]);

  const handleMyOrders = useCallback(() => {
    onMyOrders();
  }, [onMyOrders]);

  const handleWishlist = useCallback(() => {
    onWishlist();
  }, [onWishlist]);

  const handleLogout = useCallback(() => {
    onLogout();
  }, [onLogout]);

  return (
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
            onClick={handleMyAccount}
            className="w-full flex items-center gap-3 px-2 py-2.5 text-sm hover:bg-neutral-50 rounded-lg transition-colors"
          >
            <User className="w-4 h-4" strokeWidth={1.5} />
            <span>{t('nav.myAccount')}</span>
          </button>

          <button
            onClick={handleMyOrders}
            className="w-full flex items-center gap-3 px-2 py-2.5 text-sm hover:bg-neutral-50 rounded-lg transition-colors"
          >
            <ShoppingBag className="w-4 h-4" strokeWidth={1.5} />
            <span>{t('nav.myOrders')}</span>
          </button>

          <button
            onClick={handleWishlist}
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
  );
};
