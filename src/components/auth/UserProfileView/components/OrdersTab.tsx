/// Orders Tab Component
/// Displays order history with review buttons

import React, { useState, useCallback } from 'react';
import { Loader2, ShoppingBag, ChevronRight, Star, DollarSign, RotateCcw, AlertTriangle, CreditCard, Clock } from 'lucide-react';
import { Order } from '../../../../types';
import { useAuthContext } from '../../../../context/AuthContext';
import { Locale } from '../../../../i18n';
import { formatCurrency } from '../../../../utils/currency';
import { OrdersState } from '../types';
import { ChangePaymentModal } from '../../../orders/ChangePaymentModal';
import { useOrderCountdown } from '../../../../hooks/useOrderCountdown';

interface OrderCountdownBadgeProps {
  expiresAt: string | null | undefined;
}

function OrderCountdownBadge({ expiresAt }: OrderCountdownBadgeProps) {
  const { label, isExpired, isUrgent } = useOrderCountdown(expiresAt);

  if (!expiresAt) return null;

  return (
    <div
      className={`flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg text-xs font-medium w-fit ${
        isExpired
          ? 'bg-red-100 text-red-700'
          : isUrgent
          ? 'bg-orange-100 text-orange-700 animate-pulse'
          : 'bg-neutral-100 text-neutral-600'
      }`}
    >
      <Clock className="w-3.5 h-3.5 flex-shrink-0" />
      {isExpired ? 'Pagamento expirado' : `Expira em ${label}`}
    </div>
  );
}

interface OrdersTabProps {
  ordersState: OrdersState;
  locale: Locale;
  t: (key: string) => any;
  storeConfig?: any;
  onSelectOrder: (order: Order) => void;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({
  ordersState,
  locale,
  t,
  storeConfig,
  onSelectOrder,
}) => {
  const { orders, loading, orderReviews } = ordersState;
  const { currentUser } = useAuthContext();
  const [changePaymentOrder, setChangePaymentOrder] = useState<Order | null>(null);

  const handleChangePaymentSuccess = useCallback(() => {
    setChangePaymentOrder(null);
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-neutral-300 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin" strokeWidth={1} />
        <span className="text-[10px] font-black uppercase tracking-widest">
          Carregando Histórico...
        </span>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="py-20 text-center space-y-6">
        <ShoppingBag className="w-12 h-12 text-neutral-100 mx-auto" />
        <p className="text-sm text-neutral-400 font-medium">{t('auth.noOrders')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {orders.map(order => {
        const orderStatus = order.status?.toLowerCase();
        const isDelivered = orderStatus === 'delivered' || orderStatus === 'entregue';
        const isCancelled = orderStatus === 'cancelled';
        const isPending = orderStatus === 'pending';
        const hasReview = orderReviews[order.id] || false;

        return (
          <div
            key={order.id}
            className="p-8 bg-neutral-50 rounded-[2.5rem] border border-neutral-100 group hover:border-black transition-all"
          >
            <div
              onClick={() => onSelectOrder(order)}
              className="flex justify-between items-center cursor-pointer"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-neutral-400">
                    ID: {order.id.slice(0, 8)}
                  </span>
                  {order.wishlist_slug && (
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full">
                      Wishlist
                    </span>
                  )}
                  {order.gift_from_user_id && (
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">
                      Presente
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-semibold">
                  {new Date(order.created_at).toLocaleDateString(locale)}
                </h4>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isCancelled ? 'bg-red-500' : isDelivered ? 'bg-green-500' : 'bg-orange-400'
                    }`}
                  />
                  <span className={`text-xs font-medium ${isCancelled ? 'text-red-600' : 'text-neutral-600'}`}>
                    {isCancelled ? 'Cancelado' : order.status}
                  </span>
                </div>

                {isCancelled && (
                  <div className="flex items-center gap-2 mt-2 text-red-600">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-xs font-medium">Cancelado e reembolsado — toque para detalhes</span>
                  </div>
                )}
              </div>
              <div className="text-right flex items-center gap-6">
                <span className="text-xl font-semibold">
                  {formatCurrency(order.total || 0, locale)}
                </span>
                <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Countdown + Change Payment — Pending Orders */}
            {isPending && (
              <div className="mt-4 pt-4 border-t border-neutral-200 space-y-3">
                <OrderCountdownBadge expiresAt={order.expires_at} />
                {currentUser && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setChangePaymentOrder(order);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors text-sm font-medium"
                  >
                    <CreditCard className="w-4 h-4" />
                    Trocar meio de pagamento
                  </button>
                )}
              </div>
            )}

            {/* Review Section for Delivered Orders */}
            {isDelivered && (
              <div className="mt-4 pt-4 border-t border-neutral-200">
                {hasReview ? (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      window.location.href = `/order-review/${order.id}`;
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200 transition-colors text-sm font-medium"
                  >
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    Editar Avaliação
                  </button>
                ) : (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      window.location.href = `/order-review/${order.id}`;
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm font-medium relative"
                  >
                    <Star className="w-4 h-4" />
                    <span>Avaliar Pedido</span>
                    {storeConfig?.loyalty_program?.review_cashback_amount &&
                      storeConfig.loyalty_program.review_cashback_amount > 0 && (
                        <span className="ml-auto flex items-center gap-1 text-xs bg-paper/20 px-2 py-0.5 rounded">
                          <DollarSign className="w-3 h-3" />+
                          {formatCurrency(storeConfig.loyalty_program.review_cashback_amount, locale)}
                        </span>
                      )}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Returns link */}
      <div className="pt-6 border-t border-neutral-100">
        <button
          onClick={() => {
            window.history.pushState({ view: 'my-returns' }, '', '/my-returns');
            window.location.href = '/my-returns';
          }}
          className="w-full flex items-center justify-center gap-3 py-4 border border-neutral-200 rounded-[2rem] hover:bg-neutral-50 transition-all text-sm font-medium group"
        >
          <RotateCcw className="w-4 h-4 group-hover:rotate-[-45deg] transition-transform" />
          Minhas Devolucoes
        </button>
      </div>

      {changePaymentOrder && currentUser && (
        <ChangePaymentModal
          order={changePaymentOrder}
          currentUser={currentUser}
          locale={locale}
          onClose={() => setChangePaymentOrder(null)}
          onSuccess={handleChangePaymentSuccess}
        />
      )}
    </div>
  );
};
