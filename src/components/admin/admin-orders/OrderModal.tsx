/**
 * Order Detail Modal
 */
import React from 'react';
import { X, Clock, CheckCircle2 } from 'lucide-react';
import { OrderStatus } from '../../../constants/enums';
import {
  CustomerInfo,
  ConfirmationStage,
  ExpeditionStage,
  TransitStage,
  OrderItems,
  FinancialSummary,
} from './modal-sections';
import { formatDate } from './helpers';
import type { OrderModalProps } from './types';

export const OrderModal: React.FC<OrderModalProps> = ({
  order,
  economics,
  logistics,
  customerData,
  loadingCustomer,
  isDocGenerated,
  isGeneratingLabel,
  trackingInput,
  locale,
  onClose,
  onTrackingChange,
  onGenerateDoc,
  onDispatch,
  onApprove,
  onReject,
  getLoc,
}) => {
  return (
    <div className="fixed inset-0 z-[1200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-6xl h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <header className="h-24 px-8 md:px-12 flex items-center justify-between border-b border-neutral-100 bg-white flex-none">
          <div className="flex items-center gap-6">
            <div
              className={`p-3 rounded-full ${
                order.status === OrderStatus.PENDING
                  ? 'bg-yellow-100 text-yellow-600'
                  : 'bg-green-100 text-green-600'
              }`}
            >
              {order.status === OrderStatus.PENDING ? (
                <Clock className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
            <div>
              <h4 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
                Pedido #{order.id.slice(0, 8).toUpperCase()}
                <span className="text-[9px] px-3 py-1 bg-neutral-100 rounded-full font-bold text-neutral-500 uppercase tracking-widest">
                  {order.status}
                </span>
              </h4>
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                {formatDate(order.created_at, locale)} • {order.items.length} Itens
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-4 bg-neutral-50 rounded-full hover:bg-neutral-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* LEFT COL: Operational */}
          <div className="w-full md:w-[60%] p-8 md:p-12 overflow-y-auto no-scrollbar space-y-10 bg-neutral-50/30">
            {/* Customer Info */}
            {order.user_id && (
              <CustomerInfo
                userId={order.user_id}
                customerData={customerData}
                loadingCustomer={loadingCustomer}
              />
            )}

            {/* Confirmation Stage (Pending) */}
            {order.status === OrderStatus.PENDING && (
              <ConfirmationStage onApprove={onApprove} onReject={onReject} />
            )}

            {/* Expedition Stage (Confirmed) */}
            {order.status === OrderStatus.CONFIRMED && (
              <ExpeditionStage
                order={order}
                logistics={logistics}
                isDocGenerated={isDocGenerated}
                isGeneratingLabel={isGeneratingLabel}
                trackingInput={trackingInput}
                onTrackingChange={onTrackingChange}
                onGenerateDoc={onGenerateDoc}
                onDispatch={onDispatch}
              />
            )}

            {/* Transit/Delivered Stage */}
            {(order.status === OrderStatus.SHIPPED ||
              order.status === OrderStatus.DELIVERED) && (
              <TransitStage order={order} />
            )}

            {/* Order Items */}
            <OrderItems items={order.items} getLoc={getLoc} locale={locale} />
          </div>

          {/* RIGHT COL: Financials */}
          <FinancialSummary economics={economics} locale={locale} />
        </div>
      </div>
    </div>
  );
};
