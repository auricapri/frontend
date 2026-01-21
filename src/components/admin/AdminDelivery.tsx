import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCw, Truck } from 'lucide-react';
import { Locale } from '../../i18n';
import { DeliveryApi, type DeliverySupplierGroup } from '../../api/delivery.api';
import Toast from '../ui/Toast';
import { DeliverySupplierList } from '../delivery/DeliverySupplierList';
import { DeliverySupplierDetails } from '../delivery/DeliverySupplierDetails';
import { ReportProblemModal } from '../delivery/ReportProblemModal';
import { RateSupplierModal } from '../delivery/RateSupplierModal';
import { DeliveryHistoryPanel } from '../delivery/DeliveryHistoryPanel';
import { DeliveryNotificationsPanel } from '../delivery/DeliveryNotificationsPanel';
import { Order } from '../../types';
import { Supplier } from '../../types/suppliers';

interface AdminDeliveryProps {
  orders?: Order[];
  suppliers?: Supplier[];
  locale: Locale;
}

const AdminDelivery: React.FC<AdminDeliveryProps> = ({ locale }) => {
  const api = useMemo(() => new DeliveryApi(), []);
  const [groups, setGroups] = useState<DeliverySupplierGroup[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'info' | 'error' }>({
    visible: false,
    message: '',
    type: 'info',
  });
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'today' | 'history' | 'notifications'>('today');
  const [busyAction, setBusyAction] = useState(false);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportContext, setReportContext] = useState<{ supplierId: string; orderId: string; orderItemId: string } | null>(null);

  const [rateOpen, setRateOpen] = useState(false);
  const [rateSupplierId, setRateSupplierId] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const list = await api.getOrdersForDelivery(selectedDate || undefined);
      setGroups(list);
      setSelectedSupplierId((prev) => {
        if (prev && list.some((g) => g.supplier_id === prev)) return prev;
        return list.length ? list[0].supplier_id : null;
      });
    } catch (e: any) {
      setError(e?.message || 'Falha ao carregar pedidos de delivery');
      setGroups([]);
      setSelectedSupplierId(null);
    } finally {
      setIsLoading(false);
    }
  }, [api, selectedDate]);

  const showToast = useCallback((message: string, type: 'info' | 'error' = 'info') => {
    setToast({ visible: true, message, type });
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const selectedGroup = useMemo(() => {
    if (!selectedSupplierId) return null;
    return groups.find((g) => g.supplier_id === selectedSupplierId) || null;
  }, [groups, selectedSupplierId]);

  const dateLabel = useMemo(() => {
    if (selectedDate) {
      try {
        const [y, m, d] = selectedDate.split('-').map((p) => parseInt(p, 10));
        const dt = new Date(y, (m || 1) - 1, d || 1);
        return dt.toLocaleDateString('pt-BR');
      } catch {
        return selectedDate;
      }
    }
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toLocaleDateString('pt-BR');
  }, [selectedDate]);

  const onAcceptAll = async (supplierId: string) => {
    setBusyAction(true);
    try {
      const result = await api.markAllSupplierItemsPickedUp(supplierId);
      if (result.failed > 0) {
        showToast(`Alguns itens não foram aceitos (${result.failed}).`, 'error');
      } else {
        showToast('Itens aceitos com sucesso.', 'info');
      }
      await fetchGroups();
    } catch (e: any) {
      showToast(e?.message || 'Falha ao aceitar itens do fornecedor.', 'error');
    } finally {
      setBusyAction(false);
    }
  };

  const onAcceptItem = async (orderId: string, orderItemId: string) => {
    setBusyAction(true);
    try {
      await api.markItemPickedUp(orderId, orderItemId);
      showToast('Item aceito com sucesso.', 'info');
      await fetchGroups();
    } catch (e: any) {
      showToast(e?.message || 'Falha ao aceitar item.', 'error');
    } finally {
      setBusyAction(false);
    }
  };

  const onReportItem = (params: { supplierId: string; orderId: string; orderItemId: string }) => {
    setReportContext(params);
    setReportOpen(true);
  };

  const onRateSupplier = (supplierId: string) => {
    setRateSupplierId(supplierId);
    setRateOpen(true);
  };

  return (
    <div className="space-y-6 min-h-full">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h3 className="text-3xl font-black uppercase italic tracking-tighter">Entregas</h3>
          <p className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest mt-1">
            Pedidos do dia ({dateLabel})
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Data</div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-neutral-200 rounded-xl text-sm bg-white"
            />
          </div>
          <button
            type="button"
            onClick={fetchGroups}
            disabled={isLoading}
            className="p-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Atualizar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {(
          [
            { key: 'today' as const, label: 'Hoje' },
            { key: 'history' as const, label: 'Histórico' },
            { key: 'notifications' as const, label: 'Notificações' },
          ]
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            className={
              `px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30 ` +
              (activeTab === t.key ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200')
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'history' ? (
        <DeliveryHistoryPanel />
      ) : activeTab === 'notifications' ? (
        <DeliveryNotificationsPanel />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            {isLoading ? (
              <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-neutral-100">
                <Loader2 className="w-8 h-8 animate-spin text-black" />
              </div>
            ) : error ? (
              <div className="bg-white rounded-2xl border border-neutral-100 p-6 text-sm text-red-700">{error}</div>
            ) : (
              <DeliverySupplierList
                groups={groups}
                selectedSupplierId={selectedSupplierId}
                onSelectSupplier={setSelectedSupplierId}
              />
            )}
          </div>

          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-neutral-100">
                <Loader2 className="w-8 h-8 animate-spin text-black" />
              </div>
            ) : !selectedGroup ? (
              <div className="bg-white rounded-2xl border border-neutral-100 p-12 text-center">
                <Truck className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                <div className="text-neutral-700 font-black uppercase tracking-tight">Selecione um fornecedor</div>
                <div className="text-sm text-neutral-500 mt-2">Para ver detalhes e ações</div>
              </div>
            ) : (
              <DeliverySupplierDetails
                group={selectedGroup}
                locale={locale}
                busy={busyAction}
                onAcceptAll={onAcceptAll}
                onAcceptItem={onAcceptItem}
                onReportItem={onReportItem}
                onRateSupplier={onRateSupplier}
              />
            )}
          </div>
        </div>
      )}

      <ReportProblemModal
        isOpen={reportOpen}
        onClose={() => {
          setReportOpen(false);
          setReportContext(null);
        }}
        supplierName={
          reportContext
            ? (groups.find((g) => g.supplier_id === reportContext.supplierId)?.supplier?.store_name || 'Fornecedor')
            : 'Fornecedor'
        }
        context={reportContext ? { orderId: reportContext.orderId, orderItemId: reportContext.orderItemId } : null}
        onReported={fetchGroups}
      />

      <RateSupplierModal
        isOpen={rateOpen}
        onClose={() => {
          setRateOpen(false);
          setRateSupplierId(null);
        }}
        supplierId={rateSupplierId}
        supplierName={
          rateSupplierId ? (groups.find((g) => g.supplier_id === rateSupplierId)?.supplier?.store_name || 'Fornecedor') : 'Fornecedor'
        }
        onRated={fetchGroups}
      />

      <Toast
        message={toast.message}
        isVisible={toast.visible}
        onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
        type={toast.type}
      />
    </div>
  );
};

export default AdminDelivery;
