import { useState, useCallback } from 'react';
import { ProductsApi } from '../api/products.api';
import { OrdersApi } from '../api/orders.api';
import { CouponsApi } from '../api/coupons.api';
import { CollectionsApi } from '../api/collections.api';
import { BannersApi } from '../api/banners.api';
import { StoreApi } from '../api/store.api';
import { SuppliersApi } from '../api/suppliers.api';
import type { Product, Coupon, Supplier, Order } from '../types';
import type { Locale } from '../i18n';

interface EditingItem {
  type: string;
  data: unknown;
}

export function useAdminHandlers(
  fetchData: () => Promise<void>,
  onProductChange: () => void,
  locale: Locale,
  getLoc: (obj: unknown) => string,
  products: Product[],
  setOrders?: React.Dispatch<React.SetStateAction<Order[]>>
) {
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showSupplierEditor, setShowSupplierEditor] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ productIds: string[]; productNames: string[] } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteQueue, setDeleteQueue] = useState<Array<{ id: string; status: 'pending' | 'processing' | 'success' | 'failed'; error?: string }>>([]);
  const [confirmationText, setConfirmationText] = useState('');

  const handleUpdateOrderStatus = useCallback(async (orderId: string, status: string, trackingCode?: string) => {
    try {
      const ordersApi = new OrdersApi();
      const updatedOrder = await ordersApi.updateStatus(orderId, status, trackingCode);
      if (setOrders) {
        setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
      }
      return updatedOrder;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar pedido';
      alert(message);
      throw error;
    }
  }, []);

  const handleSaveItem = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const { type, data } = editingItem;
      const payload = { ...data as Record<string, unknown> };
      const variants = (payload.variants as unknown[]) || [];
      delete payload.variants;

      if (type === 'product') {
        const productsApi = new ProductsApi();
        if ((data as Product).id) {
          await productsApi.update((data as Product).id, { ...payload, variants });
        } else {
          await productsApi.create({ ...payload, variants });
        }
      } else if (type === 'collection') {
        const collectionsApi = new CollectionsApi();
        if ((data as { id?: string }).id) {
          await collectionsApi.update((data as { id: string }).id, payload);
        } else {
          await collectionsApi.create(payload);
        }
      } else if (type === 'banner') {
        const bannersApi = new BannersApi();
        if ((data as { id?: string }).id) {
          await bannersApi.update((data as { id: string }).id, payload);
        } else {
          await bannersApi.create(payload);
        }
      }

      await fetchData();
      onProductChange();
      setEditingItem(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar';
      alert(message);
    }
  }, [editingItem, fetchData, onProductChange]);

  const handleSaveCoupon = useCallback(async (coupon: Coupon) => {
    try {
      const couponsApi = new CouponsApi();
      if (coupon.id) {
        await couponsApi.update(coupon.id, coupon);
      } else {
        await couponsApi.create(coupon);
      }
      fetchData();
      setEditingCoupon(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar cupom';
      alert(message);
    }
  }, [fetchData]);

  const handleSystemSave = useCallback(async (configToSave: unknown) => {
    try {
      const storeApi = new StoreApi();
      await storeApi.updateConfig(configToSave);
      alert('Configurações salvas!');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar configurações';
      alert(message);
    }
  }, []);

  const handleDeleteProduct = useCallback((productIds: string[]) => {
    if (productIds.length === 0) return;
    
    const selectedProducts = products.filter(p => productIds.includes(p.id));
    const productNames = selectedProducts.map(p => getLoc(p.name) || 'Produto sem nome');
    
    setDeleteConfirm({ productIds, productNames });
    setConfirmationText('');
    setDeleteQueue(productIds.map(id => ({ id, status: 'pending' as const })));
  }, [products, getLoc]);

  const confirmDeleteProduct = useCallback(async () => {
    if (!deleteConfirm) return;
    
    if (confirmationText.trim().toLowerCase() !== 'excluir produto') {
      alert('Por favor, digite "excluir produto" para confirmar a exclusão.');
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const productsApi = new ProductsApi();
      const result = await productsApi.deleteBatch(deleteConfirm.productIds);
      
      setDeleteQueue(prev => prev.map(item => {
        if (result.success.includes(item.id)) {
          return { ...item, status: 'success' };
        } else {
          const failed = result.failed.find(f => f.id === item.id);
          return { ...item, status: 'failed', error: failed?.error };
        }
      }));
      
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchData();
      onProductChange();
      
      const successCount = result.success.length;
      const failedCount = result.failed.length;
      
      if (failedCount === 0) {
        alert(`${successCount} produto${successCount !== 1 ? 's' : ''} excluído${successCount !== 1 ? 's' : ''} com sucesso!`);
      } else {
        alert(`${successCount} produto${successCount !== 1 ? 's' : ''} excluído${successCount !== 1 ? 's' : ''}. ${failedCount} falha${failedCount !== 1 ? 's' : ''}.`);
      }
      
      setDeleteConfirm(null);
      setDeleteQueue([]);
      setConfirmationText('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`Erro ao excluir produtos: ${message}`);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteConfirm, confirmationText, fetchData, onProductChange]);

  return {
    editingItem,
    setEditingItem,
    editingCoupon,
    setEditingCoupon,
    editingSupplier,
    setEditingSupplier,
    showSupplierEditor,
    setShowSupplierEditor,
    deleteConfirm,
    setDeleteConfirm,
    isDeleting,
    deleteQueue,
    confirmationText,
    setConfirmationText,
    handleUpdateOrderStatus,
    handleSaveItem,
    handleSaveCoupon,
    handleSystemSave,
    handleDeleteProduct,
    confirmDeleteProduct,
  };
}
