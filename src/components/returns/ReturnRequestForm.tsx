/// ReturnRequestForm Component
/// Allows customers to request returns for recent orders

import React, { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, Loader2, Package, AlertCircle } from 'lucide-react';
import { Order, OrderItem } from '../../types';
import { Return } from '../../api/returns.api';
import { ordersApi, returnsApi } from '../../api/instances';
import type { Locale } from '../../i18n';
import { formatCurrency } from '../../utils/currency';
import { getOptimizedImageUrl } from '../../utils/image';

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
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [result, setResult] = useState<Return | null>(null);
  const [formError, setFormError] = useState('');

  const getLoc = useCallback((obj: unknown): string => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'object') {
      const o = obj as Record<string, string>;
      return o[locale] || o['pt'] || o['en'] || '';
    }
    return String(obj);
  }, [locale]);

  const { data: orders = [], isLoading: loadingOrders } = useQuery<Order[]>({
    queryKey: ['orders', 'returnable'],
    queryFn: async () => {
      const allOrders = await ordersApi.getAll();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return allOrders.filter((order) => {
        const orderDate = new Date(order.created_at);
        const status = order.status?.toLowerCase();
        return (
          orderDate >= sevenDaysAgo &&
          (status === 'delivered' || status === 'entregue' || status === 'shipped' || status === 'enviado')
        );
      });
    },
    staleTime: 2 * 60 * 1000,
  });

  const submitMutation = useMutation({
    mutationFn: (payload: { order_id: string; reason: string; metadata: object }) =>
      returnsApi.create(payload),
    onSuccess: (returnData) => {
      setResult(returnData);
      onSuccess?.();
    },
    onError: (err: unknown) => {
      setFormError((err as Error)?.message || 'Erro ao solicitar devolucao. Tente novamente.');
    },
  });

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  const handleToggleItem = (itemId: string) => {
    setSelectedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedOrderId) {
      setFormError('Selecione um pedido.');
      return;
    }

    const itemIds = Object.entries(selectedItems)
      .filter(([, checked]) => checked)
      .map(([id]) => id);

    if (itemIds.length === 0) {
      setFormError('Selecione pelo menos um item para devolucao.');
      return;
    }

    if (!reason) {
      setFormError('Selecione um motivo.');
      return;
    }

    const items: SelectedItem[] = (selectedOrder?.items || [])
      .filter((item) => selectedItems[item.id || item.variant_id || item.product_id])
      .map((item) => ({
        variant_id: item.variant_id || '',
        product_id: item.product_id,
        name: getLoc(item.name),
        size: item.size,
        quantity: item.quantity,
      }));

    submitMutation.mutate({
      order_id: selectedOrderId,
      reason,
      metadata: { items, details: details.trim() || undefined },
    });
  };

  const submitting = submitMutation.isPending;
  const error = formError;

  // Success state
  if (result) {
    return (
      <div className="min-h-screen bg-paper flex flex-col">
        <header className="sticky top-0 z-10 bg-paper border-b border-neutral-100">
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
            <h2 className="text-lg font-black font-serif uppercase tracking-tight">
              Devolucao Solicitada
            </h2>
            <p className="text-sm text-neutral-500 max-w-sm">
              Sua solicitacao foi enviada com sucesso. Acompanhe o status pelo codigo RMA abaixo.
            </p>
          </div>
          {result.rma_code && (
            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl px-8 py-6 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
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
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-10 bg-paper border-b border-neutral-100">
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
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block">
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
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block">
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
                        src={getOptimizedImageUrl(item.image, 'thumbnail')}
                        alt=""
                        className="w-12 h-16 object-cover rounded-lg flex-none bg-neutral-100"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black uppercase tracking-tight truncate">
                          {getLoc(item.name)}
                        </p>
                        <p className="text-[10px] text-neutral-400 uppercase tracking-widest mt-0.5">
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
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block">
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
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block">
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
