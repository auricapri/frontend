import React from 'react';
import { X } from 'lucide-react';

export function DiagramToolbar(props: {
  totalCount: number;
  totalSum: number;
  onClose: () => void;
}) {
  const { totalCount, totalSum, onClose } = props;

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
      <div>
        <h2 className="text-lg font-bold">Editor de Diagrama</h2>
        {totalCount > 0 && (
          <p className="text-xs text-neutral-500">
            {totalCount} variáveis | Total: <span className="font-bold text-emerald-600">R$ {Number(totalSum).toFixed(2)}</span>
          </p>
        )}
      </div>
      <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-xl transition-colors">
        <X className="w-5 h-5" />
      </button>
    </header>
  );
}

