/**
 * ProductGrid Component - React Native
 * Adapted from web version - simplified version
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions, Animated, ScrollView, Platform } from 'react-native';
import { Heart, ArrowLeft, ArrowRight, Filter as FilterIcon } from '../ui';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { rp as responsivePx } from '../../utils/responsive';
import { useAnimatedEntry } from '../../hooks/useAnimatedEntry';
import { Product, UserMode, Category, Collection, Coupon } from '../../types';
import { Locale } from '../../i18n';
import { formatCurrency } from '../../utils/currency';
import { calculatePrice, filterProductsForMode } from '../../utils/product';
import { rp, scaleFont, getColumns } from '../../utils/responsive';

const { width } = Dimensions.get('window');
const ITEMS_PER_PAGE = 12;

// Product Card Component with animation
const ProductCardComponent: React.FC<{ 
  item: Product; 
  index: number; 
  isWishlisted: boolean; 
  price: number; 
  image: string; 
  category: Category | undefined; 
  onSelectProduct: (product: Product) => void; 
  onToggleWishlist: (id: string) => void; 
  getLoc: (obj: any) => string; 
  formatCurrency: (amount: number, locale: Locale) => string; 
  locale: Locale;
  styles: any;
}> = ({ item, index, isWishlisted, price, image, category, onSelectProduct, onToggleWishlist, getLoc, formatCurrency, locale, styles }) => {
  const animatedStyle = useAnimatedEntry({ delay: index * 50, duration: 700, offsetY: 16 });
  
  // Heart animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const heartFillAnim = useRef(new Animated.Value(isWishlisted ? 1 : 0)).current;
  const useNativeDriver = Platform.OS !== 'web';

  // Update fill animation when wishlist state changes
  useEffect(() => {
    Animated.timing(heartFillAnim, {
      toValue: isWishlisted ? 1 : 0,
      duration: 300,
      useNativeDriver,
    }).start();
  }, [isWishlisted, heartFillAnim]);

  const handleHeartPress = () => {
    // Scale animation with spring effect
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.3,
        tension: 300,
        friction: 3,
        useNativeDriver,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 300,
        friction: 4,
        useNativeDriver,
      }),
    ]).start();

    onToggleWishlist(item.id);
  };

  return (
    <Animated.View style={[styles.productCard, animatedStyle]}>
      <TouchableOpacity
        onPress={() => onSelectProduct(item)}
        style={styles.productCardInner}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.productImage} />
          <TouchableOpacity
            onPress={handleHeartPress}
            style={styles.wishlistButton}
            activeOpacity={1}
          >
            <Animated.View
              style={[
                styles.heartContainer,
                {
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {/* Filled heart (red) */}
              <Animated.View style={[styles.heartFilled, { opacity: heartFillAnim }]}>
                <Heart filled={true} size={16} color="#EF4444" strokeWidth={1.5} />
              </Animated.View>
              {/* Outline heart (gray) */}
              <Animated.View style={[styles.heartOutline, { opacity: heartFillAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
                <Heart filled={false} size={16} color="#737373" strokeWidth={1.5} />
              </Animated.View>
            </Animated.View>
          </TouchableOpacity>
        </View>
        <View style={styles.productInfo}>
          <View style={styles.productTextContainer}>
            <Text style={styles.productName} numberOfLines={2}>
              {getLoc(item.name)}
            </Text>
            {category ? (
              <Text style={styles.productCategory}>
                {getLoc(category.name)}
              </Text>
            ) : null}
          </View>
          <View style={styles.productPriceContainer}>
            <Text style={styles.productPrice}>{formatCurrency(price, locale)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

interface ProductGridProps {
  products: Product[];
  categories: Category[];
  collections: Collection[];
  coupons?: Coupon[];
  userMode: UserMode;
  onSelectProduct: (product: Product) => void;
  onSelectCollection: (collection: Collection) => void;
  wishlistIds: string[];
  onToggleWishlist: (id: string) => void;
  t: (key: string) => string;
  locale: Locale;
  isLoading?: boolean;
  scrollViewRef?: React.RefObject<ScrollView>;
  onScrollToFilters?: () => void;
  onScrollToProducts?: (position: number) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  categories,
  collections,
  coupons = [],
  userMode,
  onSelectProduct,
  onSelectCollection,
  wishlistIds,
  onToggleWishlist,
  t,
  locale,
  isLoading,
  scrollViewRef,
  onScrollToFilters,
  onScrollToProducts,
}) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const filtersContainerRef = useRef<View>(null);
  const filtersYPosition = useRef<number>(0);
  const productsGridAnchorRef = useRef<View>(null);
  const productsGridYPosition = useRef<number>(0);
  const firstProductRef = useRef<View>(null);
  const firstProductYPosition = useRef<number>(0);

  // Scroll to filters function - goes to filters or first product
  const scrollToFilters = useCallback(() => {
    if (scrollViewRef?.current) {
      // Use filters position, or first product position if filters not available
      const targetY = filtersYPosition.current > 0 
        ? filtersYPosition.current - 100 // Offset for navbar
        : firstProductYPosition.current - 100;
      
      scrollViewRef.current.scrollTo({
        y: Math.max(0, targetY),
        animated: true,
      });
    }
    if (onScrollToFilters) {
      onScrollToFilters();
    }
  }, [scrollViewRef, onScrollToFilters]);

  // Scroll to first product
  const scrollToProducts = useCallback(() => {
    if (scrollViewRef?.current && firstProductYPosition.current > 0) {
      scrollViewRef.current.scrollTo({
        y: Math.max(0, firstProductYPosition.current - 100), // Offset for navbar
        animated: true,
      });
    }
    if (onScrollToProducts) {
      onScrollToProducts(firstProductYPosition.current);
    }
  }, [scrollViewRef, onScrollToProducts]);

  const handleFilterClick = (categoryName: string) => {
    setActiveCategory(categoryName);
    setCurrentPage(1);
    // Scroll to filters after category change
    setTimeout(scrollToFilters, 100);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // Scroll to first product after page change
    setTimeout(scrollToProducts, 100);
  };

  const getLoc = (obj: any): string => {
    if (obj === null || obj === undefined) return '';
    if (typeof obj === 'string') {
      if (obj.trim().startsWith('{')) {
        try {
          return getLoc(JSON.parse(obj));
        } catch {
          return obj;
        }
      }
      return obj;
    }
    if (typeof obj === 'object') {
      const val = obj[locale] || obj['pt'] || obj['en'] || obj['es'] || obj['fr'];
      if (typeof val === 'string') return val;
      const first = Object.values(obj).find(v => typeof v === 'string');
      const result = (first as string) || '';
      return result;
    }
    const stringResult = String(obj);
    return stringResult;
  };

  const filteredProducts = useMemo(() => {
    // First filter by mode (atacado filters variants with stock < 10)
    const modeFiltered = filterProductsForMode(products, userMode);
    
    if (activeCategory === 'All') return modeFiltered;
    return modeFiltered.filter(p => {
      const category = categories.find(c => c.id === p.category_id);
      return category && getLoc(category.name) === activeCategory;
    });
  }, [products, categories, activeCategory, locale, userMode]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  const getProductPrice = (product: Product): number => {
    const variant = product.variants?.[0];
    if (!variant) return 0;
    return calculatePrice(variant, userMode);
  };

  const getProductImage = (product: Product): string => {
    if (product.base_images && product.base_images.length > 0) {
      return product.base_images[0];
    }
    return product.default_image_url || '';
  };


  const renderProduct = ({ item, index }: { item: Product; index: number }) => {
    const isWishlisted = wishlistIds.includes(item.id);
    const price = getProductPrice(item);
    const image = getProductImage(item);
    const category = categories.find(c => c.id === item.category_id);

    return (
      <ProductCardComponent
        key={item.id || `product-card-${index}`}
        item={item}
        index={index}
        isWishlisted={isWishlisted}
        price={price}
        image={image}
        category={category}
        onSelectProduct={onSelectProduct}
        onToggleWishlist={onToggleWishlist}
        getLoc={getLoc}
        formatCurrency={formatCurrency}
        locale={locale}
        styles={styles}
      />
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>{t('grid.highlights')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Collections Section */}
      {collections.length > 0 && (
        <View style={styles.collectionsSection}>
          <View style={styles.collectionsHeader}>
            <Text style={styles.collectionsTitle}>{t('nav.collection')}</Text>
            <Text style={styles.collectionsSubtitle}>{t('grid.curated')}</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.collectionsList}
            snapToInterval={width * 0.7 + 24}
            snapToAlignment="start"
            decelerationRate="fast"
          >
            {collections.map((coll) => {
              const collImageUrl = typeof coll.image_url === 'string' 
                ? coll.image_url 
                : coll.image_url?.[locale] || coll.image_url?.['pt'] || '';
              
              return (
                <TouchableOpacity
                  key={coll.id}
                  onPress={() => onSelectCollection(coll)}
                  style={styles.collectionCard}
                >
                  <Image 
                    source={{ uri: collImageUrl }} 
                    style={styles.collectionImage}
                  />
                  <View style={styles.collectionOverlay}>
                    <Text style={styles.collectionName}>{getLoc(coll.name)}</Text>
                    <View style={styles.collectionLine} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Anchor for scrolling to products grid (after collections section) */}
      <View 
        ref={productsGridAnchorRef}
        style={styles.anchor}
        onLayout={(e) => {
          // Store the Y position relative to ScrollView content
          productsGridYPosition.current = e.nativeEvent.layout.y;
          // Notify parent of the position
          if (onScrollToProducts) {
            onScrollToProducts(e.nativeEvent.layout.y);
          }
        }}
      />

      <View style={styles.header}>
        <Text style={styles.title}>{t('grid.highlights')}</Text>
        <Text style={styles.subtitle}>{t('grid.curated')}</Text>
      </View>

      {/* Category Filter + Filters button */}
      <View 
        ref={filtersContainerRef}
        style={styles.filterContainer}
        onLayout={(e) => {
          // Store the Y position of filters relative to ScrollView content
          filtersYPosition.current = e.nativeEvent.layout.y;
        }}
      >
        <View style={styles.filterHeaderRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterList}
            nestedScrollEnabled={true}
          >
            {['All', ...categories.map(c => getLoc(c.name))].map((item, index) => (
              <TouchableOpacity
                key={`${item}-${index}`}
                onPress={() => handleFilterClick(item)}
                style={[
                  styles.filterButton,
                  activeCategory === item && styles.filterButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    activeCategory === item && styles.filterTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.openFiltersButton}
            onPress={() => setIsFiltersOpen(true)}
            activeOpacity={0.8}
          >
            <FilterIcon size={14} color="#0F172A" />
            <Text style={styles.openFiltersText}>{t('grid.filter')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Products Grid */}
      <View
        ref={firstProductRef}
        onLayout={(e) => {
          // Store the Y position of products grid relative to ScrollView content
          firstProductYPosition.current = e.nativeEvent.layout.y;
        }}
        style={styles.grid}
      >
        {paginatedProducts.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('grid.noItems')}</Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {Array.from({ length: Math.ceil(paginatedProducts.length / getColumns(2, 2, 2, 2)) }).map((_, rowIndex) => {
              const startIndex = rowIndex * getColumns(2, 2, 2, 2);
              const rowItems = paginatedProducts.slice(startIndex, startIndex + getColumns(2, 2, 2, 2));
              return (
                <View key={`row-${rowIndex}`} style={styles.row}>
                  {rowItems.map((item, colIndex) => renderProduct({ item, index: startIndex + colIndex }))}
                  {/* Fill remaining columns with empty space */}
                  {Array.from({ length: getColumns(2, 2, 2, 2) - rowItems.length }).map((_, emptyIndex) => (
                    <View key={`empty-${rowIndex}-${emptyIndex}`} style={styles.productCard} />
                  ))}
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Pagination */}
      {totalPages > 1 ? (
        <View style={styles.pagination}>
          <TouchableOpacity
            onPress={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
          >
            <ArrowLeft size={16} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.pageInfo}>
            {String(t('grid.page') || '')} {String(currentPage)} {String(t('grid.of') || '')} {String(totalPages)}
          </Text>
          <TouchableOpacity
            onPress={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            style={[
              styles.pageButton,
              currentPage === totalPages && styles.pageButtonDisabled,
            ]}
          >
            <ArrowRight size={16} color="#000000" />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Filters Modal - shares visual model with web */}
      <Modal
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        title={t('grid.filter')}
        size="md"
      >
        <View style={styles.filtersModalContent}>
          <View style={styles.filtersSection}>
            <View style={styles.filtersSectionHeader}>
              <View style={styles.filtersIconWrapper}>
                <FilterIcon size={16} color="#0F172A" />
              </View>
              <Text style={styles.filtersSectionTitle}>{t('grid.filterBySize')}</Text>
            </View>
            <View style={styles.filtersPillsRow}>
              {['P', 'M', 'G', 'GG'].map(size => (
                <View key={size} style={styles.filtersPill}>
                  <Text style={styles.filtersPillText}>{size}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Placeholder sections for price and sort, matching structure */}
          <View style={styles.filtersSection}>
            <View style={styles.filtersSectionHeader}>
              <View style={styles.filtersIconWrapper}>
                <FilterIcon size={16} color="#0F172A" />
              </View>
              <Text style={styles.filtersSectionTitle}>{t('grid.filterByPrice')}</Text>
            </View>
          </View>

          <View style={styles.filtersSection}>
            <View style={styles.filtersSectionHeader}>
              <View style={styles.filtersIconWrapper}>
                <FilterIcon size={16} color="#0F172A" />
              </View>
              <Text style={styles.filtersSectionTitle}>{t('grid.sortBy')}</Text>
            </View>
          </View>

          <View style={styles.filtersFooterRow}>
            <Button variant="ghost" size="sm" onPress={() => setIsFiltersOpen(false)}>
              {t('grid.clearFilters')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onPress={() => setIsFiltersOpen(false)}
            >
              {t('grid.applyFilters')}
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: rp(32),
    paddingHorizontal: 0,
    backgroundColor: '#FFFFFF',
  },
  collectionsSection: {
    marginBottom: rp(40),
    paddingHorizontal: rp(16),
  },
  collectionsHeader: {
    marginBottom: 24,
  },
  collectionsTitle: {
    fontSize: scaleFont(24, 0.5),
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: -1,
    marginBottom: rp(6),
  },
  collectionsSubtitle: {
    fontSize: scaleFont(9, 0.3),
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: scaleFont(9, 0.3) * 0.36,
    color: '#737373',
  },
  collectionsList: {
    paddingRight: 24,
    gap: 24,
  },
  collectionCard: {
    width: width * 0.7,
    aspectRatio: 16 / 9,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FAFAFA',
    marginRight: 24,
    position: 'relative',
  },
  collectionImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  collectionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  collectionName: {
    fontSize: 20,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: 4,
    color: '#FFFFFF',
  },
  collectionLine: {
    width: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginTop: 8,
  },
  header: {
    marginBottom: rp(24),
    alignItems: 'center',
    paddingHorizontal: rp(16),
  },
  title: {
    fontSize: scaleFont(20, 0.5),
    fontWeight: '300',
    marginBottom: rp(6),
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: scaleFont(11, 0.3),
    color: '#737373',
    textAlign: 'center',
  },
  anchor: {
    width: '100%',
    height: 1,
  },
  filterContainer: {
    marginBottom: rp(24),
  },
  filterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: rp(16),
  },
  filterList: {
    paddingHorizontal: 4,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  filterText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    color: '#737373',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  openFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsivePx(12),
    paddingVertical: responsivePx(8),
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 3,
  },
  openFiltersText: {
    marginLeft: 6,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    color: '#0F172A',
  },
  filtersModalContent: {
    gap: responsivePx(16),
  },
  filtersSection: {
    borderRadius: 24,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: responsivePx(16),
    paddingVertical: responsivePx(14),
  },
  filtersSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsivePx(8),
  },
  filtersIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  filtersSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  filtersPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  filtersPill: {
    minWidth: 44,
    height: 32,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersPillText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  filtersFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: responsivePx(8),
  },
  grid: {
    paddingBottom: rp(24),
    paddingHorizontal: rp(16),
  },
  gridContainer: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    gap: rp(24),
    marginBottom: rp(64),
  },
  productCard: {
    flex: 1,
    minWidth: 0, // Allow flex to shrink below content size
  },
  productCardInner: {
    width: '100%',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 3 / 4,
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FAFAFA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  productImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FAFAFA',
  },
  wishlistButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    overflow: 'hidden',
  },
  heartContainer: {
    position: 'relative',
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartFilled: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  heartOutline: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  productInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  productName: {
    fontSize: scaleFont(10, 0.3),
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: scaleFont(10, 0.3) * 0.2,
    marginBottom: rp(3),
    lineHeight: scaleFont(10, 0.3) * 1.5,
  },
  productCategory: {
    fontSize: scaleFont(9, 0.3),
    color: '#737373',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: scaleFont(9, 0.3) * 0.22,
  },
  productPriceContainer: {
    alignItems: 'flex-end',
  },
  productPrice: {
    fontSize: scaleFont(10, 0.3),
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  empty: {
    paddingVertical: 64,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#737373',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 32,
  },
  pageButton: {
    padding: 8,
  },
  pageButtonDisabled: {
    opacity: 0.3,
  },
  pageInfo: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  loadingText: {
    fontSize: 24,
    fontWeight: '300',
    textAlign: 'center',
    paddingVertical: 64,
  },
});

export default ProductGrid;
