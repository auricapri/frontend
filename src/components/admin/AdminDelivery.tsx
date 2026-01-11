import React, { useState, useEffect, useMemo } from 'react';
import { Truck, Package, DollarSign, Store, Calendar, Loader2 } from 'lucide-react';
import { Order, Supplier } from '../../types';
// import { DeliveryApi } from '../../api/delivery.api';
// import { SupplierOrderGroup } from '../../types/delivery.types';
import { formatCurrency } from '../../utils/currency';
import { Locale } from '../../i18n';
// import { MapButton } from '../delivery/MapButton';

interface AdminDeliveryProps {
  orders: Order[];
  suppliers: Supplier[];
  locale: Locale;
}

const AdminDelivery: React.FC<AdminDeliveryProps> = ({ orders, suppliers, locale }) => {
  const [deliveryGroups, setDeliveryGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');

  // const deliveryApi = new DeliveryApi();

  useEffect(() => {
    fetchDeliveryOrders();
  }, [selectedDate]);

  const fetchDeliveryOrders = async () => {
    setIsLoading(true);
    try {
      // TODO: Restaurar DeliveryApi quando backend estiver disponível
      // const groups = await deliveryApi.getOrdersForDelivery(selectedDate || undefined);
      // setDeliveryGroups(groups);
      setDeliveryGroups([]);
    } catch (error: any) {
      console.error('Error fetching delivery orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = useMemo(() => {
    const totalSuppliers = deliveryGroups.length;
    const totalItems = deliveryGroups.reduce((sum, group) => sum + group.total_items, 0);
    const totalAmount = deliveryGroups.reduce((sum, group) => sum + group.total_amount, 0);
    const pickedUpItems = deliveryGroups.reduce((sum, group) => sum + group.picked_up_items, 0);

    return {
      totalSuppliers,
      totalItems,
      totalAmount,
      pickedUpItems,
      remainingItems: totalItems - pickedUpItems
    };
  }, [deliveryGroups]);

  const getDateDisplay = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="space-y-10 min-h-full">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-3xl font-black uppercase italic tracking-tighter">Delivery</h3>
          <p className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest mt-1">
            Pedidos do dia anterior ({getDateDisplay()})
          </p>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-neutral-200 rounded-xl text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-neutral-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Store className="w-5 h-5 text-neutral-400" />
            <span className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest">
              Fornecedores
            </span>
          </div>
          <div className="text-3xl font-black">{stats.totalSuppliers}</div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-neutral-400" />
            <span className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest">
              Produtos
            </span>
          </div>
          <div className="text-3xl font-black">{stats.totalItems}</div>
          <div className="text-xs text-neutral-500 mt-1">
            {stats.pickedUpItems} coletados / {stats.remainingItems} restantes
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-neutral-400" />
            <span className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest">
              Valor Total
            </span>
          </div>
          <div className="text-3xl font-black">{formatCurrency(stats.totalAmount, locale)}</div>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Truck className="w-5 h-5 text-neutral-400" />
            <span className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest">
              Progresso
            </span>
          </div>
          <div className="text-3xl font-black">
            {stats.totalItems > 0 
              ? Math.round((stats.pickedUpItems / stats.totalItems) * 100)
              : 0}%
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {deliveryGroups.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-100 p-12 text-center">
            <Truck className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-500 font-medium">Nenhum pedido encontrado para o dia selecionado</p>
          </div>
        ) : (
          deliveryGroups.map((group) => (
            <div
              key={group.supplier_id}
              className="bg-white rounded-2xl border border-neutral-100 p-6 hover:border-black transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="text-xl font-black uppercase tracking-tight mb-2">
                    {group.supplier.store_name}
                  </h4>
                  {group.supplier.address && (
                    <p className="text-sm text-neutral-600 mb-1">
                      {group.supplier.address.logradouro}
                      {group.supplier.address.numero && `, ${group.supplier.address.numero}`}
                      {group.supplier.address.bairro && ` - ${group.supplier.address.bairro}`}
                      {group.supplier.address.localidade && `, ${group.supplier.address.localidade}`}
                      {group.supplier.address.uf && ` - ${group.supplier.address.uf}`}
                    </p>
                  )}
                  {group.supplier.phone && (
                    <p className="text-sm text-neutral-600">Tel: {group.supplier.phone}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black mb-1">
                    {formatCurrency(group.total_amount, locale)}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {group.total_items} produtos
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    {group.picked_up_items} coletados
                  </div>
                </div>
              </div>

              <div className="border-t border-neutral-100 pt-4 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-bold uppercase text-neutral-400 tracking-widest">
                    Pedidos Relacionados
                  </div>
                  {group.supplier.address && (
                    /* <MapButton
                      address={group.supplier.address}
                      className="ml-auto"
                    /> */
                    null
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.orders.map((order) => (
                    <span
                      key={order.id}
                      className="px-3 py-1 bg-neutral-50 rounded-lg text-xs font-medium text-neutral-700"
                    >
                      #{order.id.slice(0, 8)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminDelivery;
