/**
 * CollectionDetail Component - React Native
 * Adapted from web version
 */

import React, { useMemo } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, ArrowLeft } from '../ui';
import { Collection, Product, UserMode, Category } from '../../types';
import { Locale } from '../../i18n';
import { formatCurrency } from '../../utils/currency';
import { calculatePrice, filterProductsForMode } from '../../utils/product';

const { width } = Dimensions.get('window');

interface CollectionDetailProps {
  collection: Collection;
  products: Product[];
  categories: Category[];
  userMode: UserMode;
  onSelectProduct: (product: Product) => void;
  wishlistIds: string[];
  onToggleWishlist: (id: string) => void;
  onBack: () => void;
  locale: Locale;
}

const CollectionDetail: React.FC<CollectionDetailProps> = ({
  collection,
  products,
  categories,
  userMode,
  onSelectProduct,
  wishlistIds,
  onToggleWishlist,
  onBack,
  locale,
}) => {
  const insets = useSafeAreaInsets();
  const getLoc = (obj: any): string => {
    if (obj === null || obj === undefined) return "";
    
    if (typeof obj === 'string') {
      if (obj.trim().startsWith('{') || obj.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(obj);
          return getLoc(parsed);
        } catch (e) {
          return obj;
        }
      }
      return obj;
    }

    if (typeof obj === 'object') {
      const val = obj[locale] || obj['pt'] || obj['en'] || obj['es'] || obj['fr'];
      if (typeof val === 'string') return val;
      
      const firstString = Object.values(obj).find(v => typeof v === 'string');
      return (firstString as string) || "";
    }
    
    return String(obj);
  };

  const collectionProducts = useMemo(() => {
    if (!collection?.id) return [];
    // First filter by mode (atacado filters variants with stock < 10)
    const modeFiltered = filterProductsForMode(products, userMode);
    return modeFiltered.filter(p => {
      const ids = p.collection_ids || [];
      return ids.some(id => String(id) === String(collection.id));
    });
  }, [products, collection.id, userMode]);

  const getProductPrice = (product: Product): number => {
    const mainVariant = product.variants?.[0];
    if (!mainVariant) return 0;
    return calculatePrice(mainVariant, userMode);
  };

  const getProductImage = (product: Product): string => {
    return product.default_image_url || (Array.isArray(product.base_images) && product.base_images.length > 0 ? product.base_images[0] : '');
  };

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: Platform.OS === 'ios' ? insets.top : 0 }}
    >
      {/* Banner Section */}
      <View style={styles.bannerContainer}>
        <Image source={{ uri: collection.image_url }} style={styles.bannerImage as any} />
        <View style={styles.bannerOverlay} />
        
        {/* Back Button Overlay */}
        <View style={styles.backButtonContainer}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ArrowLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.bannerContent}>
          <Text style={styles.bannerLabel}>Coleção Exclusiva</Text>
          <Text style={styles.bannerTitle}>{getLoc(collection.name)}</Text>
          {collection.description && (
            <Text style={styles.bannerDescription}>{getLoc(collection.description)}</Text>
          )}
        </View>
      </View>

      {/* Products Grid */}
      <View style={styles.productsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>
            {collectionProducts.length} Peças Curadas
          </Text>
        </View>

        {collectionProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum produto nesta coleção ainda.</Text>
          </View>
        ) : (
          <View style={styles.productsGrid}>
            {collectionProducts.map(p => {
              const price = getProductPrice(p);
              const displayImg = getProductImage(p);
              const isWishlisted = wishlistIds.includes(p.id);
              
              return (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => onSelectProduct(p)}
                  style={styles.productCard}
                >
                  <View style={styles.productImageContainer}>
                    <Image source={{ uri: displayImg }} style={styles.productImage as any} />
                    <TouchableOpacity
                      onPress={() => onToggleWishlist(p.id)}
                      style={styles.wishlistButton}
                    >
                      <Heart filled={isWishlisted} size={16} color={isWishlisted ? '#EF4444' : '#737373'} strokeWidth={1.5} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.productInfo}>
                    <View style={styles.productTextInfo}>
                      <Text style={styles.productName} numberOfLines={2}>
                        {getLoc(p.name)}
                      </Text>
                      {categories && (
                        <Text style={styles.productCategory}>
                          {getLoc(categories.find(c => c.id === p.category_id)?.name)}
                        </Text>
                      )}
                    </View>
                    <View style={styles.productPriceContainer}>
                      <Text style={styles.productPrice}>
                        {formatCurrency(price || 0, locale)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  bannerContainer: {
    width: '100%',
    height: Platform.OS === 'web' ? 480 : width * 1.2,
    backgroundColor: '#171717',
    position: 'relative',
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.8,
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  backButtonContainer: {
    position: 'absolute',
    top: 96,
    left: 24,
    zIndex: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 8,
  },
  backText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 4.8,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  bannerContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 32,
    paddingBottom: 80,
    zIndex: 10,
  },
  bannerLabel: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 9.6,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 16,
  },
  bannerTitle: {
    fontSize: 48,
    fontWeight: '300',
    textTransform: 'uppercase',
    letterSpacing: -2,
    lineHeight: 41,
    color: '#FFFFFF',
    marginBottom: 32,
  },
  bannerDescription: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: 'rgba(255, 255, 255, 0.8)',
    maxWidth: 672,
  },
  productsSection: {
    paddingHorizontal: 24,
    paddingVertical: 96,
  },
  sectionHeader: {
    marginBottom: 64,
    paddingBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 4.8,
    color: '#737373',
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: (width - 48 - 48) / 2,
    marginBottom: 24,
  },
  productImageContainer: {
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
    resizeMode: 'cover',
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
  },
  productInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productTextInfo: {
    flex: 1,
    marginRight: 8,
  },
  productName: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#171717',
    marginBottom: 4,
    lineHeight: 16,
  },
  productCategory: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#737373',
  },
  productPriceContainer: {
    alignItems: 'flex-end',
  },
  productPrice: {
    fontSize: 11,
    fontWeight: '900',
    color: '#171717',
    letterSpacing: -0.5,
  },
});

export default CollectionDetail;
