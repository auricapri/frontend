/**
 * AdminOrders - Main Component
 *
 * Logistics & Expedition management with Kanban-style columns
 */
import React, { useMemo, useState, useEffect } from 'react';
import { Order, UserProfile } from '../../../types';
import { OrdersApi } from '../../../api/orders.api';
import { UsersApi } from '../../../api/users.api';
import { OrderStatus } from '../../../constants/enums';
import {
  ApprovalColumn,
  ExpeditionColumn,
  TransitColumn,
  HistoryColumn,
} from './columns';
import { OrderModal } from './OrderModal';
import {
  getSLAStatus,
  createGetLoc,
  calculateLogisticsMetrics,
  calculateOrderEconomics,
} from './helpers';
import type { AdminOrdersProps, ExtendedOrderEconomics } from './types';

const AdminOrders: React.FC<AdminOrdersProps> = ({
  orders,
  products = [],
  assets = [],
  onUpdateStatus,
  locale,
}) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [isGeneratingLabel, setIsGeneratingLabel] = useState(false);
  const [customerData, setCustomerData] = useState<UserProfile | null>(null);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [generatedDocs, setGeneratedDocs] = useState<Record<string, boolean>>({});
  const [orderEconomicsCache, setOrderEconomicsCache] = useState<
    Record<string, ExtendedOrderEconomics>
  >({});
  const [currentEconomics, setCurrentEconomics] =
    useState<ExtendedOrderEconomics | null>(null);

  const ordersApi = new OrdersApi();
  const usersApi = new UsersApi();
  const getLoc = createGetLoc(locale);

  // Separate and sort orders by status
  const { incoming, expedition, transit, history } = useMemo(() => {
    const inc = orders
      .filter((o) => o.status === OrderStatus.PENDING)
      .sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

    const exp = orders
      .filter((o) => o.status === OrderStatus.CONFIRMED)
      .sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

    const tr = orders.filter((o) => o.status === OrderStatus.SHIPPED).sort((a, b) => {
      const slaA = getSLAStatus(a);
      const slaB = getSLAStatus(b);
      if (slaA.priority !== slaB.priority) return slaB.priority - slaA.priority;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    const hist = orders
      .filter(
        (o) => o.status === OrderStatus.DELIVERED || o.status === OrderStatus.CANCELLED
      )
      .sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

    return { incoming: inc, expedition: exp, transit: tr, history: hist };
  }, [orders]);

  // Fetch customer data when order selected
  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!selectedOrder?.user_id) {
        setCustomerData(null);
        return;
      }

      setLoadingCustomer(true);
      try {
        const customer = await usersApi.getById(selectedOrder.user_id);
        setCustomerData(customer);
      } catch (error) {
        console.error('Erro ao buscar dados do cliente:', error);
        setCustomerData(null);
      } finally {
        setLoadingCustomer(false);
      }
    };

    fetchCustomerData();
  }, [selectedOrder?.user_id]);

  // Calculate economics when order selected
  useEffect(() => {
    if (selectedOrder) {
      if (orderEconomicsCache[selectedOrder.id]) {
        setCurrentEconomics(orderEconomicsCache[selectedOrder.id]);
      } else {
        calculateOrderEconomics(selectedOrder).then((result) => {
          setOrderEconomicsCache((prev) => ({ ...prev, [selectedOrder.id]: result }));
          setCurrentEconomics(result);
        });
      }
    } else {
      setCurrentEconomics(null);
    }
  }, [selectedOrder]);

  const handleGenerateDoc = async () => {
    if (!selectedOrder) return;

    setIsGeneratingLabel(true);
    try {
      await ordersApi.downloadLabel(selectedOrder.id);
      setGeneratedDocs((prev) => ({ ...prev, [selectedOrder.id]: true }));
    } catch (error) {
      console.error('Error generating shipping label:', error);
      alert('Erro ao gerar etiqueta. Tente novamente.');
    } finally {
      setIsGeneratingLabel(false);
    }
  };

  const handleDispatch = () => {
    if (!selectedOrder) return;
    const hasDoc =
      selectedOrder.logistics_metadata?.doc_url || generatedDocs[selectedOrder.id];

    if (!hasDoc) {
      alert(
        'REGRA DE NEGÓCIO: É obrigatório gerar a Etiqueta de Envio antes de despachar.'
      );
      return;
    }
    if (!trackingInput.trim()) {
      alert('REGRA DE NEGÓCIO: Código de rastreio obrigatório para confirmar envio.');
      return;
    }
    onUpdateStatus(selectedOrder.id, OrderStatus.SHIPPED, trackingInput);
    setSelectedOrder(null);
    setTrackingInput('');
  };

  const handleApproveOrder = () => {
    if (!selectedOrder) return;
    onUpdateStatus(selectedOrder.id, OrderStatus.CONFIRMED);
    setSelectedOrder(null);
  };

  const handleRejectOrder = () => {
    if (!selectedOrder) return;
    if (
      confirm(
        'ATENÇÃO: Rejeitar este pedido iniciará o fluxo de reembolso para o cliente. Confirmar rejeição?'
      )
    ) {
      onUpdateStatus(selectedOrder.id, OrderStatus.CANCELLED);
      setSelectedOrder(null);
    }
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
    setTrackingInput('');
  };

  const logistics = selectedOrder
    ? calculateLogisticsMetrics(selectedOrder, products, assets)
    : { totalWeight: 0, dimensions: '' };

  const isDocGenerated = selectedOrder
    ? !!selectedOrder.logistics_metadata?.doc_url || !!generatedDocs[selectedOrder.id]
    : false;

  return (
    <div className="h-full flex flex-col space-y-8 relative">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-3xl font-black uppercase italic tracking-tighter">
            Logística & Expedição
          </h3>
          <p className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest mt-1">
            Gestão de Pedidos e Etiquetas
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-neutral-50 px-6 py-3 rounded-2xl border border-neutral-100 flex flex-col items-center">
            <span className="text-xl font-black">{incoming.length}</span>
            <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400">
              Novos
            </span>
          </div>
          <div className="bg-neutral-50 px-6 py-3 rounded-2xl border border-neutral-100 flex flex-col items-center">
            <span className="text-xl font-black">{expedition.length}</span>
            <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400">
              Preparar
            </span>
          </div>
          <div className="bg-neutral-50 px-6 py-3 rounded-2xl border border-neutral-100 flex flex-col items-center">
            <span className="text-xl font-black">{transit.length}</span>
            <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400">
              Trânsito
            </span>
          </div>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex gap-6 h-full min-w-[1300px]">
          <ApprovalColumn
            orders={incoming}
            locale={locale}
            onSelectOrder={setSelectedOrder}
            onUpdateStatus={onUpdateStatus}
          />
          <ExpeditionColumn
            orders={expedition}
            locale={locale}
            generatedDocs={generatedDocs}
            onSelectOrder={setSelectedOrder}
          />
          <TransitColumn
            orders={transit}
            locale={locale}
            onSelectOrder={setSelectedOrder}
            onUpdateStatus={onUpdateStatus}
          />
          <HistoryColumn
            orders={history}
            locale={locale}
            onSelectOrder={setSelectedOrder}
          />
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && currentEconomics && (
        <OrderModal
          order={selectedOrder}
          economics={currentEconomics}
          logistics={logistics}
          customerData={customerData}
          loadingCustomer={loadingCustomer}
          isDocGenerated={isDocGenerated}
          isGeneratingLabel={isGeneratingLabel}
          trackingInput={trackingInput}
          products={products}
          assets={assets}
          locale={locale}
          onClose={handleCloseModal}
          onTrackingChange={setTrackingInput}
          onGenerateDoc={handleGenerateDoc}
          onDispatch={handleDispatch}
          onApprove={handleApproveOrder}
          onReject={handleRejectOrder}
          getLoc={getLoc}
        />
      )}
    </div>
  );
};

export default AdminOrders;
