import { useState, useMemo, useEffect, useRef } from 'react';
import { Product, UserMode, Coupon, SizeGuide } from '../../../../types';
import { Locale } from '../../../../i18n';

export function useProductDetailState(
  product: Product,
  userMode: UserMode,
  coupons: Coupon[],
  sizeGuides: SizeGuide[],
  _locale: Locale
) {
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColorHex, setSelectedColorHex] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [openSection, setOpenSection] = useState<string | null>('desc');
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomImgIndex, setZoomImgIndex] = useState(0);
  const [mobileActiveIdx, setMobileActiveIdx] = useState(0);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const actionsRef = useRef<HTMLDivElement>(null);
  const mobileGalleryRef = useRef<HTMLDivElement>(null);

  const variants = useMemo(() => {
    const allVariants = product.variants || [];
    if (userMode === UserMode.ATACADO) {
      return allVariants.filter(v => v.stock_quantity >= 10);
    }
    return allVariants;
  }, [product.variants, userMode]);

  const colors = useMemo(() => {
    const unique = new Map<string, unknown>();
    variants.forEach(v => {
      if (!unique.has(v.color_hex)) unique.set(v.color_hex, v.color_name);
    });
    return Array.from(unique.entries()).map(([hex, name]) => ({ hex, name }));
  }, [variants]);

  const sizes = useMemo(() => {
    if (!selectedColorHex) {
      return Array.from(new Set(variants.map(v => v.size).filter(Boolean)));
    }
    const variantsForColor = variants.filter(v => v.color_hex === selectedColorHex);
    return Array.from(new Set(variantsForColor.map(v => v.size).filter(Boolean)));
  }, [variants, selectedColorHex]);

  const isSelectedSizeAvailable = useMemo(() => {
    if (!selectedSize || !selectedColorHex) return true;
    return variants.some(v => v.size === selectedSize && v.color_hex === selectedColorHex);
  }, [variants, selectedSize, selectedColorHex]);

  const activeVariant = useMemo(() => {
    const found = variants.find(v => 
      v.size === selectedSize && v.color_hex === selectedColorHex
    );
    return found || variants[0];
  }, [selectedSize, selectedColorHex, variants]);

  const activeSizeGuideImage = useMemo(() => {
    if (activeVariant?.size_guide_id) {
      const guide = sizeGuides.find(g => g.id === activeVariant.size_guide_id);
      return guide ? guide.image_url : null;
    }
    return null;
  }, [activeVariant, sizeGuides]);

  const activeCoupon = useMemo(() => 
    coupons.find(c => c.product_ids?.includes(product.id)), 
    [coupons, product.id]
  );

  useEffect(() => {
    if (colors.length > 0 && !selectedColorHex) {
      setSelectedColorHex(colors[0].hex);
    }
  }, [colors, selectedColorHex]);

  useEffect(() => {
    if (selectedColorHex && sizes.length > 0 && !selectedSize) {
      setSelectedSize(sizes[0]);
    }
  }, [selectedColorHex, sizes, selectedSize]);

  useEffect(() => {
    if (sizes.length > 0) {
      if (!isSelectedSizeAvailable) {
        setSelectedSize(sizes[0] || '');
      } else if (!selectedSize) {
        setSelectedSize(sizes[0] || '');
      }
    }
  }, [sizes, selectedColorHex, isSelectedSizeAvailable, selectedSize]);

  useEffect(() => {
    if (activeVariant && quantity > activeVariant.stock_quantity) {
      setQuantity(Math.max(1, activeVariant.stock_quantity));
    }
  }, [activeVariant, quantity]);

  return {
    selectedSize,
    setSelectedSize,
    selectedColorHex,
    setSelectedColorHex,
    quantity,
    setQuantity,
    openSection,
    setOpenSection,
    isZoomOpen,
    setIsZoomOpen,
    zoomImgIndex,
    setZoomImgIndex,
    mobileActiveIdx,
    setMobileActiveIdx,
    isSizeGuideOpen,
    setIsSizeGuideOpen,
    isShareOpen,
    setIsShareOpen,
    linkCopied,
    setLinkCopied,
    actionsRef,
    mobileGalleryRef,
    variants,
    colors,
    sizes,
    isSelectedSizeAvailable,
    activeVariant,
    activeSizeGuideImage,
    activeCoupon,
  };
}
