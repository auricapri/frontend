import { useState, useEffect, useRef } from 'react';
import { WishlistApi } from '../api/wishlist.api';

export const useWishlist = (userId?: string) => {
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  // productId → variantId (the variant the owner specifically wants)
  const [wishlistVariantIds, setWishlistVariantIds] = useState<Record<string, string>>({});
  const wishlistApi = useRef(new WishlistApi()).current;

  useEffect(() => {
    if (!userId) {
      setWishlistIds([]);
      setWishlistVariantIds({});
      return;
    }

    const fetchWishlist = async () => {
      try {
        const { productIds, variantIds } = await wishlistApi.getAll();
        setWishlistIds(productIds);
        setWishlistVariantIds(variantIds ?? {});
      } catch (err) {
        console.error('Error fetching wishlist:', err);
      }
    };

    fetchWishlist();
  }, [userId]);

  const toggleWishlist = async (productId: string, variantId?: string | null): Promise<boolean> => {
    if (!userId) return false;

    const isWishlisted = wishlistIds.includes(productId);

    try {
      if (isWishlisted) {
        await wishlistApi.remove(productId);
        setWishlistIds(prev => prev.filter(id => id !== productId));
        setWishlistVariantIds(prev => {
          const next = { ...prev };
          delete next[productId];
          return next;
        });
      } else {
        await wishlistApi.add(productId, variantId);
        setWishlistIds(prev => [...prev, productId]);
        if (variantId) {
          setWishlistVariantIds(prev => ({ ...prev, [productId]: variantId }));
        }
      }
      return true;
    } catch (err) {
      console.error('Error toggling wishlist:', err);
      return false;
    }
  };

  return {
    wishlistIds,
    wishlistVariantIds,
    toggleWishlist,
    isWishlisted: (productId: string) => wishlistIds.includes(productId),
  };
};
