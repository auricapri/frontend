/// Delete Confirmation Modal
/// Modal for confirming batch product deletion

import React from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import { DeleteConfirmState, DeleteQueueItem } from '../types';

interface DeleteConfirmationModalProps {
  deleteConfirm: DeleteConfirmState;
  deleteQueue: DeleteQueueItem[];
  confirmationText: string;
  isDeleting: boolean;
  onConfirmationTextChange: (text: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  deleteConfirm,
  deleteQueue,
  confirmationText,
  isDeleting,
  onConfirmationTextChange,
  onConfirm,
  onCancel,
}) => {
  const isConfirmValid = confirmationText.trim().toLowerCase() === 'excluir produto';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-8">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-red-50 border-b border-red-100 px-6 py-4 flex items-center gap-3">
          <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-red-900">Confirmar Exclusão em Lote</h3>
            <p className="text-sm text-red-700">
              {deleteConfirm.productIds.length} produto{deleteConfirm.productIds.length !== 1 ? 's' : ''} selecionado{deleteConfirm.productIds.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
          {/* Product List */}
          <div className="mb-4">
            <p className="text-sm text-neutral-600 mb-3 font-medium">
              Você está prestes a excluir permanentemente {deleteConfirm.productIds.length} produto{deleteConfirm.productIds.length !== 1 ? 's' : ''}:
            </p>
            <div className="bg-neutral-50 rounded-lg border border-neutral-200 p-4 max-h-48 overflow-y-auto">
              <ul className="space-y-2">
                {deleteConfirm.productNames.map((name, idx) => (
                  <li key={idx} className="text-sm font-medium text-neutral-900 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Warning Box */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-bold text-red-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Atenção: Esta ação não pode ser desfeita!
            </p>
            <ul className="text-xs text-red-800 space-y-1 ml-6">
              <li>• Os produtos serão removidos permanentemente do catálogo</li>
              <li>• Todas as variações serão excluídas</li>
              <li>• Os produtos serão desvinculados de coleções, cupons e wishlists</li>
              <li>• Esta ação não pode ser recuperada</li>
            </ul>
          </div>

          {/* Confirmation Input */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-neutral-700 mb-2">
              Para confirmar, digite: <span className="text-red-600 font-mono">excluir produto</span>
            </label>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => onConfirmationTextChange(e.target.value)}
              placeholder="excluir produto"
              className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono"
              disabled={isDeleting}
              autoFocus
            />
            {!isConfirmValid && confirmationText.length > 0 && (
              <p className="text-xs text-red-600 mt-1">O texto deve ser exatamente "excluir produto"</p>
            )}
          </div>

          {/* Queue Status */}
          {deleteQueue.length > 0 && deleteQueue.some(item => item.status !== 'pending') && (
            <div className="mb-6 bg-neutral-50 rounded-lg border border-neutral-200 p-4">
              <p className="text-xs font-bold text-neutral-700 mb-2 uppercase tracking-wide">
                Status da Fila de Exclusão
              </p>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {deleteQueue.map((item, idx) => {
                  const productName = deleteConfirm.productNames[idx] || 'Produto';
                  return (
                    <div key={item.id} className="flex items-center justify-between text-xs">
                      <span className="truncate flex-1">{productName}</span>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                        item.status === 'success' ? 'bg-green-100 text-green-700' :
                        item.status === 'failed' ? 'bg-red-100 text-red-700' :
                        item.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                        'bg-neutral-100 text-neutral-600'
                      }`}>
                        {item.status === 'success' ? '✓ Excluído' :
                         item.status === 'failed' ? '✗ Erro' :
                         item.status === 'processing' ? '⏳ Processando' :
                         '⏸ Aguardando'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="flex-1 px-4 py-3 bg-neutral-100 text-neutral-700 rounded-xl font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting || !isConfirmValid}
              className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <X className="w-4 h-4" />
                  Excluir {deleteConfirm.productIds.length} Produto{deleteConfirm.productIds.length !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
