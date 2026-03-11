import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Star } from 'lucide-react';
import { Order, OrderItemForReview, ProductReview } from '../types';
import { Locale } from '../i18n';
import { ProductReviewsApi } from '../api/product-reviews.api';
import { OrdersApi } from '../api/orders.api';
import { ProductReviewForm } from '../components/orders/ProductReviewForm';
import { ProductReviewsList } from '../components/orders/ProductReviewsList';
import { supabase } from '../utils/supabase';
import { formatCurrency } from '../utils/currency';
import { getOptimizedImageUrl } from '../utils/image';

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
  t: _t,
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
    if (typeof obj === 'string') {
      try {
        const parsed = JSON.parse(obj);
        if (typeof parsed === 'object' && parsed !== null) {
          return parsed[locale] || parsed['pt'] || parsed['en'] || Object.values(parsed)[0] || "";
        }
        return obj;
      } catch {
        return obj;
      }
    }
    if (typeof obj === 'object' && obj !== null) {
      return obj[locale] || obj['pt'] || obj['en'] || Object.values(obj)[0] || "";
    }
    return String(obj);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser({ id: session.user.id });
      }
    });
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
        const msg = String(err?.message || '');
        if (/not delivered/i.test(msg)) {
          setError('Este pedido ainda não foi entregue. Você só pode avaliar pedidos entregues.');
        } else {
          setError(msg || 'Erro ao carregar dados do pedido');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (orderId) {
      loadData();
    }
  }, [orderId, currentUser?.id]);

  const handleReviewSuccess = async (_review: ProductReview, _orderItemId: string) => {
    setEditingItem(null);
    const items = await reviewsApi.getOrderItemsForReview(orderId, currentUser?.id || order?.user_id || '');
    setOrderItems(items);
  };

  const handleEditReview = (orderItemId: string) => {
    setEditingItem(orderItemId);
  };

  if (isLoading) {
    return (
      <div className="w-full bg-paper flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-neutral-400" />
          <p className="text-sm text-neutral-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="w-full bg-paper flex items-center justify-center py-24 px-4">
        <div className="text-center max-w-md">
          <p className="text-lg font-medium mb-4 text-neutral-900">{error || 'Pedido não encontrado'}</p>
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-sm text-neutral-600 hover:text-black mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          )}
        </div>
      </div>
    );
  }

  const orderStatus = order.status?.toLowerCase();
  const isDelivered = orderStatus === 'delivered' || orderStatus === 'entregue';

  if (!isDelivered) {
    return (
      <div className="w-full bg-paper flex items-center justify-center py-24 px-4">
        <div className="text-center max-w-md">
          <p className="text-lg font-medium mb-4 text-neutral-900">
            Este pedido ainda não foi entregue. Você só pode avaliar pedidos entregues.
          </p>
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-sm text-neutral-600 hover:text-black mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          )}
        </div>
      </div>
    );
  }

  const pendingItems = orderItems.filter(item => !item.has_review);
  const reviewedItems = orderItems.filter(item => item.has_review);

  return (
    <div className="w-full bg-paper md:bg-neutral-100">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 pb-32">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-neutral-600 hover:text-black mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        )}

        <div className="bg-paper rounded-xl p-6 md:p-8 border border-neutral-200 shadow-sm mb-6">
          <h1 className="font-serif text-2xl font-bold mb-2">Avaliar Produtos do Pedido</h1>
          <p className="text-sm text-neutral-500 mb-6">
            Pedido #{order.id.slice(0, 8).toUpperCase()}
          </p>

          {pendingItems.length > 0 && (
            <div className="space-y-6 mb-8">
              <h2 className="text-lg font-semibold">Produtos Pendentes de Avaliação</h2>
              {pendingItems.map((item) => (
                <div key={item.order_item_id} className="border border-neutral-200 rounded-lg p-6">
                  {editingItem === item.order_item_id ? (
                    <ProductReviewForm
                      orderId={orderId}
                      orderItem={item}
                      existingReview={item.review}
                      onSuccess={(review) => handleReviewSuccess(review, item.order_item_id)}
                      onCancel={() => setEditingItem(null)}
                    />
                  ) : (
                    <div className="flex items-center gap-4">
                      <img
                        src={getOptimizedImageUrl(item.image, 'thumbnail')}
                        alt={getLoc(item.product_name)}
                        className="w-20 h-20 object-cover rounded-lg"
                        loading="lazy"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium">{getLoc(item.product_name)}</h3>
                        <p className="text-sm text-neutral-500">
                          {getLoc(item.variant_color)} | {item.variant_size}
                        </p>
                        <p className="text-xs text-neutral-400">Qtd: {item.quantity} • {formatCurrency(item.price * item.quantity, locale)}</p>
                      </div>
                      <button
                        onClick={() => setEditingItem(item.order_item_id)}
                        className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm font-medium"
                      >
                        <Star className="w-4 h-4" />
                        {item.has_review ? 'Editar' : 'Avaliar'}
                        {!item.has_review && storeConfig?.loyalty_program?.review_cashback_amount && storeConfig.loyalty_program.review_cashback_amount > 0 && (
                          <span className="text-xs bg-paper/20 px-2 py-0.5 rounded">
                            +{formatCurrency(storeConfig.loyalty_program.review_cashback_amount, locale)}
                          </span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {reviewedItems.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Produtos Avaliados</h2>
              {reviewedItems.map((item) => (
                <div key={item.order_item_id} className="border border-neutral-200 rounded-lg p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={getOptimizedImageUrl(item.image, 'thumbnail')}
                      alt={getLoc(item.product_name)}
                      className="w-16 h-16 object-cover rounded-lg"
                      loading="lazy"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium">{getLoc(item.product_name)}</h3>
                      <p className="text-sm text-neutral-500">
                        {getLoc(item.variant_color)} | {item.variant_size}
                      </p>
                    </div>
                    {item.review && (
                      <button
                        onClick={() => handleEditReview(item.order_item_id)}
                        className="text-sm text-neutral-600 hover:text-black"
                      >
                        Editar
                      </button>
                    )}
                  </div>
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
                </div>
              ))}
            </div>
          )}

          {pendingItems.length === 0 && reviewedItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-neutral-500">Nenhum produto encontrado neste pedido</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
