/**
 * SharedWishlistPage Component - React Native
 * Adapted from web version
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { WishlistApi } from '../api/wishlist.api';
import { ProductsApi } from '../api/products.api';
import { Product, CartItem } from '../types';
import { formatCurrency } from '../utils/currency';
import { Locale } from '../i18n';
import { UserMode } from '../types';
import { calculatePrice } from '../utils/product';
import { Loader2 } from '../components/ui/Icons';
// TODO: Import CheckoutView when created
// import CheckoutView from '../components/checkout/CheckoutView';

interface SharedWishlistPageProps {
  locale: Locale;
  t: (key: string) => any;
  userMode: UserMode;
  currentUser: any;
  onNavigate: (view: string) => void;
  slug: string;
}

const SharedWishlistPage: React.FC<SharedWishlistPageProps> = ({
  locale,
  t,
  userMode,
  currentUser,
  onNavigate,
  slug
}) => {
  const [wishlistData, setWishlistData] = useState<{ user_id: string; product_ids: string[] } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const wishlistApi = new WishlistApi();
  const productsApi = new ProductsApi();

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!slug) {
        setError('Slug inválido');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await wishlistApi.getSharedWishlist(slug);
        setWishlistData(data);

        // Fetch products (use getAllActive for public access, not getAll which requires admin)
        const allProducts = await productsApi.getAllActive();
        const wishlistProducts = allProducts.filter(p => data.product_ids.includes(p.id));
        setProducts(wishlistProducts);

        // Build cart items
        const items: CartItem[] = wishlistProducts.flatMap(product => {
          const variant = product.variants?.[0];
          if (!variant || variant.stock_quantity === 0) return [];

          return [{
            variant_id: variant.id,
            product_id: product.id,
            name: product.name,
            image: (variant.variant_images && variant.variant_images.length > 0)
              ? variant.variant_images[0]
              : (product.base_images && product.base_images.length > 0 ? product.base_images[0] : ''),
            size: variant.size || 'N/A',
            color_name: variant.color_name,
            color_hex: variant.color_hex || '#000',
            price: calculatePrice(variant, userMode),
            quantity: 1,
            sku: variant.sku
          }];
        });

        setCartItems(items);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar wishlist');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWishlist();
  }, [slug, userMode]);

  const getLoc = (obj: any): string => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'object') {
      return obj[locale] || obj['pt'] || obj['en'] || '';
    }
    return String(obj);
  };

  const handleBuyAll = () => {
    if (!currentUser) {
      Alert.alert('Atenção', 'Você precisa estar logado para comprar');
      return;
    }
    // TODO: Implement checkout when CheckoutView is available
    // setShowCheckout(true);
    Alert.alert('Info', 'Checkout será implementado quando CheckoutView estiver disponível');
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Loader2 size={32} color="#A3A3A3" />
          <Text style={styles.loadingText}>Carregando wishlist...</Text>
        </View>
      </View>
    );
  }

  if (error || !wishlistData) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Text style={styles.errorIconText}>?</Text>
          </View>
          <Text style={styles.errorTitle}>Wishlist Não Encontrada</Text>
          <Text style={styles.errorMessage}>
            {error || 'A wishlist que você está procurando não existe ou foi removida.'}
          </Text>
          <Text style={styles.errorHint}>
            Verifique se o link está correto ou entre em contato com quem compartilhou.
          </Text>
          <TouchableOpacity
            onPress={() => onNavigate('home')}
            style={styles.backButton}
          >
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // TODO: Show checkout when CheckoutView is available
  // if (showCheckout) {
  //   return (
  //     <CheckoutView
  //       cartItems={cartItems}
  //       onPlaceOrder={handlePlaceOrder}
  //       onBack={() => setShowCheckout(false)}
  //       t={t}
  //       locale={locale}
  //       currentUser={currentUser}
  //     />
  //   );
  // }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Wishlist Compartilhada</Text>
        <Text style={styles.subtitle}>
          Compre todos os itens desta wishlist como presente
        </Text>
      </View>

      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Esta wishlist está vazia</Text>
        </View>
      ) : (
        <>
          <View style={styles.productsGrid}>
            {products.map(product => {
              const variant = product.variants?.[0];
              const price = variant
                ? calculatePrice(variant, userMode)
                : 0;
              const image = variant?.variant_images?.[0] || product.base_images?.[0] || '';

              return (
                <View key={product.id} style={styles.productCard}>
                  <View style={styles.productImageContainer}>
                    <Image
                      source={{ uri: image }}
                      style={styles.productImage}
                    />
                  </View>
                  <Text style={styles.productName} numberOfLines={2}>
                    {getLoc(product.name)}
                  </Text>
                  <Text style={styles.productPrice}>{formatCurrency(price, locale)}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.buyAllContainer}>
            <TouchableOpacity
              onPress={handleBuyAll}
              disabled={!currentUser || cartItems.length === 0}
              style={[
                styles.buyAllButton,
                (!currentUser || cartItems.length === 0) && styles.buyAllButtonDisabled
              ]}
            >
              <Text style={styles.buyAllButtonText}>
                {currentUser ? 'Comprar Todos os Itens' : 'Faça login para comprar'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    padding: 24,
    paddingTop: 96,
    paddingBottom: 48,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#737373',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    maxWidth: 448,
    alignSelf: 'center',
  },
  errorIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  errorIconText: {
    fontSize: 48,
    fontWeight: '300',
    color: '#A3A3A3',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: -1,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    fontWeight: '400',
    color: '#737373',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  errorHint: {
    fontSize: 12,
    fontWeight: '400',
    color: '#A3A3A3',
    textAlign: 'center',
    marginBottom: 32,
  },
  backButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: '#000000',
    borderRadius: 16,
  },
  backButtonText: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#FFFFFF',
  },
  header: {
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: -2,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#737373',
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#A3A3A3',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 48,
    gap: 24,
  },
  productCard: {
    width: '47%',
    marginBottom: 24,
  },
  productImageContainer: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  productName: {
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '300',
    letterSpacing: -1,
  },
  buyAllContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  buyAllButton: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    backgroundColor: '#000000',
    borderRadius: 16,
  },
  buyAllButtonDisabled: {
    opacity: 0.5,
  },
  buyAllButtonText: {
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#FFFFFF',
  },
});

export default SharedWishlistPage;

