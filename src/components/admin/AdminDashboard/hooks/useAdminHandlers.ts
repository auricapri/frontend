/// Admin Handlers Hook
/// Contains all handler functions for admin operations

import { useCallback } from 'react';
import {
  productsApi,
  ordersApi,
  storeApi,
  couponsApi,
  collectionsApi,
  bannersApi,
  suppliersApi,
  marketingApi,
} from '../../../../api/instances';
import { Coupon, StoreConfig } from '../../../../types';
import { OrderStatus } from '../../../../constants/enums';
import { Campaign } from '../../../../api/marketing.api';
import { EditorItem } from '../types';
import { preparePayloadWithSlugAndDescription, getLocalizedString } from '../utils/slugUtils';

interface UseAdminHandlersParams {
  editingItem: EditorItem | null;
  setEditingItem: (item: EditorItem | null) => void;
  setEditingCoupon: (coupon: Coupon | null) => void;
  setOrders: React.Dispatch<React.SetStateAction<any[]>>;
  setConfig: React.Dispatch<React.SetStateAction<StoreConfig>>;
  config: StoreConfig;
  fetchData: () => Promise<void>;
  onProductChange: () => void;
  locale: string;
  isDeletingTaxonomy: boolean;
  setIsDeletingTaxonomy: (value: boolean) => void;
}

export const useAdminHandlers = ({
  editingItem,
  setEditingItem,
  setEditingCoupon,
  setOrders,
  setConfig,
  config,
  fetchData,
  onProductChange,
  locale,
  isDeletingTaxonomy,
  setIsDeletingTaxonomy,
}: UseAdminHandlersParams) => {
  const handleUpdateOrderStatus = useCallback(async (
    orderId: string,
    status: OrderStatus,
    trackingCode?: string
  ) => {
    try {
      const updatedOrder = await ordersApi.updateStatus(orderId, status, trackingCode);
      setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar pedido';
      alert(message);
    }
  }, [setOrders]);

  const handleSaveItem = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const { type, data } = editingItem;
      const payload = { ...data };
      const variants = payload.variants;
      delete payload.variants;
      delete payload._associatedProductIds;

      if (type === 'product') {
        preparePayloadWithSlugAndDescription(payload);
        if (data.id) {
          await productsApi.update(data.id, { ...payload, variants });
        } else {
          await productsApi.create({ ...payload, variants });
        }
      } else if (type === 'collection') {
        preparePayloadWithSlugAndDescription(payload);
        if (data.id) {
          await collectionsApi.update(data.id, payload);
        } else {
          await collectionsApi.create(payload);
        }
      } else if (type === 'category') {
        preparePayloadWithSlugAndDescription(payload);
        if (data.id) {
          await storeApi.updateCategory(data.id, payload);
        } else {
          await storeApi.createCategory(payload);
        }
      } else if (type === 'banner') {
        if (data.id) {
          await bannersApi.update(data.id, payload);
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
  }, [editingItem, fetchData, onProductChange, setEditingItem]);

  const requestDeleteTaxonomy = useCallback(async () => {
    if (!editingItem) return;
    if (editingItem.type !== 'category' && editingItem.type !== 'collection') return;
    const data = editingItem.data as any;
    if (!data?.id) return;

    const name = getLocalizedString(data.name, locale) ||
      (editingItem.type === 'category' ? 'Categoria' : 'Coleção');
    const associatedCount = Array.isArray(data._associatedProductIds) ? data._associatedProductIds.length : 0;

    if (associatedCount > 0) {
      alert('Esta taxonomia está vinculada a produtos. Remova os vínculos antes de excluir.');
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir "${name}"?`)) return;
    if (isDeletingTaxonomy) return;

    setIsDeletingTaxonomy(true);
    try {
      if (editingItem.type === 'category') {
        await storeApi.deleteCategory(String(data.id));
      } else {
        await collectionsApi.delete(String(data.id));
      }

      await fetchData();
      onProductChange();
      setEditingItem(null);
      alert(`${editingItem.type === 'category' ? 'Categoria' : 'Coleção'} excluída com sucesso.`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(message);
    } finally {
      setIsDeletingTaxonomy(false);
    }
  }, [editingItem, fetchData, isDeletingTaxonomy, locale, onProductChange, setEditingItem, setIsDeletingTaxonomy]);

  const handleSaveCoupon = useCallback(async (coupon: Coupon) => {
    try {
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
  }, [fetchData, setEditingCoupon]);

  const handleDeleteCoupon = useCallback(async (couponId: string) => {
    try {
      await couponsApi.delete(couponId);
      await fetchData();
      setEditingCoupon(null);
      alert('Cupom excluído com sucesso.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir cupom';
      alert(message);
      throw error;
    }
  }, [fetchData, setEditingCoupon]);

  const handleSaveCampaign = useCallback(async (campaign: Partial<Campaign>) => {
    try {
      if (campaign.id) {
        await marketingApi.updateCampaign(campaign.id, campaign);
      } else {
        await marketingApi.createCampaign(campaign);
      }
      fetchData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar campanha';
      alert(message);
      throw error;
    }
  }, [fetchData]);

  const handleDeleteCampaign = useCallback(async (id: string) => {
    try {
      await marketingApi.deleteCampaign(id);
      fetchData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir campanha';
      alert(message);
      throw error;
    }
  }, [fetchData]);

  const handleSaveSupplier = useCallback(async (supplierData: any, existingId?: string) => {
    try {
      if (existingId) {
        await suppliersApi.update(existingId, supplierData);
      } else {
        await suppliersApi.create(supplierData);
      }
      await fetchData();
    } catch (error: unknown) {
      console.error('[AdminDashboard] Error saving supplier:', error);
      throw error;
    }
  }, [fetchData]);

  const handleDeleteSupplier = useCallback(async (id: string) => {
    try {
      await suppliersApi.delete(id);
      await fetchData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir fornecedor';
      alert(message);
    }
  }, [fetchData]);

  const handleSystemSave = useCallback(async () => {
    try {
      await storeApi.updateConfig(config);
      alert("Configurações salvas!");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar';
      alert(message);
    }
  }, [config]);

  return {
    handleUpdateOrderStatus,
    handleSaveItem,
    requestDeleteTaxonomy,
    handleSaveCoupon,
    handleDeleteCoupon,
    handleSaveCampaign,
    handleDeleteCampaign,
    handleSaveSupplier,
    handleDeleteSupplier,
    handleSystemSave,
  };
};
