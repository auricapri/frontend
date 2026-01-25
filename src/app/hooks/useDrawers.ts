import { useCallback, useState } from 'react';

export interface DrawersState {
  isCartOpen: boolean;
  isWishlistOpen: boolean;
  isCouponsOpen: boolean;
  isAuthOpen: boolean;
}

export function useDrawers() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCouponsOpen, setIsCouponsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const closeAllDrawers = useCallback(() => {
    setIsCartOpen(false);
    setIsWishlistOpen(false);
    setIsCouponsOpen(false);
    setIsAuthOpen(false);
  }, []);

  const openCart = useCallback(() => {
    closeAllDrawers();
    setIsCartOpen(true);
  }, [closeAllDrawers]);

  const openWishlist = useCallback(() => {
    closeAllDrawers();
    setIsWishlistOpen(true);
  }, [closeAllDrawers]);

  const openCoupons = useCallback(() => {
    closeAllDrawers();
    setIsCouponsOpen(true);
  }, [closeAllDrawers]);

  const openAuth = useCallback(() => {
    closeAllDrawers();
    setIsAuthOpen(true);
  }, [closeAllDrawers]);

  return {
    isCartOpen,
    setIsCartOpen,
    isWishlistOpen,
    setIsWishlistOpen,
    isCouponsOpen,
    setIsCouponsOpen,
    isAuthOpen,
    setIsAuthOpen,
    closeAllDrawers,
    openCart,
    openWishlist,
    openCoupons,
    openAuth,
  };
}
