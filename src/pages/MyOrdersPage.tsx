import React, { useEffect } from 'react';
import { ArrowLeft, ShoppingBag, Loader2, ChevronRight, Star, AlertTriangle } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';
import { SEOHead } from '../components/seo/SEOHead';
import { formatCurrency } from '../utils/currency';
import type { Locale } from '../i18n';
import type { AppView } from '../app/hooks/useNavigation';
import type { Order } from '../types';

interface MyOrdersPageProps {
  locale: Locale;
  onNavigate: (view: AppView) => void;
  onOpenAuth: () => void;
}

const STATUS_LABEL: Record<string, { label: string; dot: string }> = {
  pending:   { label: 'Aguardando confirmação', dot: 'bg-yellow-400' },
  confirmed: { label: 'Confirmado', dot: 'bg-blue-400' },
  processing:{ label: 'Em preparo', dot: 'bg-blue-500' },
  shipped:   { label: 'Enviado', dot: 'bg-indigo-500' },
  delivered: { label: 'Entregue', dot: 'bg-green-500' },
  cancelled: { label: 'Cancelado', dot: 'bg-red-500' },
};

function getStatus(status: string) {
  return STATUS_LABEL[status?.toLowerCase()] ?? { label: status, dot: 'bg-neutral-300' };
}

export function MyOrdersPage({ locale, onNavigate, onOpenAuth }: MyOrdersPageProps) {
  const { currentUser, isLoading: authLoading, userOrders, isLoadingOrders, refreshOrders } = useAuthContext();

  useEffect(() => {
    if (currentUser) {
      refreshOrders();
    }
  }, [currentUser, refreshOrders]);

  // Not logged in
  if (!authLoading && !currentUser) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center gap-6 px-6 text-center">
        <SEOHead title="Meus Pedidos — Auricapri" description="Histórico de pedidos Auricapri" />
        <ShoppingBag className="w-14 h-14 text-neutral-200" strokeWidth={1} />
        <div>
          <p className="text-xl font-black uppercase tracking-tighter mb-2">Meus Pedidos</p>
          <p className="text-sm text-neutral-500">Entre na sua conta para ver seu histórico de pedidos.</p>
        </div>
        <button
          onClick={onOpenAuth}
          className="px-8 py-3 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
        >
          Entrar
        </button>
        <button
          onClick={() => onNavigate('home')}
          className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors"
        >
          ← Voltar
        </button>
      </div>
    );
  }

  // Auth or orders loading
  if (authLoading || isLoadingOrders) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-300" strokeWidth={1.5} />
        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
          Carregando pedidos...
        </p>
      </div>
    );
  }

  const sorted = [...userOrders].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="min-h-screen bg-paper pb-20">
      <SEOHead title="Meus Pedidos — Auricapri" description="Histórico de pedidos Auricapri" />

      {/* Header */}
      <div className="sticky top-0 z-10 bg-paper border-b border-neutral-100 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => onNavigate('home')}
          className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-base font-black uppercase tracking-tighter">Meus Pedidos</h1>
          <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">
            {sorted.length} {sorted.length === 1 ? 'pedido' : 'pedidos'}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-4">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <ShoppingBag className="w-12 h-12 text-neutral-200" strokeWidth={1} />
            <p className="text-sm text-neutral-400">Você ainda não fez nenhum pedido.</p>
            <button
              onClick={() => onNavigate('home')}
              className="px-6 py-2 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all"
            >
              Explorar produtos
            </button>
          </div>
        ) : (
          sorted.map((order: Order) => {
            const s = getStatus(order.status);
            const isCancelled = order.status?.toLowerCase() === 'cancelled';
            const isDelivered = order.status?.toLowerCase() === 'delivered';

            return (
              <div
                key={order.id}
                className="bg-white rounded-[2rem] border border-neutral-100 p-6 hover:border-black transition-all cursor-pointer group"
                onClick={() => window.location.href = `/order-review/${order.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-sm font-semibold">
                      {new Date(order.created_at).toLocaleDateString(locale, {
                        day: '2-digit', month: 'long', year: 'numeric',
                      })}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                      <span className={`text-xs font-medium ${isCancelled ? 'text-red-600' : 'text-neutral-600'}`}>
                        {s.label}
                      </span>
                    </div>
                    {isCancelled && (
                      <div className="flex items-center gap-1.5 text-red-500 mt-1">
                        <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                        <span className="text-[10px] font-medium">Reembolso em processamento</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 pl-4">
                    <span className="text-lg font-black">{formatCurrency(order.total || 0, locale)}</span>
                    <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {isDelivered && (
                  <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                    <Star className="w-3.5 h-3.5" />
                    <span>Toque para avaliar este pedido</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
