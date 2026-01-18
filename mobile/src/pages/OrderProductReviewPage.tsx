/**
 * OrderProductReviewPage - React Native
 * Page for reviewing products from an order
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { ArrowLeft, Loader2, Star } from '../components/ui/Icons';
import { Order, OrderItemForReview, ProductReview } from '../types';
import { Locale } from '../i18n';
import { ProductReviewsApi } from '../api/product-reviews.api';
import { OrdersApi } from '../api/orders.api';
import { ProductReviewForm } from '../components/orders/ProductReviewForm';
import { ProductReviewsList } from '../components/orders/ProductReviewsList';
import { supabase } from '../utils/supabase';
import { formatCurrency } from '../utils/currency';

interface OrderProductReviewPageProps {
  orderId: string;
  onBack?: () => void;
  t: (key: string) => any;
  locale: Locale;
  storeConfig?: any;
}

export const OrderProductReviewPage: React.FC<OrderProductReviewPageProps> = ({
  orderId,
  onBack,
  t,
  locale,
  storeConfig
}) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItemForReview[]>([]);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const ordersApi = new OrdersApi();
  const reviewsApi = new ProductReviewsApi();

  const getLoc = (obj: any): string => {
    if (!obj) return "";
    if (typeof obj === 'string') return obj;
    return obj[locale] || obj['pt'] || obj['en'] || Object.values(obj)[0] || "";
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUser({ id: session.user.id });
        }
      } catch {
        setCurrentUser(null);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const orderData = await ordersApi.getByIdForReview(orderId);
        if (!orderData) {
          setError('Pedido não encontrado');
          setIsLoading(false);
          return;
        }

        setOrder(orderData);

        const orderStatus = orderData.status?.toLowerCase();
        const isDelivered = orderStatus === 'delivered' || orderStatus === 'entregue';

        if (!isDelivered) {
          setError('Este pedido ainda não foi entregue. Você só pode avaliar pedidos entregues.');
          setIsLoading(false);
          return;
        }

        const userId = currentUser?.id || orderData.user_id;
        if (!userId) {
          setError('Usuário não identificado');
          setIsLoading(false);
          return;
        }

        const items = await reviewsApi.getOrderItemsForReview(orderId, userId);
        setOrderItems(items);
      } catch (err: any) {
        console.error('Error loading order review data:', err);
        setError(err.message || 'Erro ao carregar dados do pedido');
      } finally {
        setIsLoading(false);
      }
    };

    if (orderId) {
      loadData();
    }
  }, [orderId, currentUser?.id]);

  const handleReviewSuccess = async (review: ProductReview, orderItemId: string) => {
    setEditingItem(null);
    const items = await reviewsApi.getOrderItemsForReview(orderId, currentUser?.id || order?.user_id || '');
    setOrderItems(items);
  };

  const handleEditReview = (orderItemId: string) => {
    setEditingItem(orderItemId);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Loader2 size={32} color="#A3A3A3" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Pedido não encontrado'}</Text>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ArrowLeft size={20} color="#737373" />
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const orderStatus = order.status?.toLowerCase();
  const isDelivered = orderStatus === 'delivered' || orderStatus === 'entregue';

  if (!isDelivered) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Este pedido ainda não foi entregue. Você só pode avaliar pedidos entregues.
        </Text>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ArrowLeft size={20} color="#737373" />
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const pendingItems = orderItems.filter(item => !item.has_review);
  const reviewedItems = orderItems.filter(item => item.has_review);

  return (
    <View style={styles.container}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.headerBack}>
          <ArrowLeft size={20} color="#737373" />
          <Text style={styles.headerBackText}>Voltar</Text>
        </TouchableOpacity>
      )}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Avaliar Produtos do Pedido</Text>
          <Text style={styles.subtitle}>
            Pedido #{order.id.slice(0, 8).toUpperCase()}
          </Text>

          {pendingItems.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Produtos Pendentes de Avaliação</Text>
              {pendingItems.map((item) => (
                <View key={item.order_item_id} style={styles.itemCard}>
                  {editingItem === item.order_item_id ? (
                    <ProductReviewForm
                      orderId={orderId}
                      orderItem={item}
                      existingReview={item.review}
                      onSuccess={(review) => handleReviewSuccess(review, item.order_item_id)}
                      onCancel={() => setEditingItem(null)}
                    />
                  ) : (
                    <View style={styles.itemRow}>
                      <Image 
                        source={{ uri: item.image }} 
                        style={styles.itemImage}
                      />
                      <View style={styles.itemDetails}>
                        <Text style={styles.itemName}>{getLoc(item.product_name)}</Text>
                        <Text style={styles.itemVariant}>
                          {getLoc(item.variant_color)} | {item.variant_size}
                        </Text>
                        <Text style={styles.itemPrice}>
                          Qtd: {item.quantity} • {formatCurrency(item.price * item.quantity, locale)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => setEditingItem(item.order_item_id)}
                        style={styles.reviewButton}
                      >
                        <Star size={16} color="#FFFFFF" />
                        <Text style={styles.reviewButtonText}>
                          {item.has_review ? 'Editar' : 'Avaliar'}
                        </Text>
                        {!item.has_review && storeConfig?.loyalty_program?.review_cashback_amount && storeConfig.loyalty_program.review_cashback_amount > 0 && (
                          <Text style={styles.cashbackBadge}>
                            +{formatCurrency(storeConfig.loyalty_program.review_cashback_amount, locale)}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {reviewedItems.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Produtos Avaliados</Text>
              {reviewedItems.map((item) => (
                <View key={item.order_item_id} style={styles.itemCard}>
                  <View style={styles.itemRow}>
                    <Image 
                      source={{ uri: item.image }} 
                      style={styles.itemImageSmall}
                    />
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemName}>{getLoc(item.product_name)}</Text>
                      <Text style={styles.itemVariant}>
                        {getLoc(item.variant_color)} | {item.variant_size}
                      </Text>
                    </View>
                    {item.review && (
                      <TouchableOpacity
                        onPress={() => handleEditReview(item.order_item_id)}
                        style={styles.editButton}
                      >
                        <Text style={styles.editButtonText}>Editar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {item.review && editingItem === item.order_item_id ? (
                    <ProductReviewForm
                      orderId={orderId}
                      orderItem={item}
                      existingReview={item.review}
                      onSuccess={(review) => handleReviewSuccess(review, item.order_item_id)}
                      onCancel={() => setEditingItem(null)}
                    />
                  ) : item.review ? (
                    <ProductReviewsList
                      reviews={[item.review]}
                      currentUserId={currentUser?.id || order.user_id}
                      onEdit={() => handleEditReview(item.order_item_id)}
                    />
                  ) : null}
                </View>
              ))}
            </View>
          )}

          {pendingItems.length === 0 && reviewedItems.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhum produto encontrado neste pedido</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerBack: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  headerBackText: {
    fontSize: 14,
    color: '#737373',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#737373',
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  itemCard: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  itemImageSmall: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemVariant: {
    fontSize: 12,
    color: '#737373',
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 11,
    color: '#A3A3A3',
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  reviewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cashbackBadge: {
    fontSize: 10,
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  editButton: {
    padding: 8,
  },
  editButtonText: {
    fontSize: 14,
    color: '#737373',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#737373',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
    color: '#000000',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    fontSize: 14,
    color: '#737373',
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#737373',
  },
});

export default OrderProductReviewPage;

