/**
 * ProductDetail Component - React Native
 * Adapted from web version - basic functional version
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, Dimensions, Platform, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Product, UserMode, CartItem, UserProfile, Coupon, SizeGuide, Order, Category } from '../../types';
import { Locale } from '../../i18n';
import { formatCurrency } from '../../utils/currency';
import { calculatePrice, filterProductsForMode } from '../../utils/product';
import { Heart, Plus, Minus, ArrowLeft, Tag, ChevronLeft, ChevronRight, X, ShieldCheck, Truck, RefreshCw } from '../ui';
import ProductReviews from './ProductReviews';

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
  userOrders?: Order[];
  onShowToast?: (message: string, type?: 'info' | 'error') => void;
  sizeGuides?: SizeGuide[];
  products?: Product[];
  categories?: Category[];
  onSelectProduct?: (product: Product) => void;
  wishlistIds?: string[];
  onToggleWishlistProduct?: (productId: string) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const width = screenWidth;
const ZOOM_IMAGE_CONTAINER_HEIGHT = screenHeight - 96 - 200; // Full height minus header and thumbnails

const ProductDetail: React.FC<ProductDetailProps> = ({
  product,
  coupons = [],
  userMode,
  onAddToCart,
  onBack,
  isWishlisted,
  onToggleWishlist,
  t,
  locale,
  currentUser,
  userOrders = [],
  onShowToast,
  sizeGuides = [],
  products = [],
  categories = [],
  onSelectProduct,
  wishlistIds = [],
  onToggleWishlistProduct
}) => {
  const insets = useSafeAreaInsets();
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
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomImgIndex, setZoomImgIndex] = useState(0);
  
  const mobileGalleryRef = useRef<ScrollView>(null);

  // Sizes: filtered dynamically based on selected color
  const sizes = useMemo(() => {
    if (!selectedColorHex) {
      return Array.from(new Set(variants.map(v => v.size).filter(Boolean)));
    }
    const variantsForColor = variants.filter(v => v.color_hex === selectedColorHex);
    return Array.from(new Set(variantsForColor.map(v => v.size).filter(Boolean)));
  }, [variants, selectedColorHex]);

  // Initialize selected color
  useEffect(() => {
    if (colors.length > 0 && !selectedColorHex) {
      setSelectedColorHex(colors[0].hex);
    }
  }, [colors, selectedColorHex]);

  // Initialize selected size
  useEffect(() => {
    if (selectedColorHex && sizes.length > 0 && !selectedSize) {
      setSelectedSize(sizes[0] || '');
    }
  }, [selectedColorHex, sizes, selectedSize]);

  // Active variant
  const activeVariant = useMemo(() => {
    const found = variants.find(v => v.size === selectedSize && v.color_hex === selectedColorHex);
    return found || variants[0];
  }, [selectedSize, selectedColorHex, variants]);

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
        url: product.default_image_url || 'https://via.placeholder.com/1200x1600?text=No+Image', 
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
  }, [variants, product.base_images, product.default_image_url]);

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

  // Extract just URLs for display
  const displayImages = useMemo(() => allImagesWithVariant.map(img => img.url), [allImagesWithVariant]);

  // Find the index of the first image of the active variant's combination
  const activeVariantFirstImageIndex = useMemo(() => {
    if (!activeVariant) return 0;
    
    const size = activeVariant.size || '';
    const colorHex = activeVariant.color_hex || '';
    const combinationKey = `${size}-${colorHex}`;
    
    // First, try to find images that belong to this specific combination
    const combinationImageIndex = allImagesWithVariant.findIndex(img => 
      !img.isBase && img.combinationKey === combinationKey
    );
    if (combinationImageIndex >= 0) {
      return combinationImageIndex;
    }
    
    // Fallback: try to find images by variant ID
    const variantImageIndex = allImagesWithVariant.findIndex(img => img.variantId === activeVariant.id);
    if (variantImageIndex >= 0) {
      return variantImageIndex;
    }
    
    // If variant has no specific images, check if it should use base images
    const baseImageIndex = allImagesWithVariant.findIndex(img => img.isBase);
    return baseImageIndex >= 0 ? baseImageIndex : 0;
  }, [activeVariant, allImagesWithVariant]);

  // Price
  const rawPrice = activeVariant 
    ? calculatePrice(activeVariant, userMode, product)
    : 0;

  const activeCoupon = useMemo(() => coupons.find(c => c.product_ids?.includes(product.id)), [coupons, product.id]);
  const finalPrice = useMemo(() => {
    if (!activeCoupon) return rawPrice;
    if (activeCoupon.discount_type === 'percentage') return rawPrice * (1 - activeCoupon.discount_value / 100);
    return Math.max(0, rawPrice - activeCoupon.discount_value);
  }, [rawPrice, activeCoupon]);

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

  // Scroll to active variant images when variant changes
  useEffect(() => {
    if (!activeVariant) return;
    
    // Find the index using the variantToImageIndex map
    const targetImageIndex = variantToImageIndex.get(activeVariant.id);
    const finalIndex = targetImageIndex !== undefined && targetImageIndex >= 0 ? targetImageIndex : activeVariantFirstImageIndex;
    
    // Wait a bit for layout to be ready, then scroll
    const scrollTimeout = setTimeout(() => {
      // Scroll horizontal by index
      if (mobileGalleryRef.current && finalIndex >= 0 && finalIndex < displayImages.length) {
        const scrollPosition = finalIndex * width;
        mobileGalleryRef.current.scrollTo({ x: scrollPosition, animated: true });
        setCurrentImageIndex(finalIndex);
      }
    }, 150);
    
    return () => clearTimeout(scrollTimeout);
  }, [activeVariant?.id, variantToImageIndex, activeVariantFirstImageIndex, displayImages.length, width]);

  // Ensure quantity doesn't exceed stock when switching variants
  useEffect(() => {
    if (activeVariant && quantity > activeVariant.stock_quantity) {
      setQuantity(Math.max(1, activeVariant.stock_quantity));
    }
  }, [activeVariant, quantity]);

  // Reset zoom index when modal opens
  useEffect(() => {
    if (isZoomOpen && currentImageIndex >= 0 && currentImageIndex < displayImages.length) {
      setZoomImgIndex(currentImageIndex);
    }
  }, [isZoomOpen]);

  const handleAddToCart = () => {
    if (!activeVariant) return;
    
    if (quantity > activeVariant.stock_quantity) {
      if (onShowToast) {
        onShowToast(`Estoque insuficiente. Apenas ${activeVariant.stock_quantity} disponíveis.`, 'error');
      }
      return;
    }

    onAddToCart({
      variant_id: activeVariant.id,
      product_id: product.id,
      name: product.name,
      image: displayImages[0],
      size: activeVariant.size || 'N/A',
      color_name: activeVariant.color_name,
      color_hex: activeVariant.color_hex || '#000',
      price: finalPrice,
      quantity: quantity,
      sku: activeVariant.sku
    });

    if (onShowToast) {
      onShowToast('Produto adicionado ao carrinho', 'info');
    }
  };

  const incrementQuantity = () => {
    if (!activeVariant) return;
    if (quantity < activeVariant.stock_quantity) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    setQuantity(Math.max(1, quantity - 1));
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.scrollContent, { paddingTop: Platform.OS === 'ios' ? insets.top : 0 }]}
      >
        {/* Gallery */}
        <View style={styles.galleryContainer}>
          <ScrollView
            ref={mobileGalleryRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const offsetX = e.nativeEvent.contentOffset.x;
              const index = Math.round(offsetX / width);
              setCurrentImageIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {displayImages.map((img, idx) => (
              <TouchableOpacity 
                key={idx} 
                style={{ width }}
                activeOpacity={0.9}
                onPress={() => {
                  setZoomImgIndex(idx);
                  setIsZoomOpen(true);
                }}
              >
                <Image source={{ uri: img }} style={styles.galleryImage} resizeMode="contain" />
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.imageIndicator}>
            <Text style={styles.imageIndicatorText}>
              {currentImageIndex + 1} / {displayImages.length}
            </Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <ArrowLeft size={20} color="#000000" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onToggleWishlist} style={styles.wishlistButton}>
              <Heart filled={isWishlisted} size={24} color={isWishlisted ? '#EF4444' : '#000000'} />
            </TouchableOpacity>
          </View>

          <Text style={styles.productName}>{getLoc(product.name)}</Text>

          <View style={styles.priceContainer}>
            {activeCoupon && (
              <Text style={styles.originalPrice}>{formatCurrency(rawPrice, locale)}</Text>
            )}
            <Text style={[styles.price, activeCoupon && styles.discountedPrice]}>
              {formatCurrency(finalPrice, locale)}
            </Text>
          </View>

          <View style={styles.badgesContainer}>
            {product.has_free_shipping && (
              <View style={styles.couponBadge}>
                <Tag size={12} color="#FFFFFF" />
                <Text style={styles.couponText}>Frete Grátis</Text>
              </View>
            )}
            {activeCoupon && (
              <View style={styles.couponBadge}>
                <Tag size={12} color="#FFFFFF" />
                <Text style={styles.couponText}>{activeCoupon.code} APPLIED</Text>
              </View>
            )}
          </View>

          {/* Color Selection */}
          {colors.length > 0 && (
            <View style={styles.selectionSection}>
              <Text style={styles.selectionLabel}>
                Palette — {getLoc(activeVariant?.color_name)}
              </Text>
              <View style={styles.colorsRow}>
                {colors.map(c => (
                  <TouchableOpacity
                    key={c.hex}
                    onPress={() => setSelectedColorHex(c.hex)}
                    style={[
                      styles.colorButton,
                      selectedColorHex === c.hex && styles.colorButtonSelected
                    ]}
                  >
                    <View style={[styles.colorCircle, { backgroundColor: c.hex }]} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Size Selection */}
          {sizes.length > 0 && (
            <View style={styles.selectionSection}>
              <Text style={styles.selectionLabel}>Measurement</Text>
              <View style={styles.sizesRow}>
                {sizes.map(s => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setSelectedSize(s || '')}
                    style={[
                      styles.sizeButton,
                      selectedSize === s && styles.sizeButtonSelected
                    ]}
                  >
                    <Text style={[
                      styles.sizeButtonText,
                      selectedSize === s && styles.sizeButtonTextSelected
                    ]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Quantity */}
          <View style={styles.quantitySection}>
            <Text style={styles.selectionLabel}>Quantity</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity onPress={decrementQuantity} style={styles.quantityButton}>
                <Minus size={16} color="#000000" />
              </TouchableOpacity>
              <Text style={styles.quantityValue}>{quantity}</Text>
              <TouchableOpacity 
                onPress={incrementQuantity} 
                style={styles.quantityButton}
                disabled={quantity >= (activeVariant?.stock_quantity || 0)}
              >
                <Plus size={16} color={quantity >= (activeVariant?.stock_quantity || 0) ? '#CCCCCC' : '#000000'} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Add to Cart */}
          <TouchableOpacity
            onPress={handleAddToCart}
            disabled={!activeVariant || activeVariant.stock_quantity === 0}
            style={[styles.addToCartButton, (!activeVariant || activeVariant.stock_quantity === 0) && styles.addToCartButtonDisabled]}
          >
            <Text style={styles.addToCartText}>
              {activeVariant?.stock_quantity === 0 ? t('product.outOfStock') || 'Out of Stock' : t('product.addToCart') || 'Add to Cart'}
            </Text>
          </TouchableOpacity>

          {/* Trust Badges */}
          <View style={styles.trustBadgesContainer}>
            <View style={styles.trustBadge}>
              <RefreshCw size={14} color="#737373" />
              <Text style={styles.trustBadgeText}>Troca fácil</Text>
            </View>
            <View style={styles.trustBadge}>
              <ShieldCheck size={14} color="#737373" />
              <Text style={styles.trustBadgeText}>Pagamento seguro</Text>
            </View>
            <View style={styles.trustBadge}>
              <Truck size={14} color="#737373" />
              <Text style={styles.trustBadgeText}>Envio para todo Brasil</Text>
            </View>
          </View>

          {/* Description */}
          {product.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.descriptionTitle}>{t('product.description') || 'Description'}</Text>
              <Text style={styles.descriptionText}>{getLoc(product.description)}</Text>
            </View>
          )}

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <View style={styles.relatedProductsSection}>
              <View style={styles.relatedProductsHeader}>
                <Text style={styles.relatedProductsTitle}>{t('product.related') || 'Produtos Relacionados'}</Text>
                <Text style={styles.relatedProductsSubtitle}>{t('product.relatedSubtitle') || 'Explore mais produtos da mesma coleção'}</Text>
              </View>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.relatedProductsContainer}
              >
                {relatedProducts.map((p) => {
                  const mainVariant = p.variants?.[0];
                  const rawPrice = mainVariant ? calculatePrice(mainVariant, userMode) : 0;
                  const { original, final, hasDiscount, code } = getDisplayPrice(p, rawPrice);
                  const displayImg = p.default_image_url || p.base_images[0];
                  const isWishlistedProduct = wishlistIds.includes(p.id);
                  
                  return (
                    <TouchableOpacity
                      key={p.id}
                      onPress={() => onSelectProduct?.(p)}
                      style={styles.relatedProductCard}
                    >
                      <View style={styles.relatedProductImageContainer}>
                        <Image
                          source={{ uri: displayImg }}
                          style={styles.relatedProductImage}
                          resizeMode="cover"
                        />
                        
                        <View style={styles.relatedProductBadges}>
                          {hasDiscount && (
                            <View style={styles.relatedProductBadge}>
                              <Tag size={10} color="#FFFFFF" />
                              <Text style={styles.relatedProductBadgeText}>{code}</Text>
                            </View>
                          )}
                          {p.has_free_shipping && (
                            <View style={[styles.relatedProductBadge, styles.relatedProductBadgeGreen]}>
                              <Truck size={10} color="#FFFFFF" />
                              <Text style={styles.relatedProductBadgeText}>Frete Gratis</Text>
                            </View>
                          )}
                        </View>

                        <TouchableOpacity
                          onPress={() => {
                            onToggleWishlistProduct?.(p.id);
                          }}
                          style={[styles.relatedProductWishlistButton, isWishlistedProduct && styles.relatedProductWishlistButtonActive]}
                        >
                          <Heart size={14} color={isWishlistedProduct ? "#EF4444" : "#9CA3AF"} filled={isWishlistedProduct} />
                        </TouchableOpacity>
                        
                        <View style={styles.relatedProductOverlay}>
                          <Text style={styles.relatedProductName} numberOfLines={2}>{getLoc(p.name)}</Text>
                          <View style={styles.relatedProductPriceContainer}>
                            {hasDiscount && (
                              <Text style={styles.relatedProductOriginalPrice}>{formatCurrency(original, locale)}</Text>
                            )}
                            <Text style={[styles.relatedProductPrice, hasDiscount && styles.relatedProductPriceDiscount]}>
                              {formatCurrency(final, locale)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Reviews */}
          <ProductReviews
            productId={product.id}
            reviews={reviews}
            user={currentUser}
            userOrders={userOrders}
            t={t}
            onAddReview={async (r) => {
              const newReview: any = { ...r, id: `rev_${Date.now()}`, created_at: new Date().toISOString() };
              setReviews(prev => [newReview, ...prev]);
            }}
          />
        </View>
      </ScrollView>

      {/* ZOOM MODAL */}
      <Modal
        visible={isZoomOpen}
        animationType="fade"
        transparent={false}
        onRequestClose={() => setIsZoomOpen(false)}
      >
        <View style={styles.zoomModalContainer}>
          {/* Header */}
          <View style={styles.zoomModalHeader}>
            <View style={styles.zoomModalHeaderText}>
              <Text style={styles.zoomModalHeaderLabel}>Gallery View</Text>
              <Text style={styles.zoomModalHeaderTitle} numberOfLines={1} ellipsizeMode="tail">{getLoc(product.name)}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => setIsZoomOpen(false)} 
              style={styles.zoomModalCloseButton}
            >
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Image Container */}
          <View style={styles.zoomImageContainer}>
            <TouchableOpacity
              disabled={zoomImgIndex === 0}
              onPress={() => setZoomImgIndex(prev => prev - 1)}
              style={[styles.zoomNavButton, styles.zoomNavButtonLeft, zoomImgIndex === 0 && styles.zoomNavButtonDisabled]}
            >
              <ChevronLeft size={32} color={zoomImgIndex === 0 ? '#CCCCCC' : '#000000'} />
            </TouchableOpacity>

            <View style={styles.zoomImageWrapper}>
              {displayImages.length > 0 && displayImages[zoomImgIndex] ? (
                <Image 
                  source={{ uri: displayImages[zoomImgIndex] }} 
                  style={styles.zoomImage} 
                  resizeMode="contain"
                  onError={(e) => {
                    console.error('Image load error:', e.nativeEvent.error);
                    if (onShowToast) {
                      onShowToast('Erro ao carregar imagem', 'error');
                    }
                  }}
                />
              ) : (
                <View style={styles.zoomImagePlaceholder}>
                  <Text style={styles.zoomImagePlaceholderText}>Imagem não disponível</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              disabled={zoomImgIndex === displayImages.length - 1}
              onPress={() => setZoomImgIndex(prev => prev + 1)}
              style={[styles.zoomNavButton, styles.zoomNavButtonRight, zoomImgIndex === displayImages.length - 1 && styles.zoomNavButtonDisabled]}
            >
              <ChevronRight size={32} color={zoomImgIndex === displayImages.length - 1 ? '#CCCCCC' : '#000000'} />
            </TouchableOpacity>
          </View>

          {/* Thumbnails */}
          <View style={styles.zoomThumbnailsContainer}>
            {allImagesWithVariant.map((imgData, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setZoomImgIndex(i)}
                style={[
                  styles.zoomThumbnail,
                  zoomImgIndex === i && styles.zoomThumbnailActive
                ]}
              >
                <Image 
                  source={{ uri: imgData.url }} 
                  style={styles.zoomThumbnailImage} 
                  resizeMode="cover" 
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 64,
  },
  galleryContainer: {
    width: '100%',
    height: width * 1.33, // 3:4 aspect ratio
    backgroundColor: '#FAFAFA',
    position: 'relative',
  },
  galleryImage: {
    width: width,
    height: width * 1.33,
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 24,
    left: '50%',
    transform: [{ translateX: -30 }],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  imageIndicatorText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoContainer: {
    padding: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  wishlistButton: {
    padding: 8,
  },
  productName: {
    fontSize: 32,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: -1,
    marginBottom: 24,
    lineHeight: 38,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 16,
    marginBottom: 16,
  },
  originalPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#737373',
    textDecorationLine: 'line-through',
  },
  price: {
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: -1,
  },
  discountedPrice: {
    color: '#EF4444',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  couponBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#000000',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 32,
  },
  couponText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  selectionSection: {
    marginBottom: 32,
  },
  selectionLabel: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 4.8,
    color: '#737373',
    marginBottom: 16,
  },
  colorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  colorButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    padding: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorButtonSelected: {
    borderColor: '#000000',
  },
  colorCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  sizesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sizeButton: {
    minWidth: 70,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  sizeButtonSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  sizeButtonText: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
    textAlign: 'center',
  },
  sizeButtonTextSelected: {
    color: '#FFFFFF',
  },
  quantitySection: {
    marginBottom: 32,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignSelf: 'flex-start',
  },
  quantityButton: {
    padding: 8,
  },
  quantityValue: {
    fontSize: 14,
    fontWeight: '900',
    minWidth: 20,
    textAlign: 'center',
  },
  addToCartButton: {
    backgroundColor: '#000000',
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginBottom: 48,
  },
  addToCartButtonDisabled: {
    opacity: 0.3,
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 3.2,
    textAlign: 'center',
  },
  trustBadgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 24,
    marginBottom: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2.4,
    color: '#737373',
  },
  descriptionSection: {
    marginBottom: 48,
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  descriptionTitle: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 4.8,
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 11,
    lineHeight: 20,
    color: '#525252',
  },
  relatedProductsSection: {
    marginBottom: 48,
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  relatedProductsHeader: {
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  relatedProductsTitle: {
    fontSize: 24,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
    marginBottom: 8,
    color: '#000000',
  },
  relatedProductsSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
  },
  relatedProductsContainer: {
    paddingHorizontal: 24,
    gap: 0,
  },
  relatedProductCard: {
    width: 280,
    marginRight: 0,
  },
  relatedProductImageContainer: {
    width: 280,
    height: 350,
    backgroundColor: '#FAFAFA',
    position: 'relative',
    overflow: 'hidden',
  },
  relatedProductImage: {
    width: '100%',
    height: '100%',
  },
  relatedProductBadges: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'column',
    gap: 8,
    zIndex: 10,
  },
  relatedProductBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#000000',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  relatedProductBadgeGreen: {
    backgroundColor: '#10B981',
  },
  relatedProductBadgeText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  relatedProductWishlistButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  relatedProductWishlistButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  relatedProductOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
    paddingTop: 24,
  },
  relatedProductName: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 14,
  },
  relatedProductPriceContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  relatedProductOriginalPrice: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.6)',
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  relatedProductPrice: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: '#FFFFFF',
  },
  relatedProductPriceDiscount: {
    color: '#F87171',
  },
  zoomModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  zoomModalHeader: {
    height: 96,
    paddingHorizontal: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  zoomModalHeaderText: {
    flexDirection: 'column',
  },
  zoomModalHeaderLabel: {
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 3.2, // tracking-[0.4em] = 0.4 * 8px = 3.2px
    color: '#D4D4D4', // text-neutral-300
  },
  zoomModalHeaderTitle: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 4.4, // tracking-[0.4em] = 0.4 * 11px = 4.4px
    color: '#000000',
  },
  zoomModalCloseButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 10,
  },
  zoomImageContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(250, 250, 250, 0.3)', // bg-neutral-50/30
    position: 'relative',
    marginTop: 96, // Space for header
    paddingHorizontal: 24,
    paddingVertical: 32,
    height: ZOOM_IMAGE_CONTAINER_HEIGHT,
  },
  zoomImageWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: width - 128, // Account for buttons and padding
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  zoomImage: {
    width: '100%',
    height: '100%',
    maxWidth: '100%',
    maxHeight: '100%',
    minHeight: 300,
  },
  zoomImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    minHeight: 300,
  },
  zoomImagePlaceholderText: {
    fontSize: 14,
    color: '#737373',
    fontWeight: '500',
  },
  zoomNavButton: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 10,
    zIndex: 10,
  },
  zoomNavButtonLeft: {
    left: 24,
  },
  zoomNavButtonRight: {
    right: 24,
  },
  zoomNavButtonDisabled: {
    opacity: 0,
  },
  zoomThumbnailsContainer: {
    position: 'absolute',
    bottom: 48,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  zoomThumbnail: {
    width: 48,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  zoomThumbnailActive: {
    borderColor: '#000000',
    transform: [{ scale: 1.1 }],
  },
  zoomThumbnailImage: {
    width: '100%',
    height: '100%',
  },
});

export default ProductDetail;

