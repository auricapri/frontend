/// ReturnRequestForm Component
/// Allows customers to request returns for recent orders

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, CheckCircle, Loader2, Package, AlertCircle } from 'lucide-react';
import { Order, OrderItem } from '../../types';
import { ReturnsApi, Return } from '../../api/returns.api';
import { OrdersApi } from '../../api/orders.api';
import type { Locale } from '../../i18n';
import { formatCurrency } from '../../utils/currency';

const RETURN_REASONS = [
  { value: 'wrong_size', label: 'Tamanho errado' },
  { value: 'not_liked', label: 'Nao gostei' },
  { value: 'defect', label: 'Defeito' },
  { value: 'changed_mind', label: 'Mudei de ideia' },
  { value: 'other', label: 'Outro' },
] as const;

interface ReturnRequestFormProps {
  locale: Locale;
  onBack: () => void;
  onSuccess?: () => void;
}

interface SelectedItem {
  variant_id: string;
  product_id: string;
  name: string;
  size: string;
  quantity: number;
}

export const ReturnRequestForm: React.FC<ReturnRequestFormProps> = ({
  locale,
  onBack,
  onSuccess,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Return | null>(null);
  const [error, setError] = useState('');

  const getLoc = useCallback((obj: any): string => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'object') {
      return obj[locale] || obj['pt'] || obj['en'] || '';
    }
    return String(obj);
  }, [locale]);

  // Fetch recent orders (last 7 days, delivered/shipped only)
  useEffect(() => {
    const fetchOrders = async () => {
      setLoadingOrders(true);
      try {
        const ordersApi = new OrdersApi();
        const allOrders = await ordersApi.getAll();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentOrders = allOrders.filter(order => {
          const orderDate = new Date(order.created_at);
          const status = order.status?.toLowerCase();
          return (
            orderDate >= sevenDaysAgo &&
            (status === 'delivered' || status === 'entregue' || status === 'shipped' || status === 'enviado')
          );
        });

        setOrders(recentOrders);
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchOrders();
  }, []);

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  const handleToggleItem = (itemId: string) => {
    setSelectedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedOrderId) {
      setError('Selecione um pedido.');
      return;
    }

    const itemIds = Object.entries(selectedItems)
      .filter(([_, checked]) => checked)
      .map(([id]) => id);

    if (itemIds.length === 0) {
      setError('Selecione pelo menos um item para devolucao.');
      return;
    }

    if (!reason) {
      setError('Selecione um motivo.');
      return;
    }

    setSubmitting(true);
    try {
      const returnsApi = new ReturnsApi();
      const items: SelectedItem[] = (selectedOrder?.items || [])
        .filter(item => selectedItems[item.id || item.variant_id || item.product_id])
        .map(item => ({
          variant_id: item.variant_id || '',
          product_id: item.product_id,
          name: getLoc(item.name),
          size: item.size,
          quantity: item.quantity,
        }));

      const returnData = await returnsApi.create({
        order_id: selectedOrderId,
        reason,
        metadata: {
          items,
          details: details.trim() || undefined,
        },
      });

      setResult(returnData);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Erro ao solicitar devolucao. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // Success state
  if (result) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <header className="sticky top-0 z-10 bg-white border-b border-neutral-100">
          <div className="w-full px-4 py-4 flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xs font-bold uppercase tracking-[0.15em]">
              Solicitacao Enviada
            </h1>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center space-y-8">
          <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-black" />
          </div>
          <div className="space-y-3">
            <h2 className="text-lg font-black uppercase tracking-tight">
              Devolucao Solicitada
            </h2>
            <p className="text-sm text-neutral-500 max-w-sm">
              Sua solicitacao foi enviada com sucesso. Acompanhe o status pelo codigo RMA abaixo.
            </p>
          </div>
          {result.rma_code && (
            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl px-8 py-6 space-y-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">
                Codigo RMA
              </span>
              <p className="text-xl font-black tracking-tight">{result.rma_code}</p>
            </div>
          )}
          <button
            onClick={onBack}
            className="mt-4 px-10 py-4 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-colors"
          >
            Voltar
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 bg-white border-b border-neutral-100">
        <div className="w-full px-4 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xs font-bold uppercase tracking-[0.15em]">
            Solicitar Devolucao
          </h1>
        </div>
      </header>

      <main className="w-full px-4 py-8 max-w-lg mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Order selection */}
          <section className="space-y-3">
            <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 block">
              Selecione o Pedido
            </label>
            {loadingOrders ? (
              <div className="py-8 flex items-center justify-center text-neutral-300">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : orders.length === 0 ? (
              <div className="py-8 text-center space-y-4">
                <Package className="w-10 h-10 text-neutral-200 mx-auto" />
                <p className="text-sm text-neutral-400">
                  Nenhum pedido elegivel para devolucao nos ultimos 7 dias.
                </p>
              </div>
            ) : (
              <select
                value={selectedOrderId}
                onChange={e => {
                  setSelectedOrderId(e.target.value);
                  setSelectedItems({});
                }}
                className="w-full p-4 border border-neutral-200 rounded-xl text-sm bg-white focus:border-black focus:outline-none transition-colors appearance-none"
              >
                <option value="">Escolha um pedido...</option>
                {orders.map(order => (
                  <option key={order.id} value={order.id}>
                    #{order.id.slice(0, 8).toUpperCase()} — {new Date(order.created_at).toLocaleDateString(locale)} — {formatCurrency(order.total || 0, locale)}
                  </option>
                ))}
              </select>
            )}
          </section>

          {/* Item selection */}
          {selectedOrder && (
            <section className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 block">
                Itens para Devolver
              </label>
              <div className="space-y-3">
                {(selectedOrder.items || []).map(item => {
                  const itemKey = item.id || item.variant_id || item.product_id;
                  return (
                    <label
                      key={itemKey}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                        selectedItems[itemKey]
                          ? 'border-black bg-neutral-50'
                          : 'border-neutral-100 hover:border-neutral-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!!selectedItems[itemKey]}
                        onChange={() => handleToggleItem(itemKey)}
                        className="w-4 h-4 accent-black"
                      />
                      <img
                        src={item.image}
                        alt=""
                        className="w-12 h-16 object-cover rounded-lg flex-none bg-neutral-100"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black uppercase tracking-tight truncate">
                          {getLoc(item.name)}
                        </p>
                        <p className="text-[9px] text-neutral-400 uppercase tracking-widest mt-0.5">
                          {getLoc(item.color_name)} | {item.size} | Qtd: {item.quantity}
                        </p>
                      </div>
                      <span className="text-xs font-black tracking-tighter flex-none">
                        {formatCurrency(item.price * item.quantity, locale)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>
          )}

          {/* Reason selection */}
          {selectedOrder && (
            <section className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 block">
                Motivo
              </label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full p-4 border border-neutral-200 rounded-xl text-sm bg-white focus:border-black focus:outline-none transition-colors appearance-none"
              >
                <option value="">Selecione o motivo...</option>
                {RETURN_REASONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </section>
          )}

          {/* Details (optional) */}
          {selectedOrder && (
            <section className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 block">
                Detalhes (Opcional)
              </label>
              <textarea
                value={details}
                onChange={e => setDetails(e.target.value)}
                placeholder="Descreva mais detalhes sobre a devolucao..."
                rows={3}
                className="w-full p-4 border border-neutral-200 rounded-xl text-sm bg-white focus:border-black focus:outline-none transition-colors resize-none"
              />
            </section>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-none" />
              {error}
            </div>
          )}

          {/* Submit */}
          {selectedOrder && (
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Solicitar Devolucao'
              )}
            </button>
          )}
        </form>
      </main>
    </div>
  );
};

export default ReturnRequestForm;
