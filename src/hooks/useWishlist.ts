import { useState, useEffect } from 'react';
import { WishlistApi } from '../api/wishlist.api';

export const useWishlist = (userId?: string) => {
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const wishlistApi = new WishlistApi();

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

  const toggleWishlist = async (productId: string) => {
    if (!userId) return;

    const isWishlisted = wishlistIds.includes(productId);

    try {
      if (isWishlisted) {
        await wishlistApi.remove(productId);
        setWishlistIds(prev => prev.filter(id => id !== productId));
      } else {
        await wishlistApi.add(productId);
        setWishlistIds(prev => [...prev, productId]);
      }
    } catch (err) {
      console.error('Error toggling wishlist:', err);
    }
  };

  return {
    wishlistIds,
    toggleWishlist,
    isWishlisted: (productId: string) => wishlistIds.includes(productId)
  };
};

