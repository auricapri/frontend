import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCw, Truck, Package, CheckCircle, ArrowRight, LogOut, Calendar } from 'lucide-react';
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
import { OrderStatus } from '../../constants/enums';

interface DeliveryDashboardProps {
  orders?: Order[];
  suppliers?: Supplier[];
  locale: Locale;
  onLogout: () => void;
}

const TAB_CONFIG = [
  { key: 'today' as const, label: 'Fornecedores', icon: Package },
  { key: 'coleta' as const, label: 'Coleta', icon: Truck },
  { key: 'history' as const, label: 'Histórico', icon: RefreshCw },
  { key: 'notifications' as const, label: 'Avisos', icon: CheckCircle },
] as const;

const DeliveryDashboard: React.FC<DeliveryDashboardProps> = ({ locale, onLogout }) => {
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
  const [activeTab, setActiveTab] = useState<'today' | 'coleta' | 'history' | 'notifications'>('today');
  const [busyAction, setBusyAction] = useState(false);

  // Logistics workflow state
  const [awaitingPickupOrders, setAwaitingPickupOrders] = useState<Order[]>([]);
  const [collectedOrders, setCollectedOrders] = useState<Order[]>([]);
  const [isLoadingLogistics, setIsLoadingLogistics] = useState(false);
  const [logisticsActionBusy, setLogisticsActionBusy] = useState<string | null>(null);

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
        return null;
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

  const fetchLogisticsData = useCallback(async () => {
    setIsLoadingLogistics(true);
    try {
      const dashboard = await api.getDeliveryDashboard();
      setAwaitingPickupOrders(dashboard.awaiting_pickup || []);
      setCollectedOrders(dashboard.collected || []);
    } catch (e: any) {
      showToast(e?.message || 'Falha ao carregar dados de logística', 'error');
    } finally {
      setIsLoadingLogistics(false);
    }
  }, [api, showToast]);

  useEffect(() => {
    if (activeTab === 'coleta') {
      fetchLogisticsData();
    }
  }, [activeTab, fetchLogisticsData]);

  const handleMarkAsCollected = async (orderId: string) => {
    setLogisticsActionBusy(orderId);
    try {
      await api.markAsCollected(orderId);
      showToast('Pedido marcado como coletado!', 'info');
      await fetchLogisticsData();
    } catch (e: any) {
      showToast(e?.message || 'Falha ao marcar como coletado', 'error');
    } finally {
      setLogisticsActionBusy(null);
    }
  };

  const handleMoveToExpedition = async (orderId: string) => {
    setLogisticsActionBusy(orderId);
    try {
      await api.moveToExpedition(orderId);
      showToast('Pedido movido para expedição!', 'info');
      await fetchLogisticsData();
    } catch (e: any) {
      showToast(e?.message || 'Falha ao mover para expedição', 'error');
    } finally {
      setLogisticsActionBusy(null);
    }
  };

  const selectedGroup = useMemo(() => {
    if (!selectedSupplierId) return null;
    return groups.find((g) => g.supplier_id === selectedSupplierId) || null;
  }, [groups, selectedSupplierId]);

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
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header — compact 48px */}
      <div className="bg-black text-white px-3 md:px-6 h-12 flex items-center justify-between flex-shrink-0">
        <h1 className="text-sm font-black uppercase tracking-tighter">AURICAPRI</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-neutral-800 border-none text-xs text-white px-2 py-1 rounded-lg focus:outline-none focus:ring-1 focus:ring-white/30 w-[130px]"
            />
          </div>
          <button
            type="button"
            onClick={fetchGroups}
            disabled={isLoading}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-all disabled:opacity-50"
            aria-label="Atualizar"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-all"
            aria-label="Sair"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs — single row, scrollable */}
      <div className="bg-white border-b border-neutral-100 px-2 md:px-6 flex-shrink-0">
        <div className="flex overflow-x-auto no-scrollbar">
          {TAB_CONFIG.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={
                  `flex items-center gap-1.5 px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap border-b-2 transition-all ` +
                  (activeTab === t.key
                    ? 'border-black text-black'
                    : 'border-transparent text-neutral-400 hover:text-neutral-600')
                }
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {activeTab === 'history' ? (
          <div className="p-2 md:p-6">
            <DeliveryHistoryPanel />
          </div>
        ) : activeTab === 'notifications' ? (
          <div className="p-2 md:p-6">
            <DeliveryNotificationsPanel />
          </div>
        ) : activeTab === 'coleta' ? (
          <div className="p-2 md:p-6 space-y-3">
            {/* Logistics Summary */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <div className="text-xl font-black">{awaitingPickupOrders.length}</div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-amber-700">Aguardando</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <div className="text-xl font-black">{collectedOrders.length}</div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-blue-700">Coletados</div>
              </div>
            </div>

            {isLoadingLogistics ? (
              <div className="flex items-center justify-center h-32 bg-white rounded-xl border border-neutral-100">
                <Loader2 className="w-6 h-6 animate-spin text-black" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* Awaiting Pickup */}
                <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
                  <div className="px-3 py-2.5 border-b border-neutral-100 bg-amber-50 flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-600" />
                    <h4 className="font-bold uppercase text-xs tracking-tight">Aguardando Coleta</h4>
                  </div>
                  <div className="divide-y divide-neutral-100">
                    {awaitingPickupOrders.length === 0 ? (
                      <div className="p-6 text-center text-neutral-400 text-xs">Nenhum pedido</div>
                    ) : (
                      awaitingPickupOrders.map((order) => (
                        <div key={order.id} className="p-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-bold text-xs">{order.id.slice(0, 8).toUpperCase()}</div>
                            <div className="text-[10px] text-neutral-400 mt-0.5">
                              {order.items?.length || 0} item(s)
                            </div>
                          </div>
                          <button
                            onClick={() => handleMarkAsCollected(order.id)}
                            disabled={logisticsActionBusy === order.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-amber-600 active:scale-[0.98] transition-all disabled:opacity-50"
                          >
                            {logisticsActionBusy === order.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="w-3.5 h-3.5" />
                                Coletar
                              </>
                            )}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Collected */}
                <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
                  <div className="px-3 py-2.5 border-b border-neutral-100 bg-blue-50 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <h4 className="font-bold uppercase text-xs tracking-tight">Coletados</h4>
                  </div>
                  <div className="divide-y divide-neutral-100">
                    {collectedOrders.length === 0 ? (
                      <div className="p-6 text-center text-neutral-400 text-xs">Nenhum pedido</div>
                    ) : (
                      collectedOrders.map((order) => (
                        <div key={order.id} className="p-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-bold text-xs">{order.id.slice(0, 8).toUpperCase()}</div>
                            <div className="text-[10px] text-neutral-400 mt-0.5">
                              {order.items?.length || 0} item(s)
                            </div>
                          </div>
                          <button
                            onClick={() => handleMoveToExpedition(order.id)}
                            disabled={logisticsActionBusy === order.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-blue-600 active:scale-[0.98] transition-all disabled:opacity-50"
                          >
                            {logisticsActionBusy === order.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <ArrowRight className="w-3.5 h-3.5" />
                                Expedição
                              </>
                            )}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Fornecedores tab — mobile: fullscreen navigation */
          <div className="h-full">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-black" />
              </div>
            ) : error ? (
              <div className="p-3 text-sm text-red-700">{error}</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
                {/* List — hidden on mobile when supplier selected */}
                <div className={`lg:col-span-1 lg:border-r lg:border-neutral-100 ${selectedSupplierId ? 'hidden lg:block' : ''}`}>
                  <DeliverySupplierList
                    groups={groups}
                    selectedSupplierId={selectedSupplierId}
                    onSelectSupplier={setSelectedSupplierId}
                  />
                </div>

                {/* Details — hidden on mobile when no supplier selected */}
                <div className={`lg:col-span-2 ${!selectedGroup ? 'hidden lg:flex lg:items-center lg:justify-center' : ''}`}>
                  {!selectedGroup ? (
                    <div className="text-center p-8">
                      <Truck className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
                      <div className="text-sm text-neutral-400">Selecione um fornecedor</div>
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
                      onBack={() => setSelectedSupplierId(null)}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

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

export default DeliveryDashboard;
