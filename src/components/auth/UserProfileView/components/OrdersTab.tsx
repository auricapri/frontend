/// Orders Tab Component
/// Displays order history with review buttons

import React from 'react';
import { Loader2, ShoppingBag, ChevronRight, Star, DollarSign, RotateCcw } from 'lucide-react';
import { Order } from '../../../../types';
import { Locale } from '../../../../i18n';
import { formatCurrency } from '../../../../utils/currency';
import { getOptimizedImageUrl } from '../../../../utils/image';
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
      <div className="py-20 flex flex-col items-center justify-center text-neutral-500 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin" strokeWidth={1} />
        <span className="text-[10px] font-black uppercase tracking-[0.4em]">
          Carregando histórico
        </span>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="py-20 text-center space-y-6">
        <ShoppingBag className="w-12 h-12 text-neutral-300 mx-auto" strokeWidth={1} />
        <p className="text-sm text-neutral-500 font-medium">{t('auth.noOrders')}</p>
        <button
          onClick={() => { window.location.href = '/'; }}
          className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-black text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] hover:bg-neutral-800 transition-all active:scale-95"
        >
          Explorar coleção
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between pb-2">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-500">
          Meus Pedidos
        </span>
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">
          {orders.length} {orders.length === 1 ? 'pedido' : 'pedidos'}
        </span>
      </div>
      {orders.map(order => {
        const orderStatus = order.status?.toLowerCase();
        const isDelivered = orderStatus === 'delivered' || orderStatus === 'entregue';
        const isCancelled = orderStatus === 'cancelled';
        const hasReview = orderReviews[order.id] || false;

        return (
          <div
            key={order.id}
            className="p-4 sm:p-6 bg-paper rounded-[2rem] border border-neutral-100 group hover:border-black transition-all"
          >
            <div
              onClick={() => onSelectOrder(order)}
              className="flex justify-between items-start gap-4 cursor-pointer"
            >
              {/* Product Image Preview */}
              {order.items?.[0] && (
                <div className="flex-none">
                  <img
                    src={getOptimizedImageUrl(order.items[0].image, 'thumbnail')}
                    className="w-20 h-24 sm:w-24 sm:h-32 object-cover rounded-2xl bg-neutral-100"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }}
                  />
                </div>
              )}

              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">
                    Nº {order.id.slice(0, 8).toUpperCase()}
                  </span>
                  {order.wishlist_slug && (
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full border border-purple-100">
                      Wishlist
                    </span>
                  )}
                  {order.gift_from_user_id && (
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                      Presente
                    </span>
                  )}
                </div>
                <h4 className="text-sm sm:text-base font-serif text-neutral-800 leading-tight">
                  {new Date(order.created_at).toLocaleDateString(locale, {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </h4>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full flex-none ${
                      isCancelled
                        ? 'bg-neutral-400'
                        : isDelivered
                        ? 'bg-emerald-500'
                        : 'bg-amber-500'
                    }`}
                  />
                  <span
                    className={`text-[10px] font-black uppercase tracking-[0.3em] leading-snug ${
                      isCancelled ? 'text-neutral-500' : 'text-neutral-700'
                    }`}
                  >
                    {statusLabel(order.status)}
                  </span>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-2 flex-shrink-0">
                <span className="text-lg sm:text-xl font-serif text-neutral-900 whitespace-nowrap">
                  {formatCurrency(order.total || 0, locale)}
                </span>
                <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-black group-hover:translate-x-1 transition-all" />
              </div>
            </div>

            {/* Review Section for Delivered Orders */}
            {isDelivered && (
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-neutral-200">
                {hasReview ? (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      window.location.href = `/order-review/${order.id}`;
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 sm:py-3 bg-neutral-100 text-neutral-600 rounded-2xl hover:bg-neutral-200 transition-colors text-xs sm:text-sm font-medium"
                  >
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                    Editar Avaliação
                  </button>
                ) : (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      window.location.href = `/order-review/${order.id}`;
                    }}
                    className="w-full flex flex-col sm:flex-row sm:flex-wrap items-center justify-center gap-2 sm:gap-x-2 sm:gap-y-1 px-3 sm:px-4 py-3 sm:py-4 bg-black text-white rounded-2xl hover:bg-neutral-800 transition-colors text-xs sm:text-sm font-medium"
                  >
                    <span className="flex items-center gap-2 whitespace-nowrap">
                      <Star className="w-4 h-4 flex-shrink-0" />
                      Avaliar Pedido
                    </span>
                    {storeConfig?.loyalty_program?.review_cashback_amount &&
                      storeConfig.loyalty_program.review_cashback_amount > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-xs bg-paper/20 px-2 py-0.5 rounded whitespace-nowrap flex-shrink-0">
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
            window.location.href = '/my-returns';
          }}
          className="w-full flex items-center justify-center gap-3 py-4 border border-neutral-200 rounded-[2rem] hover:bg-neutral-50 hover:border-black transition-all text-[10px] font-black uppercase tracking-[0.4em] text-neutral-600 group"
        >
          <RotateCcw className="w-4 h-4 group-hover:rotate-[-45deg] transition-transform" />
          Minhas Devoluções
        </button>
      </div>
    </div>
  );
};
