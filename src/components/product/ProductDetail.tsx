/// Product Detail
/// Main orchestrator component using modular sub-components

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Product, UserMode, CartItem, UserProfile, Coupon, SizeGuide, Category, ProductReview } from '../../types';
import { Locale } from '../../i18n';
import ProductReviews from './ProductReviews';
import { calculatePrice, filterProductsForMode } from '../../utils/product';
import { createGetLoc } from '../../utils/localization';
import { getProductCoupon, applyCouponDiscount } from '../../utils/coupon';
import { share, type SharePlatform } from '../../utils/share';
import { createBreadcrumbSchema } from '../seo/schemas';
import { productReviewsApi } from '../../api/instances';
import { useImageHotspots } from '../../hooks/useImageHotspots';
import { useVariantSelection } from '../../hooks/useVariantSelection';
import { useProductImages } from '../../hooks/useProductImages';
import { useStickyBar } from '../../hooks/useStickyBar';
import { useRecentlyViewed } from '../../hooks/useRecentlyViewed';
import { RelatedProducts } from './RelatedProducts';
import {
  ImageGallery,
  ProductInfo,
  ProductVariants,
  ProductActions,
  ProductAccordions,
  PresentationSection,
  SizeGuideModal,
  ZoomModal,
  MobileStickyBar,
} from './detail';

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
  userOrders?: any[];
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
  categories: _categories = [],
  onSelectProduct,
  wishlistIds = [],
  onToggleWishlistProduct
}) => {
  const getLoc = useMemo(() => createGetLoc(locale), [locale]);
  const { hotspots } = useImageHotspots(product.id);

  // Variant selection
  const {
    colors, sizes, selectedSize, selectedColorHex, activeVariant,
    setSelectedSize, setSelectedColorHex, isSelectedSizeAvailable,
    filteredVariants: variants,
  } = useVariantSelection({ variants: product.variants, userMode });

  // Local state
  const [quantity, setQuantity] = useState(1);
  const [openSection, setOpenSection] = useState<string | null>('desc');
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [zoomImgIndex, setZoomImgIndex] = useState(0);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isPresentationExpanded, setIsPresentationExpanded] = useState(true);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  const actionsRef = useRef<HTMLDivElement>(null);
  const showStickyBar = useStickyBar({ threshold: 200 });

  // Product images
  const {
    images: allImagesWithVariant,
    displayImages,
    mobileGalleryRef,
    mobileActiveIdx,
    setMobileActiveIdx,
  } = useProductImages({ product, variants, activeVariantId: activeVariant?.id });

  // Size guide image
  const activeSizeGuideImage = useMemo(() => {
    if (activeVariant?.size_guide_id) {
      const guide = sizeGuides.find(g => g.id === activeVariant.size_guide_id);
      return guide ? guide.image_url : null;
    }
    return null;
  }, [activeVariant, sizeGuides]);

  // Ensure quantity doesn't exceed stock
  useEffect(() => {
    if (activeVariant && quantity > activeVariant.stock_quantity) {
      setQuantity(Math.max(1, activeVariant.stock_quantity));
    }
  }, [activeVariant, quantity]);

  // Price calculations
  const rawPrice = activeVariant ? calculatePrice(activeVariant, userMode, product) : 0;
  const activeCoupon = useMemo(() => getProductCoupon(product.id, coupons), [coupons, product.id]);
  const finalPrice = useMemo(() => activeCoupon ? applyCouponDiscount(rawPrice, activeCoupon) : rawPrice, [rawPrice, activeCoupon]);

  // Mobile scroll handler
  const handleMobileScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.offsetWidth;
    const newIdx = Math.round(scrollLeft / width);
    if (newIdx !== mobileActiveIdx) setMobileActiveIdx(newIdx);
  };

  // Add to cart handler
  const handleAddToCart = () => {
    if (!activeVariant) return;
    if (quantity > activeVariant.stock_quantity) {
      onShowToast?.(`Estoque insuficiente. Apenas ${activeVariant.stock_quantity} disponíveis.`, 'error');
      return;
    }

    const itemImage = (activeVariant.variant_images?.length)
      ? activeVariant.variant_images[0]
      : (product.base_images?.length) ? product.base_images[0] : '';

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
      quantity,
      sku: activeVariant.sku,
      applied_coupon_code: activeCoupon?.code
    });
  };

  // Increment quantity handler
  const incrementQuantity = () => {
    if (!activeVariant) return;
    if (quantity < activeVariant.stock_quantity) {
      setQuantity(quantity + 1);
    } else {
      onShowToast?.("Limite de estoque atingido para este item.", 'info');
    }
  };

  // Share handler
  const handleShare = async (platform: SharePlatform) => {
    const url = window.location.href;
    const text = `Confira ${getLoc(product.name)} na Auricapri.`;
    const result = await share({ platform, text, url });
    if (platform === 'copy' && result.success) {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
    setIsShareOpen(false);
  };

  // Load reviews
  useEffect(() => {
    let isMounted = true;
    const loadReviews = async () => {
      const cached = reviewsCache.get(product.id);
      if (cached && Date.now() - cached.timestamp < REVIEWS_CACHE_TTL) {
        setReviews(cached.reviews);
        return;
      }
      setIsLoadingReviews(true);
      try {
        const productReviews = await productReviewsApi.getByProductId(product.id);
        if (!isMounted) return;
        setReviews(productReviews);
        reviewsCache.set(product.id, { reviews: productReviews, timestamp: Date.now() });
      } catch (error) {
        console.error('Error loading reviews:', error);
        if (isMounted) setReviews([]);
      } finally {
        if (isMounted) setIsLoadingReviews(false);
      }
    };
    loadReviews();
    return () => { isMounted = false; };
  }, [product.id]);

  // Composition text
  const compositionText = activeVariant?.composition
    ? `${getLoc(activeVariant.composition)}\n\n${getLoc(activeVariant.care_instructions)}`
    : 'Materiais de alta qualidade. Acabamento artesanal.';

  // Breadcrumb schema for SEO
  const breadcrumbSchema = useMemo(() => {
    const productName = getLoc(product.name);
    return createBreadcrumbSchema([
      { name: 'Home', url: `${window.location.origin}/` },
      { name: 'Colecoes', url: `${window.location.origin}/colecoes` },
      { name: productName, url: window.location.href },
    ]);
  }, [product.name, getLoc]);

  // Accordion sections
  const accordionSections = [
    { id: 'desc', label: t('product.description'), content: getLoc(product.description) },
    { id: 'comp', label: t('product.composition'), content: compositionText }
  ];

  // Related products
  const relatedProducts = useMemo(() => {
    if (!products.length) return [];
    const modeFiltered = filterProductsForMode(products, userMode);
    const sameCategory = modeFiltered.filter(p => p.id !== product.id && p.category_id === product.category_id && p.is_active);
    if (sameCategory.length >= 5) return sameCategory.slice(0, 5);
    const otherProducts = modeFiltered.filter(p => p.id !== product.id && p.category_id !== product.category_id && p.is_active);
    return [...sameCategory, ...otherProducts].slice(0, 5);
  }, [products, product.id, product.category_id, userMode]);

  // Recently viewed products
  const recentlyViewedIds = useRecentlyViewed(product.id);
  const recentlyViewedProducts = useMemo(() => {
    if (!products.length || !recentlyViewedIds.length) return [];
    return recentlyViewedIds
      .map(id => products.find(p => p.id === id))
      .filter((p): p is Product => !!p && p.is_active)
      .slice(0, 5);
  }, [products, recentlyViewedIds]);

  return (
    <div className="relative w-full bg-paper">
      {/* Breadcrumb JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Visual Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="px-6 md:px-12 lg:px-16 pt-2 pb-1">
        <ol className="flex items-center gap-1.5 text-[11px] text-neutral-400">
          <li>
            <button onClick={onBack} className="hover:text-neutral-700 transition-colors">
              Home
            </button>
          </li>
          <li aria-hidden="true" className="select-none">&gt;</li>
          <li>
            <button onClick={onBack} className="hover:text-neutral-700 transition-colors cursor-pointer">Coleções</button>
          </li>
          <li aria-hidden="true" className="select-none">&gt;</li>
          <li aria-current="page" className="text-neutral-700 font-medium truncate max-w-[200px]">
            {getLoc(product.name)}
          </li>
        </ol>
      </nav>

      <div className="flex flex-col md:flex-row w-full min-h-screen">
        {/* Gallery Column */}
        <ImageGallery
          product={product}
          allImagesWithVariant={allImagesWithVariant}
          activeVariantId={activeVariant?.id}
          activeVariantColorName={activeVariant?.color_name}
          getLoc={getLoc}
          setZoomImgIndex={setZoomImgIndex}
          setIsZoomOpen={setIsZoomOpen}
          mobileGalleryRef={mobileGalleryRef}
          handleMobileScroll={handleMobileScroll}
          mobileActiveIdx={mobileActiveIdx}
          showFaceSwap={false}
          onFaceSwapClick={() => {}}
          hotspots={hotspots}
          onAddToCart={onAddToCart}
          onNavigateToProduct={onSelectProduct}
          locale={locale}
        />

        {/* Info Column */}
        <div className="w-full md:w-[40%] p-8 md:p-12 lg:p-16 bg-paper">
          <div className="md:sticky md:top-24 transition-all duration-700">
            <ProductInfo
              product={product}
              locale={locale}
              t={t}
              getLoc={getLoc}
              reviewsCount={reviews.length}
              rawPrice={rawPrice}
              finalPrice={finalPrice}
              activeCoupon={activeCoupon ?? null}
              stockQuantity={activeVariant?.stock_quantity}
            />

            <ProductVariants
              getLoc={getLoc}
              colors={colors}
              selectedColorHex={selectedColorHex}
              onSelectColor={setSelectedColorHex}
              activeColorName={activeVariant?.color_name}
              sizes={sizes}
              selectedSize={selectedSize}
              onSelectSize={setSelectedSize}
              activeSizeGuideImage={activeSizeGuideImage}
              onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
              isSelectedSizeAvailable={isSelectedSizeAvailable}
              showProvador={false}
              onOpenProvador={() => {}}
            />

            <div ref={actionsRef}>
              <ProductActions
                quantity={quantity}
                onDecrement={() => setQuantity(Math.max(1, quantity - 1))}
                onIncrement={incrementQuantity}
                maxQuantity={activeVariant?.stock_quantity || 0}
                onAddToCart={handleAddToCart}
                addDisabled={!activeVariant || activeVariant.stock_quantity === 0}
                addLabel={activeVariant?.stock_quantity === 0 ? t('product.outOfStock') : t('product.addToCart')}
                isWishlisted={isWishlisted}
                onToggleWishlist={onToggleWishlist}
                isShareOpen={isShareOpen}
                onToggleShare={() => setIsShareOpen(!isShareOpen)}
                linkCopied={linkCopied}
                onShare={handleShare}
              />
            </div>

            <ProductAccordions
              sections={accordionSections}
              openSection={openSection}
              onToggleSection={(id) => setOpenSection(openSection === id ? null : id)}
            />
          </div>
        </div>
      </div>

      {/* Related Products */}
      <RelatedProducts
        products={relatedProducts}
        userMode={userMode}
        locale={locale}
        coupons={coupons}
        wishlistIds={wishlistIds}
        onSelectProduct={onSelectProduct}
        onToggleWishlist={onToggleWishlistProduct}
        getLoc={getLoc}
        t={t}
      />

      {/* Recently Viewed Products */}
      {recentlyViewedProducts.length > 0 && (
        <RelatedProducts
          products={recentlyViewedProducts}
          userMode={userMode}
          locale={locale}
          coupons={coupons}
          wishlistIds={wishlistIds}
          onSelectProduct={onSelectProduct}
          onToggleWishlist={onToggleWishlistProduct}
          getLoc={getLoc}
          t={t}
          title="Vistos Recentemente"
        />
      )}

      {/* Presentation Section */}
      {product.presentation && getLoc(product.presentation) && (
        <PresentationSection
          content={getLoc(product.presentation)}
          isExpanded={isPresentationExpanded}
          onToggle={() => setIsPresentationExpanded(!isPresentationExpanded)}
        />
      )}

      {/* Reviews Section */}
      <div id="reviews" className="w-full bg-paper border-t border-neutral-100 pt-32 pb-40 px-8 md:px-24">
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

      {/* Size Guide Modal */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        imageUrl={activeSizeGuideImage}
        onClose={() => setIsSizeGuideOpen(false)}
      />

      {/* Zoom Modal */}
      <ZoomModal
        isOpen={isZoomOpen}
        images={allImagesWithVariant}
        displayImages={displayImages}
        currentIndex={zoomImgIndex}
        productName={getLoc(product.name)}
        onClose={() => setIsZoomOpen(false)}
        onNavigate={setZoomImgIndex}
      />

      {/* Mobile Sticky Bar */}
      <MobileStickyBar
        isVisible={showStickyBar}
        isWishlisted={isWishlisted}
        onToggleWishlist={onToggleWishlist}
        isShareOpen={isShareOpen}
        onToggleShare={() => setIsShareOpen(!isShareOpen)}
        linkCopied={linkCopied}
        onShare={handleShare}
        onBack={() => window.history.back()}
        onAddToCart={handleAddToCart}
        addToCartLabel={activeVariant?.stock_quantity === 0 ? t('product.outOfStock') : t('product.addToCart')}
        addToCartDisabled={!activeVariant || activeVariant.stock_quantity === 0}
      />
    </div>
  );
};

export default ProductDetail;
