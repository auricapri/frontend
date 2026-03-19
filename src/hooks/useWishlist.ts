import { useState, useEffect, useRef } from 'react';
import { WishlistApi } from '../api/wishlist.api';

export const useWishlist = (userId?: string) => {
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const wishlistApi = useRef(new WishlistApi()).current;

  useEffect(() => {
    if (!userId) {
      setWishlistIds([]);
      return;
    }

    const fetchWishlist = async () => {
      try {
        const productIds = await wishlistApi.getAll();
        setWishlistIds(productIds);
      } catch (err) {
        console.error('Error fetching wishlist:', err);
      }
    };

    fetchWishlist();
  }, [userId]);

  const toggleWishlist = async (productId: string): Promise<boolean> => {
    if (!userId) return false;

    const isWishlisted = wishlistIds.includes(productId);

    try {
      if (isWishlisted) {
        await wishlistApi.remove(productId);
        setWishlistIds(prev => prev.filter(id => id !== productId));
      } else {
        await wishlistApi.add(productId);
        setWishlistIds(prev => [...prev, productId]);
      }
      return true;
    } catch (err) {
      console.error('Error toggling wishlist:', err);
      return false;
    }
  };

  return {
    wishlistIds,
    toggleWishlist,
    isWishlisted: (productId: string) => wishlistIds.includes(productId)
  };
};

