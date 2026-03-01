import { useMemo } from 'react';
import { Product, ProductVariant } from '../../../../types';

export interface ImageWithVariant {
  url: string;
  variantId: string;
  variantColor: string;
  variantColorName: unknown;
  size: string;
  combinationKey: string;
  isBase: boolean;
  variantIds: string[];
}

export function useProductImages(product: Product, variants: ProductVariant[]) {
  const allImagesWithVariant = useMemo(() => {
    const images: ImageWithVariant[] = [];
    const urlToIndex = new Map<string, number>();
    
    const baseImgs = product.base_images || [];
    baseImgs.forEach(img => {
      if (img && typeof img === 'string' && img.trim() !== '') {
        const trimmedUrl = img.trim();
        if (!urlToIndex.has(trimmedUrl)) {
          const index = images.length;
          images.push({ 
            url: trimmedUrl, 
            variantId: 'base', 
            variantColor: '', 
            variantColorName: null,
            size: '',
            combinationKey: 'base',
            isBase: true,
            variantIds: ['base']
          });
          urlToIndex.set(trimmedUrl, index);
        } else {
          const existingIndex = urlToIndex.get(trimmedUrl)!;
          if (!images[existingIndex].variantIds.includes('base')) {
            images[existingIndex].variantIds.push('base');
          }
        }
      }
    });

    variants.forEach(variant => {
      if (variant.variant_images && Array.isArray(variant.variant_images) && variant.variant_images.length > 0) {
        const size = variant.size || '';
        const colorHex = variant.color_hex || '';
        const combinationKey = `${size}-${colorHex}`;
        
        variant.variant_images.forEach(img => {
          if (img && typeof img === 'string' && img.trim() !== '') {
            const trimmedUrl = img.trim();
            
            if (urlToIndex.has(trimmedUrl)) {
              const existingIndex = urlToIndex.get(trimmedUrl)!;
              if (!images[existingIndex].variantIds.includes(variant.id)) {
                images[existingIndex].variantIds.push(variant.id);
              }
              if (images[existingIndex].variantId === 'base') {
                images[existingIndex].variantId = variant.id;
                images[existingIndex].variantColor = colorHex;
                images[existingIndex].variantColorName = variant.color_name;
                images[existingIndex].size = size;
                images[existingIndex].combinationKey = combinationKey;
                images[existingIndex].isBase = false;
              }
            } else {
              const index = images.length;
              images.push({ 
                url: trimmedUrl, 
                variantId: variant.id, 
                variantColor: colorHex,
                variantColorName: variant.color_name,
                size: size,
                combinationKey: combinationKey,
                isBase: false,
                variantIds: [variant.id]
              });
              urlToIndex.set(trimmedUrl, index);
            }
          }
        });
      }
    });

    images.sort((a, b) => {
      if (a.isBase && !b.isBase) return -1;
      if (!a.isBase && b.isBase) return 1;
      if (a.isBase && b.isBase) return 0;
      if (a.combinationKey !== b.combinationKey) {
        return a.combinationKey.localeCompare(b.combinationKey);
      }
      return 0;
    });

    if (images.length === 0) {
      images.push({ 
        url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='1200' viewBox='0 0 800 1200'%3E%3Crect fill='%23f5f5f5' width='800' height='1200'/%3E%3Cg transform='translate(350,550)'%3E%3Cpath d='M50 0L100 50V80H0V50L25 25L40 40L50 0z' fill='%23d4d4d4'/%3E%3Crect y='80' width='100' height='5' fill='%23d4d4d4'/%3E%3C/g%3E%3C/svg%3E",
        variantId: 'base', 
        variantColor: '', 
        variantColorName: null,
        size: '',
        combinationKey: 'base',
        isBase: true,
        variantIds: ['base']
      });
    }

    return images;
  }, [variants, product.base_images]);

  const variantToImageIndex = useMemo(() => {
    const map = new Map<string, number>();
    allImagesWithVariant.forEach((img, index) => {
      img.variantIds.forEach(variantId => {
        if (!map.has(variantId)) {
          map.set(variantId, index);
        }
      });
    });
    return map;
  }, [allImagesWithVariant]);

  const displayImages = useMemo(() => 
    allImagesWithVariant.map(img => img.url), 
    [allImagesWithVariant]
  );

  return {
    allImagesWithVariant,
    variantToImageIndex,
    displayImages,
  };
}
