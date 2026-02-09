/// Delete Confirmation Hook
/// Manages state and logic for product deletion confirmation

import { useState, useCallback } from 'react';
import { productsApi } from '../../../../api/instances';
import { Product } from '../../../../types';
import { DeleteConfirmState, DeleteQueueItem } from '../types';
import { getLocalizedString } from '../utils/slugUtils';

interface UseDeleteConfirmParams {
  products: Product[];
  locale: string;
  onRefresh: () => Promise<void>;
  onProductChange: () => void;
}

export const useDeleteConfirm = ({
  products,
  locale,
  onRefresh,
  onProductChange,
}: UseDeleteConfirmParams) => {
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteQueue, setDeleteQueue] = useState<DeleteQueueItem[]>([]);
  const [confirmationText, setConfirmationText] = useState('');

  const requestDelete = useCallback((productIds: string[]) => {
    if (productIds.length === 0) return;

    const selectedProducts = products.filter(p => productIds.includes(p.id));
    const productNames = selectedProducts.map(p =>
      getLocalizedString(p.name, locale) || 'Produto sem nome'
    );

    setDeleteConfirm({ productIds, productNames });
    setConfirmationText('');
    setDeleteQueue(productIds.map(id => ({ id, status: 'pending' as const })));
  }, [products, locale]);

  const confirmDelete = useCallback(async () => {
    if (!deleteConfirm) return;

    if (confirmationText.trim().toLowerCase() !== 'excluir produto') {
      alert('Por favor, digite "excluir produto" para confirmar a exclusão.');
      return;
    }

    setIsDeleting(true);

    try {
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
      await onRefresh();
      onProductChange();

      const successCount = result.success.length;
      const failedCount = result.failed.length;

      if (failedCount === 0) {
        alert(`${successCount} produto${successCount !== 1 ? 's' : ''} excluído${successCount !== 1 ? 's' : ''} com sucesso!`);
      } else {
        alert(`${successCount} produto${successCount !== 1 ? 's' : ''} excluído${successCount !== 1 ? 's' : ''}. ${failedCount} falha${failedCount !== 1 ? 's' : ''}.`);
      }

      cancelDelete();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`Erro ao excluir produtos: ${message}`);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteConfirm, confirmationText, onRefresh, onProductChange]);

  const cancelDelete = useCallback(() => {
    setDeleteConfirm(null);
    setDeleteQueue([]);
    setConfirmationText('');
  }, []);

  return {
    deleteConfirm,
    isDeleting,
    deleteQueue,
    confirmationText,
    setConfirmationText,
    requestDelete,
    confirmDelete,
    cancelDelete,
  };
};
