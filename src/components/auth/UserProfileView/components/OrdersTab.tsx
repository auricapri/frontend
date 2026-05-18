/// Orders Tab Component
/// Displays order history with review buttons

import React from 'react';
import { Loader2, ShoppingBag, ChevronRight, Star, DollarSign, RotateCcw } from 'lucide-react';
import { Order } from '../../../../types';
import { Locale } from '../../../../i18n';
import { formatCurrency } from '../../../../utils/currency';
import { OrdersState } from '../types';

const STATUS_LABEL_PT: Record<string, string> = {
  pending: 'Aguardando pagamento',
  confirmed: 'Pagamento confirmado',
  paid: 'Pagamento confirmado',
  awaiting_pickup: 'Aguardando coleta',
  collected: 'Em trânsito',
  processing: 'Em preparação',
  shipped: 'A caminho',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

function statusLabel(status: string | undefined | null): string {
  if (!status) return 'Status indisponível';
  return STATUS_LABEL_PT[status.toLowerCase()] ?? status;
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
        const hasReview = orderReviews[order.id] || false;

        return (
          <div
            key={order.id}
            className="p-6 sm:p-8 bg-paper-50 rounded-[2.5rem] border border-neutral-100 group hover:border-black transition-all"
          >
            <div
              onClick={() => onSelectOrder(order)}
              className="flex justify-between items-center cursor-pointer"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
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
                <h4 className="text-sm font-black font-serif uppercase tracking-tight italic">
                  {new Date(order.created_at).toLocaleDateString(locale)}
                </h4>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isCancelled
                        ? 'bg-neutral-400'
                        : isDelivered
                        ? 'bg-green-500'
                        : 'bg-orange-400'
                    }`}
                  />
                  <span
                    className={`text-[10px] font-black uppercase tracking-widest ${
                      isCancelled ? 'text-neutral-500' : 'text-neutral-600'
                    }`}
                  >
                    {statusLabel(order.status)}
                  </span>
                </div>
              </div>
              <div className="text-right flex items-center gap-3 sm:gap-6 flex-shrink-0">
                <span className="text-lg sm:text-xl font-light tracking-tighter whitespace-nowrap">
                  {formatCurrency(order.total || 0, locale)}
                </span>
                <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

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
                    className="w-full flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm font-medium"
                  >
                    <span className="flex items-center gap-2">
                      <Star className="w-4 h-4 flex-shrink-0" />
                      Avaliar Pedido
                    </span>
                    {storeConfig?.loyalty_program?.review_cashback_amount &&
                      storeConfig.loyalty_program.review_cashback_amount > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-xs bg-paper/20 px-2 py-0.5 rounded whitespace-nowrap">
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
          className="w-full flex items-center justify-center gap-3 py-4 border border-neutral-200 rounded-[2rem] hover:bg-neutral-50 transition-all text-[10px] font-black uppercase tracking-widest group"
        >
          <RotateCcw className="w-4 h-4 group-hover:rotate-[-45deg] transition-transform" />
          Minhas Devoluções
        </button>
      </div>
    </div>
  );
};
