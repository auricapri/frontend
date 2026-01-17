
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Product, UserMode, CartItem, UserProfile, Coupon, SizeGuide, Category, ProductReview } from '../../types';
import {
  Plus,
  Minus,
  Heart,
  Maximize2,
  X,
  ChevronRight,
  ChevronLeft,
  Star,
  Tag,
  Ruler,
  Share2,
  Copy,
  Check,
  Facebook,
  Twitter,
  MessageCircle,
  ShieldCheck,
  Truck,
  RefreshCw,
  Camera,
  Shirt
} from 'lucide-react';
import { Locale } from '../../i18n';
import ProductReviews from './ProductReviews';
import { FaceSwapModal } from './FaceSwapModal';
import { formatCurrency } from '../../utils/currency';
import { calculatePrice, filterProductsForMode } from '../../utils/product';
import { OptimizedImage } from '../ui';
import { productReviewsApi } from '../../api/instances';

// Cache de reviews por produto (TTL 5 min)
const reviewsCache = new Map<string, { reviews: ProductReview[]; timestamp: number }>();
const REVIEWS_CACHE_TTL = 5 * 60 * 1000;

interface ProductDetailProps {
  product: Product;
  coupons?: Coupon[];
  userMode: UserMode;
  onAddToCart: (item: CartItem) => void;
  onBack: () => void;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
  t: (key: string) => any;
  locale: Locale;
  currentUser: UserProfile | null;
  userOrders?: any[]; // Order[]
  onShowToast?: (message: string, type?: 'info' | 'error') => void;
  sizeGuides?: SizeGuide[];
  products?: Product[];
  categories?: Category[];
  onSelectProduct?: (product: Product) => void;
  wishlistIds?: string[];
  onToggleWishlistProduct?: (productId: string) => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ 
  product, 
  coupons = [],
  userMode, 
  onAddToCart, 
  isWishlisted, 
  onToggleWishlist, 
  t, 
  locale,
  currentUser,
  userOrders = [],
  onShowToast,
  sizeGuides = [],
  products = [],
  categories: _categories = [],
  onSelectProduct,
  wishlistIds = [],
  onToggleWishlistProduct
}) => {
  const getLoc = (obj: any): string => {
    if (obj === null || obj === undefined) return "";
    if (typeof obj === 'string') {
      if (obj.trim().startsWith('{')) {
        try { return getLoc(JSON.parse(obj)); } catch { return obj; }
      }
      return obj;
    }
    if (typeof obj === 'object') {
      const val = obj[locale] || obj['pt'] || obj['en'] || obj['es'] || obj['fr'];
      if (typeof val === 'string') return val;
      const first = Object.values(obj).find(v => typeof v === 'string');
      return (first as string) || "";
    }
    return String(obj);
  };

  // Filter variants for atacado mode (stock >= 10)
  const variants = useMemo(() => {
    const allVariants = product.variants || [];
    if (userMode === UserMode.ATACADO) {
      return allVariants.filter(v => v.stock_quantity >= 10);
    }
    return allVariants;
  }, [product.variants, userMode]);
  
  // Colors: all unique colors from all variants
  const colors = useMemo(() => {
    const unique = new Map();
    variants.forEach(v => {
      if (!unique.has(v.color_hex)) unique.set(v.color_hex, v.color_name);
    });
    return Array.from(unique.entries()).map(([hex, name]) => ({ hex, name }));
  }, [variants]);

  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColorHex, setSelectedColorHex] = useState<string>('');

  // Sizes: filtered dynamically based on selected color
  const sizes = useMemo(() => {
    if (!selectedColorHex) {
      // If no color selected, show all sizes
      return Array.from(new Set(variants.map(v => v.size).filter(Boolean)));
    }
    // Filter variants by selected color and get unique sizes
    const variantsForColor = variants.filter(v => v.color_hex === selectedColorHex);
    return Array.from(new Set(variantsForColor.map(v => v.size).filter(Boolean)));
  }, [variants, selectedColorHex]);

  // Check if selected size is available for selected color
  const isSelectedSizeAvailable = useMemo(() => {
    if (!selectedSize || !selectedColorHex) return true;
    return variants.some(v => v.size === selectedSize && v.color_hex === selectedColorHex);
  }, [variants, selectedSize, selectedColorHex]);

  // Initialize selected size and color when variants are loaded
  useEffect(() => {
    if (colors.length > 0 && !selectedColorHex) {
      setSelectedColorHex(colors[0].hex);
    }
  }, [colors, selectedColorHex]);

  // Initialize selected size when color is selected
  useEffect(() => {
    if (selectedColorHex && sizes.length > 0 && !selectedSize) {
      setSelectedSize(sizes[0]);
    }
  }, [selectedColorHex, sizes, selectedSize]);

  // Update selected size when color changes or sizes list changes
  useEffect(() => {
    if (sizes.length > 0) {
      // If current selected size is not available for new color, reset to first available
      if (!isSelectedSizeAvailable) {
        setSelectedSize(sizes[0] || '');
      } else if (!selectedSize) {
        // If no size selected, select first available
        setSelectedSize(sizes[0] || '');
      }
    }
  }, [sizes, selectedColorHex, isSelectedSizeAvailable]);
  const [quantity, setQuantity] = useState(1);
  const [openSection, setOpenSection] = useState<string | null>('desc');
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomImgIndex, setZoomImgIndex] = useState(0);
  const [mobileActiveIdx, setMobileActiveIdx] = useState(0);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  
  // Share State
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Face Swap State
  const [showFaceSwap, setShowFaceSwap] = useState(false);

  const actionsRef = useRef<HTMLDivElement>(null);
  const mobileGalleryRef = useRef<HTMLDivElement>(null);

  const activeVariant = useMemo(() => {
    const found = variants.find(v => 
      v.size === selectedSize && v.color_hex === selectedColorHex
    );
    return found || variants[0];
  }, [selectedSize, selectedColorHex, variants]);

  // Resolve active size guide image
  const activeSizeGuideImage = useMemo(() => {
      if (activeVariant?.size_guide_id) {
          const guide = sizeGuides.find(g => g.id === activeVariant.size_guide_id);
          return guide ? guide.image_url : null;
      }
      return null;
  }, [activeVariant, sizeGuides]);

  // Ensure quantity doesn't exceed stock when switching variants
  useEffect(() => {
    if (activeVariant && quantity > activeVariant.stock_quantity) {
      setQuantity(Math.max(1, activeVariant.stock_quantity));
    }
  }, [activeVariant, quantity]);

  // IMAGES: Build gallery without duplicates by URL
  // Variant images are part of the master gallery, same image can be used by multiple variants
  const allImagesWithVariant = useMemo(() => {
    const images: Array<{ 
      url: string; 
      variantId: string; 
      variantColor: string; 
      variantColorName: any;
      size: string;
      combinationKey: string;
      isBase: boolean;
      variantIds: string[]; // Track all variants that use this image
    }> = [];
    const urlToIndex = new Map<string, number>(); // Map URL to index in images array
    
    // First, add base images if they exist (no duplicates)
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
          // Image already exists, add 'base' to variantIds
          const existingIndex = urlToIndex.get(trimmedUrl)!;
          if (!images[existingIndex].variantIds.includes('base')) {
            images[existingIndex].variantIds.push('base');
          }
        }
      }
    });

    // Then, process variant images - add only if URL doesn't exist, but track variantId
    variants.forEach(variant => {
      if (variant.variant_images && Array.isArray(variant.variant_images) && variant.variant_images.length > 0) {
        const size = variant.size || '';
        const colorHex = variant.color_hex || '';
        const combinationKey = `${size}-${colorHex}`;
        
        variant.variant_images.forEach(img => {
          if (img && typeof img === 'string' && img.trim() !== '') {
            const trimmedUrl = img.trim();
            
            if (urlToIndex.has(trimmedUrl)) {
              // Image already exists in gallery, just track this variant
              const existingIndex = urlToIndex.get(trimmedUrl)!;
              if (!images[existingIndex].variantIds.includes(variant.id)) {
                images[existingIndex].variantIds.push(variant.id);
              }
              // Update variantId to first variant that uses this image (for backwards compatibility)
              if (images[existingIndex].variantId === 'base') {
                images[existingIndex].variantId = variant.id;
                images[existingIndex].variantColor = colorHex;
                images[existingIndex].variantColorName = variant.color_name;
                images[existingIndex].size = size;
                images[existingIndex].combinationKey = combinationKey;
                images[existingIndex].isBase = false;
              }
            } else {
              // New image, add to gallery
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

    // Sort: base images first, then by combination
    images.sort((a, b) => {
      if (a.isBase && !b.isBase) return -1;
      if (!a.isBase && b.isBase) return 1;
      if (a.isBase && b.isBase) return 0;
      // Group by combinationKey
      if (a.combinationKey !== b.combinationKey) {
        return a.combinationKey.localeCompare(b.combinationKey);
      }
      return 0;
    });

    // If no images found, add placeholder
    if (images.length === 0) {
      images.push({ 
        url: 'https://via.placeholder.com/1200x1600?text=No+Image', 
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

  // Map variantId to first image index in gallery
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

  // Extract just URLs for display (backward compatibility)
  const displayImages = useMemo(() => allImagesWithVariant.map(img => img.url), [allImagesWithVariant]);

  // Scroll to active variant images when variant changes
  useEffect(() => {
    if (!activeVariant) return;
    
    // Find the index using the variantToImageIndex map
    const targetImageIndex = variantToImageIndex.get(activeVariant.id);
    const finalIndex = targetImageIndex !== undefined && targetImageIndex >= 0 ? targetImageIndex : 0;
    
    // Wait a bit for DOM to be ready, then scroll
    const scrollTimeout = setTimeout(() => {
      // Desktop: scroll vertical using scrollIntoView (more reliable)
      const desktopGallery = document.getElementById('desktop-gallery');
      
      if (desktopGallery && finalIndex >= 0 && finalIndex < desktopGallery.children.length) {
        const targetCard = desktopGallery.children[finalIndex] as HTMLElement;
        if (targetCard) {
          // Use scrollIntoView for reliable smooth scrolling
          targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }

      // Mobile: scroll horizontal by index with retry if gallery not ready
      const attemptMobileScroll = () => {
        if (mobileGalleryRef.current && finalIndex >= 0 && finalIndex < allImagesWithVariant.length) {
          const galleryWidth = mobileGalleryRef.current.offsetWidth;
          
          if (galleryWidth > 0) {
            const scrollPosition = finalIndex * galleryWidth;
            mobileGalleryRef.current.scrollTo({ left: scrollPosition, behavior: 'smooth' });
            setMobileActiveIdx(finalIndex);
            return true;
          }
          return false;
        }
        return false;
      };
      
      // Try immediately, retry if needed
      if (!attemptMobileScroll()) {
        // Retry after a short delay if gallery not ready
        setTimeout(() => {
          attemptMobileScroll();
        }, 200);
      }

      // Update zoom index to first image of active variant
      setZoomImgIndex(finalIndex);
    }, 150);
    
    return () => clearTimeout(scrollTimeout);
  }, [activeVariant?.id, variantToImageIndex, allImagesWithVariant]);

  const handleMobileScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.offsetWidth;
    const newIdx = Math.round(scrollLeft / width);
    if (newIdx !== mobileActiveIdx) setMobileActiveIdx(newIdx);
  };

  const rawPrice = activeVariant 
    ? calculatePrice(activeVariant, userMode, product)
    : 0;

  // Calculate Discount
  const activeCoupon = useMemo(() => coupons.find(c => c.product_ids?.includes(product.id)), [coupons, product.id]);
  const finalPrice = useMemo(() => {
      if (!activeCoupon) return rawPrice;
      if (activeCoupon.discount_type === 'percentage') return rawPrice * (1 - activeCoupon.discount_value / 100);
      return Math.max(0, rawPrice - activeCoupon.discount_value);
  }, [rawPrice, activeCoupon]);

  const handleAddToCart = () => {
    if (!activeVariant) return;
    
    if (quantity > activeVariant.stock_quantity) {
        if (onShowToast) {
            onShowToast(`Estoque insuficiente. Apenas ${activeVariant.stock_quantity} disponíveis.`, 'error');
        } else {
            alert(`Estoque insuficiente.`);
        }
        return;
    }

    // Priorizar imagem da variante, depois imagem base do produto
    const itemImage = (activeVariant.variant_images && activeVariant.variant_images.length > 0)
      ? activeVariant.variant_images[0]
      : (product.base_images && product.base_images.length > 0)
        ? product.base_images[0]
        : '';

    onAddToCart({
      variant_id: activeVariant.id,
      product_id: product.id,
      name: product.name,
      image: itemImage,
      size: activeVariant.size || 'N/A',
      color_name: activeVariant.color_name,
      color_hex: activeVariant.color_hex || '#000',
      price: finalPrice,
      original_price: activeCoupon ? rawPrice : undefined,
      quantity: quantity,
      sku: activeVariant.sku,
      applied_coupon_code: activeCoupon?.code
    });
  };

  const incrementQuantity = () => {
      if (!activeVariant) return;
      if (quantity < activeVariant.stock_quantity) {
          setQuantity(quantity + 1);
      } else {
          if (onShowToast) {
              onShowToast("Limite de estoque atingido para este item.", 'info');
          }
      }
  };

  const handleShare = (platform: 'whatsapp' | 'facebook' | 'twitter' | 'linkedin' | 'copy') => {
      const url = window.location.href;
      const text = `Confira ${getLoc(product.name)} na Auricapri.`;
      
      switch(platform) {
          case 'whatsapp':
              window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
              break;
          case 'facebook':
              window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
              break;
          case 'twitter':
              window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
              break;
          case 'linkedin':
              window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
              break;
          case 'copy':
              navigator.clipboard.writeText(url);
              setLinkCopied(true);
              setTimeout(() => setLinkCopied(false), 2000);
              break;
      }
      setIsShareOpen(false);
  };

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadReviews = async () => {
      // Verifica cache primeiro
      const cached = reviewsCache.get(product.id);
      if (cached && Date.now() - cached.timestamp < REVIEWS_CACHE_TTL) {
        setReviews(cached.reviews);
        return;
      }

      setIsLoadingReviews(true);
      try {
        const productReviews: ProductReview[] = await productReviewsApi.getByProductId(product.id);
        if (!isMounted) return;

        setReviews(productReviews);
        // Salva no cache
        reviewsCache.set(product.id, { reviews: productReviews, timestamp: Date.now() });
      } catch (error) {
        console.error('Error loading reviews:', error);
        if (isMounted) setReviews([]);
      } finally {
        if (isMounted) setIsLoadingReviews(false);
      }
    };

    loadReviews();

    return () => {
      isMounted = false;
    };
  }, [product.id]);


  // Construct Composition String
  const compositionText = activeVariant?.composition 
    ? `${getLoc(activeVariant.composition)}\n\n${getLoc(activeVariant.care_instructions)}` 
    : 'Sustainable luxury materials. Hand-finished in our atelier.';

  const relatedProducts = useMemo(() => {
    if (!products.length) return [];
    
    const modeFiltered = filterProductsForMode(products, userMode);
    
    const sameCategory = modeFiltered.filter(p => 
      p.id !== product.id && 
      p.category_id === product.category_id &&
      p.is_active
    );
    
    if (sameCategory.length >= 5) {
      return sameCategory.slice(0, 5);
    }
    
    const otherProducts = modeFiltered.filter(p => 
      p.id !== product.id && 
      p.category_id !== product.category_id &&
      p.is_active
    );
    
    const combined = [...sameCategory, ...otherProducts];
    return combined.slice(0, 5);
  }, [products, product.id, product.category_id, userMode]);

  const getDisplayPrice = (p: Product, originalPrice: number) => {
    const activeCoupon = coupons.find(c => c.product_ids?.includes(p.id));
    if (!activeCoupon) return { original: originalPrice, final: originalPrice, hasDiscount: false };

    let final = originalPrice;
    if (activeCoupon.discount_type === 'percentage') {
        final = originalPrice * (1 - activeCoupon.discount_value / 100);
    } else {
        final = Math.max(0, originalPrice - activeCoupon.discount_value);
    }
    return { original: originalPrice, final, hasDiscount: true, code: activeCoupon.code };
  };

  return (
    <div className="relative w-full bg-white">
      <div className="flex flex-col md:flex-row w-full min-h-screen">
        
        {/* GALLERY COLUMN - 60% Width */}
        <div className="w-full md:w-[60%] bg-neutral-50 relative">
          
          {/* DESKTOP VIEW: Vertical Scroll Stack */}
          <div className="hidden md:flex flex-col space-y-4 p-4 lg:p-12 overflow-y-visible" id="desktop-gallery">
            {allImagesWithVariant.map((imgData, idx) => {
              // Check if this image belongs to the active variant using variantIds
              const isActiveVariantImage = activeVariant && imgData.variantIds?.includes(activeVariant.id) || false;
              
              // Add anchor on first image of each combination
              const isFirstOfCombination = idx === 0 || allImagesWithVariant[idx - 1].combinationKey !== imgData.combinationKey;
              
              return (
                <div 
                  key={`img-${imgData.variantId}-${idx}-${imgData.url}`}
                  data-variant-id={imgData.variantIds?.join(',') || imgData.variantId}
                  data-combination-key={imgData.combinationKey}
                  id={isFirstOfCombination ? `anchor-${imgData.combinationKey}` : undefined}
                  role="button"
                  tabIndex={0}
                  aria-label={`Ampliar imagem ${idx + 1} do produto ${getLoc(product.name)}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setZoomImgIndex(idx);
                      setIsZoomOpen(true);
                    }
                  }}
                  className="relative aspect-[3/4] bg-white overflow-hidden cursor-zoom-in group rounded-[1.5rem] lg:rounded-[2.5rem] shadow-sm border border-neutral-100 transition-all focus:outline-2 focus:outline-black focus:outline-offset-2"
                  onClick={() => { setZoomImgIndex(idx); setIsZoomOpen(true); }}
                >
                  <OptimizedImage
                    src={imgData.url}
                    alt={`${getLoc(product.name)} view ${idx + 1}`}
                    className="w-full h-full transition-transform duration-[1.5s] ease-out group-hover:scale-110"
                    size={idx < 2 ? 'large' : 'medium'}
                    priority={idx < 2}
                    objectFit="contain"
                    useSrcSet
                    srcSetSizes={['medium', 'large', 'xlarge']}
                  />
                  <div className="absolute bottom-10 right-10 p-5 bg-white/90 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-xl">
                    <Maximize2 className="w-6 h-6" />
                  </div>
                  {isActiveVariantImage && (
                    <div className="absolute top-4 left-4 px-3 py-1.5 bg-black text-white text-[8px] font-black uppercase tracking-widest rounded-full">
                      {getLoc(activeVariant.color_name)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* MOBILE VIEW: Horizontal Swipe Carousel */}
          <div className="md:hidden relative group">
            <div 
              ref={mobileGalleryRef}
              onScroll={handleMobileScroll}
              className="aspect-[3/4] overflow-x-auto snap-x snap-mandatory flex no-scrollbar bg-white"
            >
              {allImagesWithVariant.map((imgData, idx) => {
                // Check if this image belongs to the active variant using variantIds
                const isActiveVariantImage = activeVariant && imgData.variantIds?.includes(activeVariant.id) || false;
                
                // Add anchor on first image of each combination
                const isFirstOfCombination = idx === 0 || allImagesWithVariant[idx - 1].combinationKey !== imgData.combinationKey;
                
                return (
                  <div 
                    key={`img-mobile-${imgData.variantId}-${idx}-${imgData.url}`}
                    data-variant-id={imgData.variantIds?.join(',') || imgData.variantId}
                    data-combination-key={imgData.combinationKey}
                    id={isFirstOfCombination ? `anchor-mobile-${imgData.combinationKey}` : undefined}
                    role="button"
                    tabIndex={0}
                    aria-label={`Ampliar imagem ${idx + 1} do produto ${getLoc(product.name)}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setZoomImgIndex(idx);
                        setIsZoomOpen(true);
                      }
                    }}
                    className="flex-none w-full h-full snap-center relative overflow-hidden focus:outline-2 focus:outline-black focus:outline-offset-2"
                    onClick={() => { setZoomImgIndex(idx); setIsZoomOpen(true); }}
                  >
                    <OptimizedImage
                      src={imgData.url}
                      alt={`${getLoc(product.name)} - ${getLoc(activeVariant?.color_name || {})} - Vista ${idx + 1}`}
                      className="w-full h-full"
                      size="medium"
                      priority={idx === 0}
                      objectFit="contain"
                    />
                    {isActiveVariantImage && (
                      <div className="absolute top-4 left-4 px-3 py-1.5 bg-black text-white text-[8px] font-black uppercase tracking-widest rounded-full">
                        {getLoc(activeVariant.color_name)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/20">
               <span className="text-[10px] font-black text-white uppercase tracking-widest">
                  {mobileActiveIdx + 1} <span className="text-white/40">/ {allImagesWithVariant.length}</span>
               </span>
            </div>
          </div>
        </div>

        {/* INFO COLUMN - 40% Width */}
        <div className="w-full md:w-[40%] p-8 md:p-12 lg:p-16 bg-white">
          <div className="md:sticky md:top-24 transition-all duration-700">
            {/* Top section: name, price, selections - NO SCROLL */}
            <div className="mb-6 pt-2 md:pt-0">
              {reviews.length > 0 && (
                <div className="flex items-center gap-3 mb-4 animate-in fade-in duration-700">
                  <div className="flex text-black">
                     {[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < 4 ? 'fill-current' : 'text-neutral-100'}`} />)}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">({reviews.length} avaliações)</span>
                </div>
              )}
              
              {product.has_free_shipping && (
                <div className="flex items-center gap-1.5 mb-4 bg-emerald-500 text-white px-2.5 py-1 rounded-full w-fit">
                  <Truck className="w-2.5 h-2.5" />
                  <span className="text-[8px] font-black uppercase tracking-widest">Frete Grátis</span>
                </div>
              )}
              
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-light tracking-tighter uppercase leading-[0.95] mb-6 text-neutral-900 line-clamp-2">
                {getLoc(product.name)}
              </h1>
              
              <div className="flex flex-col mb-6">
                <div className="flex items-baseline space-x-4">
                    {activeCoupon && (
                        <span className="text-lg font-bold text-neutral-400 line-through decoration-red-400 decoration-2">{formatCurrency(rawPrice, locale)}</span>
                    )}
                    <span className={`text-2xl font-light tracking-tighter ${activeCoupon ? 'text-red-500' : 'text-black'}`}>{formatCurrency(finalPrice, locale)}</span>
                </div>
                {activeVariant?.stock_quantity <= 10 && activeVariant?.stock_quantity > 0 && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-red-500 mt-2 animate-pulse">
                        Últimas {activeVariant.stock_quantity} unidades
                    </span>
                )}
              </div>
            </div>

            {/* SELECTION AREAS - NO SCROLL */}
            <div className="space-y-6 mb-6">
              {colors.length > 0 && (
                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black tracking-[0.3em] text-neutral-400">Paleta — {getLoc(activeVariant?.color_name)}</label>
                  <div className="flex flex-wrap gap-3">
                    {colors.map(c => (
                      <button 
                        key={c.hex} 
                        onClick={() => setSelectedColorHex(c.hex)}
                        className={`w-12 h-12 rounded-full border-2 p-1 transition-all duration-500 ${selectedColorHex === c.hex ? 'border-black scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                      >
                        <div className="w-full h-full rounded-full shadow-inner border border-neutral-100" style={{ backgroundColor: c.hex }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {sizes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase font-black tracking-[0.3em] text-neutral-400">Medidas</label>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setShowFaceSwap(true)} className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-neutral-900 border-b border-black pb-0.5 hover:opacity-50 transition-opacity">
                        <Shirt className="w-3 h-3" /> Provador
                      </button>
                      {activeSizeGuideImage && (
                          <button onClick={() => setIsSizeGuideOpen(true)} className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-neutral-900 border-b border-black pb-0.5 hover:opacity-50 transition-opacity">
                              <Ruler className="w-3 h-3" /> Guia de Tamanhos
                          </button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map(s => {
                      const isSelected = selectedSize === s;
                      
                      return (
                        <button 
                          key={s} 
                          onClick={() => setSelectedSize(s || '')}
                          className={`min-w-[60px] px-5 py-3 text-[11px] font-black border transition-all duration-500 rounded-xl uppercase tracking-widest ${
                            isSelected 
                              ? 'bg-black text-white border-black shadow-xl' 
                              : 'bg-white text-neutral-400 border-neutral-100 hover:border-black hover:text-black'
                          }`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                  
                  {selectedSize && !isSelectedSizeAvailable && (
                    <p className="text-[10px] text-orange-600 font-bold uppercase tracking-widest mt-2">
                      Tamanho {selectedSize} não disponível para esta cor. Selecione outro tamanho.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ACTIONS - Always visible */}
            <div ref={actionsRef} className="pt-6 border-t border-neutral-100 bg-white">
              <div className="flex flex-col gap-4">
               <div className="flex items-stretch gap-3 h-16">
                  <div className="flex flex-none items-center bg-neutral-50 rounded-2xl border border-neutral-100 px-4 space-x-6">
                     <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:opacity-50 transition-opacity"><Minus className="w-4 h-4" /></button>
                     <span className="text-sm font-black w-4 text-center">{quantity}</span>
                     <button 
                        onClick={incrementQuantity} 
                        className={`p-2 transition-opacity ${quantity >= (activeVariant?.stock_quantity || 0) ? 'opacity-20 cursor-not-allowed' : 'hover:opacity-50'}`}
                        disabled={quantity >= (activeVariant?.stock_quantity || 0)}
                     >
                        <Plus className="w-4 h-4" />
                     </button>
                  </div>
                  
                  <button 
                    onClick={handleAddToCart}
                    disabled={!activeVariant || activeVariant.stock_quantity === 0}
                    className="flex-1 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-neutral-800 transition-all active:scale-[0.98] disabled:opacity-20 flex items-center justify-center text-center px-4"
                  >
                    {activeVariant?.stock_quantity === 0 ? t('product.outOfStock') : t('product.addToCart')}
                  </button>

                  <button 
                    onClick={onToggleWishlist}
                    aria-label="Toggle wishlist"
                    className={`flex-none aspect-square border rounded-2xl flex items-center justify-center transition-all duration-500 ${isWishlisted ? 'bg-black text-white border-black shadow-lg' : 'border-neutral-100 text-neutral-300 hover:text-black hover:border-black hover:bg-neutral-50'}`}
                  >
                    <Heart 
                      className="w-5 h-5 transition-transform active:scale-125" 
                      fill={isWishlisted ? "currentColor" : "none"}
                    />
                  </button>

                  <div className="relative">
                      <button 
                        onClick={() => setIsShareOpen(!isShareOpen)}
                        className={`h-full aspect-square border rounded-2xl flex items-center justify-center transition-all duration-500 ${isShareOpen ? 'bg-black text-white border-black shadow-lg' : 'border-neutral-100 text-neutral-300 hover:text-black hover:border-black hover:bg-neutral-50'}`}
                      >
                        <Share2 className="w-5 h-5" />
                      </button>

                      {isShareOpen && (
                          <div className="absolute bottom-[110%] right-0 min-w-[220px] bg-white rounded-[2rem] shadow-2xl border border-neutral-100 p-4 animate-in slide-in-from-bottom-2 fade-in duration-300 z-50">
                              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-2 block px-2">Compartilhar</span>
                              
                              <div className="flex flex-col gap-1">
                                  <button onClick={() => handleShare('whatsapp')} className="flex items-center gap-3 p-3 hover:bg-neutral-50 rounded-xl transition-all group w-full text-left">
                                      <div className="bg-green-500 text-white p-1.5 rounded-full group-hover:scale-110 transition-transform"><MessageCircle className="w-3 h-3" /></div>
                                      <span className="text-[10px] font-bold uppercase tracking-widest">WhatsApp</span>
                                  </button>
                                  
                                  <button onClick={() => handleShare('facebook')} className="flex items-center gap-3 p-3 hover:bg-neutral-50 rounded-xl transition-all group w-full text-left">
                                      <div className="bg-blue-600 text-white p-1.5 rounded-full group-hover:scale-110 transition-transform"><Facebook className="w-3 h-3" /></div>
                                      <span className="text-[10px] font-bold uppercase tracking-widest">Facebook</span>
                                  </button>

                                  <button onClick={() => handleShare('twitter')} className="flex items-center gap-3 p-3 hover:bg-neutral-50 rounded-xl transition-all group w-full text-left">
                                      <div className="bg-black text-white p-1.5 rounded-full group-hover:scale-110 transition-transform"><Twitter className="w-3 h-3" /></div>
                                      <span className="text-[10px] font-bold uppercase tracking-widest">X / Twitter</span>
                                  </button>

                                  <div className="h-[1px] bg-neutral-100 my-2" />

                                  <button onClick={() => handleShare('copy')} className="flex items-center gap-3 p-3 hover:bg-neutral-50 rounded-xl transition-all group w-full text-left">
                                      <div className="bg-neutral-100 text-black p-1.5 rounded-full group-hover:scale-110 transition-transform">
                                          {linkCopied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                                      </div>
                                      <span className="text-[10px] font-bold uppercase tracking-widest">{linkCopied ? 'Copiado!' : 'Copiar Link'}</span>
                                  </button>
                              </div>
                          </div>
                      )}
                  </div>
               </div>
               
               {/* Trust Badges */}
               <div className="flex flex-wrap items-center gap-4 pt-2">
                 <div className="flex items-center gap-2 text-neutral-600">
                   <RefreshCw className="w-4 h-4" />
                   <span className="text-[9px] font-black uppercase tracking-widest">Troca fácil</span>
                 </div>
                 <div className="flex items-center gap-2 text-neutral-600">
                   <ShieldCheck className="w-4 h-4" />
                   <span className="text-[9px] font-black uppercase tracking-widest">Pagamento seguro</span>
                 </div>
                 <div className="flex items-center gap-2 text-neutral-600">
                   <Truck className="w-4 h-4" />
                   <span className="text-[9px] font-black uppercase tracking-widest">Envio para todo Brasil</span>
                 </div>
               </div>
              </div>
            </div>

            {/* ACCORDIONS - Below fold content */}
            <div className="pt-6 border-t border-neutral-100 mt-6">
              <div className="space-y-2">
               {[
                 { id: 'desc', label: t('product.description'), content: getLoc(product.description) },
                 { id: 'comp', label: t('product.composition'), content: compositionText }
               ].map(section => (
                 <div key={section.id} className="border-b border-neutral-50 last:border-0">
                    <button 
                      onClick={() => setOpenSection(openSection === section.id ? null : section.id)} 
                      className="w-full flex justify-between items-center py-5 text-[11px] font-black uppercase tracking-[0.3em] hover:opacity-60 transition-opacity"
                    >
                      {section.label}
                      {openSection === section.id ? <Minus className="w-4 h-4 text-neutral-400" /> : <Plus className="w-4 h-4 text-neutral-400" />}
                    </button>
                    <div className={`overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${openSection === section.id ? 'max-h-96 opacity-100 pb-6' : 'max-h-0 opacity-0'}`}>
                       <p className="text-[12px] leading-relaxed text-neutral-500 font-medium max-w-sm whitespace-pre-line">{section.content}</p>
                    </div>
                 </div>
               ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RELATED PRODUCTS */}
      {relatedProducts.length > 0 && (
        <div className="w-full bg-white border-t border-neutral-100 pt-32 pb-40">
          <div className="w-full">
            <div className="mb-16 px-8 md:px-24">
              <h2 className="text-3xl font-light tracking-tight uppercase mb-2">{t('product.related')}</h2>
              <p className="text-[10px] text-neutral-400 tracking-[0.2em] uppercase font-bold">{t('product.relatedSubtitle')}</p>
            </div>
            
            <div className="hidden md:flex w-full">
              {relatedProducts.map((p) => {
                const mainVariant = p.variants?.[0];
                const rawPrice = mainVariant ? calculatePrice(mainVariant, userMode) : 0;
                const { original, final, hasDiscount, code } = getDisplayPrice(p, rawPrice);
                const displayImg = p.default_image_url || p.base_images[0];
                const isWishlistedProduct = wishlistIds.includes(p.id);
                
                return (
                  <div 
                    key={p.id} 
                    onClick={() => onSelectProduct?.(p)} 
                    className="flex-1 cursor-pointer group relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700"
                  >
                    <div className="relative w-full h-[500px] overflow-hidden bg-neutral-50">
                      <OptimizedImage
                        src={displayImg}
                        alt={getLoc(p.name)}
                        className="w-full h-full transition-transform duration-1000 group-hover:scale-110"
                        size="medium"
                        objectFit="cover"
                      />
                      
                      <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                        {hasDiscount && (
                          <div className="bg-black text-white px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
                            <Tag className="w-3 h-3" />
                            <span className="text-[8px] font-black uppercase tracking-widest">{code}</span>
                          </div>
                        )}
                        {p.has_free_shipping && (
                          <div className="bg-emerald-500 text-white px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
                            <Truck className="w-3 h-3" />
                            <span className="text-[8px] font-black uppercase tracking-widest">Frete Gratis</span>
                          </div>
                        )}
                      </div>

                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          onToggleWishlistProduct?.(p.id); 
                        }} 
                        className={`absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-sm transition-all transform hover:scale-110 active:scale-90 ${isWishlistedProduct ? 'text-red-500' : 'text-neutral-400 hover:text-neutral-900'}`}
                      >
                        <Heart className="w-4 h-4" fill={isWishlistedProduct ? "currentColor" : "none"} />
                      </button>
                      
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-6">
                        <div className="flex flex-col">
                          <h3 className="text-sm font-black uppercase tracking-widest text-white mb-2 leading-tight line-clamp-2">{getLoc(p.name)}</h3>
                          <div className="flex flex-col items-start">
                            {hasDiscount && (
                              <span className="text-xs font-bold text-white/60 line-through decoration-white/40 mb-0.5">{formatCurrency(original, locale)}</span>
                            )}
                            <span className={`text-base font-black tracking-tighter ${hasDiscount ? 'text-red-400' : 'text-white'}`}>
                              {formatCurrency(final, locale)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="md:hidden overflow-x-auto no-scrollbar">
              <div className="flex" style={{ width: `${relatedProducts.length * 280}px` }}>
                {relatedProducts.map((p) => {
                  const mainVariant = p.variants?.[0];
                  const rawPrice = mainVariant ? calculatePrice(mainVariant, userMode) : 0;
                  const { original, final, hasDiscount, code } = getDisplayPrice(p, rawPrice);
                  const displayImg = p.default_image_url || p.base_images[0];
                  const isWishlistedProduct = wishlistIds.includes(p.id);
                  
                  return (
                    <div 
                      key={p.id} 
                      onClick={() => onSelectProduct?.(p)} 
                      className="flex-none w-[280px] cursor-pointer group relative overflow-hidden"
                    >
                      <div className="relative w-full h-[350px] overflow-hidden bg-neutral-50">
                        <OptimizedImage
                          src={displayImg}
                          alt={getLoc(p.name)}
                          className="w-full h-full transition-transform duration-1000 group-hover:scale-110"
                          size="medium"
                          objectFit="cover"
                        />
                        
                        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                          {hasDiscount && (
                            <div className="bg-black text-white px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
                              <Tag className="w-2.5 h-2.5" />
                              <span className="text-[7px] font-black uppercase tracking-widest">{code}</span>
                            </div>
                          )}
                          {p.has_free_shipping && (
                            <div className="bg-emerald-500 text-white px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
                              <Truck className="w-2.5 h-2.5" />
                              <span className="text-[7px] font-black uppercase tracking-widest">Frete Gratis</span>
                            </div>
                          )}
                        </div>

                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            onToggleWishlistProduct?.(p.id); 
                          }} 
                          className={`absolute top-3 right-3 p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm transition-all transform hover:scale-110 active:scale-90 ${isWishlistedProduct ? 'text-red-500' : 'text-neutral-400 hover:text-neutral-900'}`}
                        >
                          <Heart className="w-3.5 h-3.5" fill={isWishlistedProduct ? "currentColor" : "none"} />
                        </button>
                        
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-4">
                          <div className="flex flex-col">
                            <h3 className="text-xs font-black uppercase tracking-widest text-white mb-1 leading-tight line-clamp-2">{getLoc(p.name)}</h3>
                            <div className="flex flex-col items-start">
                              {hasDiscount && (
                                <span className="text-[9px] font-bold text-white/60 line-through decoration-white/40 mb-0.5">{formatCurrency(original, locale)}</span>
                              )}
                              <span className={`text-sm font-black tracking-tighter ${hasDiscount ? 'text-red-400' : 'text-white'}`}>
                                {formatCurrency(final, locale)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REVIEWS */}
      {(reviews.length > 0 || isLoadingReviews) && (
        <div id="reviews" className="w-full bg-white border-t border-neutral-100 pt-32 pb-40 px-8 md:px-24">
          <div className="max-w-7xl mx-auto">
            <ProductReviews 
              productId={product.id} 
              reviews={reviews} 
              user={currentUser} 
              userOrders={userOrders}
              t={t} 
              isLoading={isLoadingReviews}
              onAddReview={async (r) => { 
                 const newReview: ProductReview = { ...r, id: `rev_${Date.now()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), helpful_count: 0, cashback_awarded: false } as ProductReview;
                 setReviews(prev => [newReview, ...prev]);
              }}
            />
          </div>
        </div>
      )}

      {/* SIZE GUIDE MODAL */}
      {isSizeGuideOpen && activeSizeGuideImage && (
          <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setIsSizeGuideOpen(false)}>
              <div className="bg-white rounded-[2rem] overflow-hidden max-w-3xl w-full max-h-[90vh] relative shadow-2xl" onClick={e => e.stopPropagation()}>
                  <button 
                    onClick={() => setIsSizeGuideOpen(false)}
                    className="absolute top-4 right-4 p-2 bg-black text-white rounded-full z-10 hover:rotate-90 transition-all"
                  >
                      <X className="w-5 h-5" />
                  </button>
                  <img src={activeSizeGuideImage} className="w-full h-full object-contain max-h-[90vh]" alt="Size Guide" />
              </div>
          </div>
      )}

      {/* ZOOM MODAL */}
      {isZoomOpen && (
        <div className="fixed inset-0 z-[1000] bg-white flex flex-col animate-in fade-in zoom-in-95 duration-700">
           <header className="h-24 px-12 flex justify-between items-center fixed top-0 w-full z-10 bg-white/90 backdrop-blur-3xl">
              <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase tracking-[0.4em] text-neutral-300">Gallery View</span>
                <h4 className="text-[11px] font-black uppercase tracking-[0.4em]">{getLoc(product.name)}</h4>
              </div>
              <button onClick={() => setIsZoomOpen(false)} className="p-4 bg-black text-white rounded-full hover:rotate-90 transition-all duration-500 shadow-2xl">
                <X className="w-6 h-6" />
              </button>
           </header>
           
           <div className="flex-1 overflow-hidden p-8 md:p-24 flex items-center justify-center relative bg-neutral-50/30">
              <button 
                disabled={zoomImgIndex === 0} 
                onClick={() => setZoomImgIndex(prev => prev - 1)} 
                className="absolute left-6 md:left-12 p-6 bg-white/80 backdrop-blur-md rounded-full shadow-2xl disabled:opacity-0 transition-all"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              
              <div className="w-full h-full flex items-center justify-center overflow-hidden">
                <img 
                  src={displayImages[zoomImgIndex]} 
                  className="max-h-full max-w-full object-contain cursor-crosshair transition-transform duration-700 hover:scale-150" 
                  alt=""
                />
              </div>
              
              <button 
                disabled={zoomImgIndex === allImagesWithVariant.length - 1} 
                onClick={() => setZoomImgIndex(prev => prev + 1)} 
                className="absolute right-6 md:right-12 p-6 bg-white/80 backdrop-blur-md rounded-full shadow-2xl disabled:opacity-0 transition-all"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
           </div>
           
           <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-3 p-3 bg-white/50 backdrop-blur-xl rounded-[2rem] border border-white/20">
              {allImagesWithVariant.map((imgData, i) => (
                <button 
                  key={i} 
                  onClick={() => setZoomImgIndex(i)}
                  aria-label={`Ver imagem ${i + 1} de ${allImagesWithVariant.length} do produto ${getLoc(product.name)}`}
                  aria-pressed={zoomImgIndex === i}
                  className={`w-12 h-16 rounded-xl overflow-hidden border-2 transition-all ${zoomImgIndex === i ? 'border-black scale-110 shadow-lg' : 'border-transparent opacity-40 hover:opacity-100'}`}
                >
                  <img src={imgData.url} className="w-full h-full object-contain" alt={`Miniatura ${i + 1}`} />
                </button>
              ))}
           </div>
        </div>
      )}

      {/* FACE SWAP MODAL */}
      {activeVariant && (
        <FaceSwapModal
          isOpen={showFaceSwap}
          onClose={() => setShowFaceSwap(false)}
          variant={activeVariant}
          productName={product.name}
          productImage={
            (activeVariant.variant_images && activeVariant.variant_images.length > 0)
              ? activeVariant.variant_images[0]
              : (product.base_images && product.base_images.length > 0)
                ? product.base_images[0]
                : ''
          }
          userId={currentUser?.id || `guest_${Date.now()}`}
          locale={locale}
        />
      )}
    </div>
  );
};

export default ProductDetail;
