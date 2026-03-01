/// Order Detail Overlay Component
/// Full-screen overlay showing order details and tracking

import React from 'react';
import { ArrowLeft, X, Truck, Download } from 'lucide-react';
import { Order } from '../../../../types';
import { Locale } from '../../../../i18n';
import { formatCurrency } from '../../../../utils/currency';
import { GetLocFn } from '../types';

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
  const getTrackProgress = (status?: string) => {
    const s = status?.toLowerCase();
    if (s === 'delivered' || s === 'entregue') return '100%';
    if (s === 'shipped' || s === 'enviado') return '60%';
    return '15%';
  };

  return (
    <div className="absolute inset-0 z-20 bg-white flex flex-col animate-in slide-in-from-right duration-500">
      {/* Header */}
      <header className="h-24 px-8 flex items-center justify-between border-b border-neutral-100">
        <button
          onClick={onClose}
          className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-black"
        >
          <ArrowLeft className="w-4 h-4" /> {t('nav.back')}
        </button>
        <h4 className="text-sm font-black uppercase tracking-tight italic">
          Pedido {order.id.slice(0, 8)}
        </h4>
        <button onClick={onClose} className="p-3 bg-neutral-50 rounded-full">
          <X className="w-4 h-4" />
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 no-scrollbar space-y-12">
        {/* Tracking Card */}
        <div className="bg-neutral-50 p-8 rounded-[2.5rem] border border-neutral-100 space-y-8">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-black text-white rounded-2xl">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                {t('auth.tracking')}
              </span>
              <p className="text-sm font-black uppercase tracking-tight">
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
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-neutral-400">
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

        {/* Order Items */}
        <div className="space-y-6">
          <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-300 px-2">
            Itens do Pedido
          </h5>
          {(order.items || []).map(item => (
            <div
              key={item.id}
              className="flex items-center gap-6 p-4 rounded-3xl border border-neutral-50 hover:border-neutral-200 transition-all"
            >
              <img
                src={item.image}
                className="w-16 h-20 object-cover rounded-xl flex-none bg-neutral-100"
                alt=""
              />
              <div className="flex-1">
                <h6 className="text-[11px] font-black uppercase tracking-tight">
                  {getLoc(item.name)}
                </h6>
                <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-widest mt-1">
                  {getLoc(item.color_name)} | {item.size}
                </p>
                <p className="text-[10px] font-black mt-1">Qtd: {item.quantity}</p>
              </div>
              <div className="flex flex-col items-end gap-3">
                <span className="text-sm font-black tracking-tighter">
                  {formatCurrency(item.price * item.quantity, locale)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Total and Receipt */}
        <div className="pt-8 border-t border-neutral-100 space-y-6">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-neutral-400">
            <span>Total Pago</span>
            <span className="text-xl text-black font-light tracking-tighter">
              {formatCurrency(order.total || 0, locale)}
            </span>
          </div>

          <button
            onClick={onViewReceipt}
            className="w-full py-5 border border-neutral-200 rounded-[2rem] flex items-center justify-center gap-3 hover:bg-neutral-50 transition-all text-[10px] font-black uppercase tracking-widest group"
          >
            <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Baixar Comprovante Fiscal
          </button>
        </div>
      </div>
    </div>
  );
};
