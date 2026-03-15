/// Order Detail Overlay Component
/// Full-screen overlay showing order details and tracking

import React from 'react';
import { ArrowLeft, X, Truck, Download, AlertTriangle } from 'lucide-react';
import { Order } from '../../../../types';
import { Locale } from '../../../../i18n';
import { formatCurrency } from '../../../../utils/currency';
import { GetLocFn } from '../types';
import { getOptimizedImageUrl } from '../../../../utils/image';
import { useAuthContext } from '../../../../context/AuthContext';

interface OrderDetailOverlayProps {
  order: Order;
  locale: Locale;
  t: (key: string) => any;
  getLoc: GetLocFn;
  onClose: () => void;
  onViewReceipt: () => void;
}

export const OrderDetailOverlay: React.FC<OrderDetailOverlayProps> = ({
  order,
  locale,
  t,
  getLoc,
  onClose,
  onViewReceipt,
}) => {
  const { currentUser } = useAuthContext();
  const isCancelled = order.status?.toLowerCase() === 'cancelled';

  const getTrackProgress = (status?: string) => {
    const s = status?.toLowerCase();
    if (s === 'delivered' || s === 'entregue') return '100%';
    if (s === 'shipped' || s === 'enviado') return '60%';
    return '15%';
  };

  return (
    <div className="absolute inset-0 z-20 bg-paper flex flex-col animate-in slide-in-from-right duration-500">
      {/* Header */}
      <header className="h-24 px-8 flex items-center justify-between border-b border-neutral-100">
        <button
          onClick={onClose}
          className="flex items-center gap-3 text-sm font-medium text-neutral-400 hover:text-black"
        >
          <ArrowLeft className="w-4 h-4" /> {t('nav.back')}
        </button>
        <h4 className="text-sm font-semibold">
          Pedido {order.id.slice(0, 8)}
        </h4>
        <button onClick={onClose} className="p-3 bg-neutral-50 rounded-full">
          <X className="w-4 h-4" />
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 no-scrollbar space-y-12">
        {/* Status Card: cancellation notice or tracking */}
        {isCancelled ? (
          <div className="bg-red-50 border border-red-200 p-8 rounded-[2.5rem] space-y-5">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-red-100 rounded-2xl flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <span className="text-xs font-medium text-red-400">
                  Status do Pedido
                </span>
                <p className="text-sm font-semibold text-red-700 mt-0.5">
                  Cancelado e Reembolsado
                </p>
              </div>
            </div>
            <p className="text-sm text-red-700 leading-relaxed">
              Seu pedido foi cancelado e o valor pago será reembolsado automaticamente. Um de nossos colaboradores entrará em contato em breve
              {currentUser?.email ? <> pelo <strong>e-mail {currentUser.email}</strong></> : ''}
              {currentUser?.email && currentUser?.phone ? ' e' : ''}
              {currentUser?.phone ? <> pelo <strong>WhatsApp {currentUser.phone}</strong></> : ''}
              {' '}para esclarecimentos.
            </p>
          </div>
        ) : (
          <div className="bg-neutral-50 p-8 rounded-[2.5rem] border border-neutral-100 space-y-8">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-black text-white rounded-2xl">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-medium text-neutral-500">
                  {t('auth.tracking')}
                </span>
                <p className="text-sm font-semibold">
                  {order.tracking_code || 'Aguardando Despacho'}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-2 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className="absolute inset-0 bg-black transition-all duration-1000"
                style={{ width: getTrackProgress(order.status) }}
              />
            </div>

            {/* Progress Labels */}
            <div className="flex justify-between text-xs font-medium text-neutral-400">
              <span>Processando</span>
              <span
                className={
                  order.status === 'shipped' || order.status === 'delivered' ? 'text-black' : ''
                }
              >
                Enviado
              </span>
              <span className={order.status === 'delivered' ? 'text-black' : ''}>Entregue</span>
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="space-y-6">
          <h5 className="text-xs font-semibold text-neutral-400 px-2">
            Itens do Pedido
          </h5>
          {(order.items || []).map(item => (
            <div
              key={item.id}
              className="flex items-center gap-6 p-4 rounded-3xl border border-neutral-50 hover:border-neutral-200 transition-all"
            >
              <img
                src={getOptimizedImageUrl(item.image, 'thumbnail')}
                className="w-16 h-20 object-cover rounded-xl flex-none bg-neutral-100"
                alt=""
                loading="lazy"
                decoding="async"
              />
              <div className="flex-1">
                <h6 className="text-sm font-semibold">
                  {getLoc(item.name)}
                </h6>
                <p className="text-xs text-neutral-400 mt-1">
                  {getLoc(item.color_name)} | {item.size}
                </p>
                <p className="text-xs font-medium text-neutral-500 mt-1">Qtd: {item.quantity}</p>
              </div>
              <div className="flex flex-col items-end gap-3">
                <span className="text-sm font-semibold">
                  {formatCurrency(item.price * item.quantity, locale)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Total and Receipt */}
        <div className="pt-8 border-t border-neutral-100 space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-neutral-500">Total Pago</span>
            <span className="text-xl text-black font-semibold">
              {formatCurrency(order.total || 0, locale)}
            </span>
          </div>

          <button
            onClick={onViewReceipt}
            className="w-full py-5 border border-neutral-200 rounded-[2rem] flex items-center justify-center gap-3 hover:bg-neutral-50 transition-all text-sm font-medium group"
          >
            <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Baixar Comprovante Fiscal
          </button>
        </div>
      </div>
    </div>
  );
};
