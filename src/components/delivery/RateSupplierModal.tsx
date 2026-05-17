import React, { useMemo, useState } from 'react';
import { Star, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { SuppliersApi } from '../../api/suppliers.api';

export function RateSupplierModal(props: {
  isOpen: boolean;
  onClose: () => void;
  supplierId: string | null;
  supplierName: string;
  onRated: () => void;
}) {
  const { isOpen, onClose, supplierId, supplierName, onRated } = props;
  const api = useMemo(() => new SuppliersApi(), []);

  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = !!supplierId && rating >= 1 && rating <= 5 && !isLoading;

  const reset = () => {
    setRating(0);
    setComment('');
    setError('');
    setIsLoading(false);
  };

  const handleClose = () => {
    if (!isLoading) {
      reset();
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (!supplierId) return;
    if (rating < 1 || rating > 5) {
      setError('Selecione uma nota de 1 a 5');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await api.createReview(supplierId, rating, comment.trim() ? comment.trim() : null);
      onRated();
      reset();
      onClose();
    } catch (e: any) { // allow: pragmatic any
      setError(e?.message || 'Falha ao registrar avaliação');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Avaliar fornecedor" size="md">
      <div className="space-y-6">
        <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4">
          <div className="text-xs font-bold uppercase tracking-widest text-neutral-500">Fornecedor</div>
          <div className="text-sm font-black uppercase tracking-tight mt-1">{supplierName || 'Fornecedor'}</div>
        </div>

        {error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800 font-medium">{error}</div>
          </div>
        ) : null}

        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-neutral-600 mb-2">Nota</div>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => {
              const active = rating >= n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className={
                    `p-3 rounded-xl border transition-all active:scale-[0.99] ` +
                    (active ? 'bg-black border-black text-white' : 'bg-paper border-neutral-200 text-neutral-600 hover:border-black')
                  }
                >
                  <Star className="w-5 h-5" />
                </button>
              );
            })}
            <div className="ml-2 text-sm font-bold text-neutral-700">{rating ? `${rating}/5` : '—'}</div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-neutral-600 mb-2">Comentário</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="Opcional"
            className="w-full px-4 py-3 bg-paper border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black transition-all"
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="px-5 py-3 rounded-xl bg-neutral-100 text-neutral-800 text-xs font-black uppercase tracking-widest hover:bg-neutral-200 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-5 py-3 rounded-xl bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-neutral-800 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Salvando...' : 'Salvar avaliação'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
