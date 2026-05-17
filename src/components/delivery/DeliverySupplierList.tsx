import React, { useMemo } from 'react';
import { Store, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { type DeliverySupplierGroup } from '../../api/delivery.api';

export function DeliverySupplierList(props: {
  groups: DeliverySupplierGroup[];
  selectedSupplierId: string | null;
  onSelectSupplier: (supplierId: string) => void;
}) {
  const { groups, selectedSupplierId, onSelectSupplier } = props;

  const sorted = useMemo(() => {
    return [...groups].sort((a, b) => {
      const aRemaining = a.total_items - a.picked_up_items;
      const bRemaining = b.total_items - b.picked_up_items;
      if (aRemaining !== bRemaining) return bRemaining - aRemaining;
      return (a.supplier?.store_name || '').localeCompare(b.supplier?.store_name || '');
    });
  }, [groups]);

  if (sorted.length === 0) {
    return (
      <div className="p-6 text-center">
        <Store className="w-8 h-8 text-neutral-200 mx-auto mb-2" />
        <div className="text-xs text-neutral-400">Nenhum fornecedor encontrado</div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-neutral-100">
      {sorted.map((group) => {
        const isSelected = selectedSupplierId === group.supplier_id;
        const remaining = group.total_items - group.picked_up_items;
        const hasPending = remaining > 0;

        return (
          <button
            key={group.supplier_id}
            type="button"
            onClick={() => onSelectSupplier(group.supplier_id)}
            className={
              `w-full text-left px-3 py-3 md:px-4 hover:bg-neutral-50 active:bg-neutral-100 transition-all focus:outline-none ` +
              (isSelected ? 'bg-neutral-50 border-l-2 border-black' : 'border-l-2 border-transparent')
            }
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold uppercase tracking-tight truncate">
                  {group.supplier?.store_name || 'Fornecedor'}
                </div>
                <div className="text-[10px] text-neutral-400 mt-0.5">
                  {group.picked_up_items}/{group.total_items} coletados
                </div>
              </div>

              <div className="flex-shrink-0">
                {hasPending ? (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold">
                    <AlertTriangle className="w-3 h-3" />
                    {remaining}
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-50 text-green-600 text-[10px] font-bold">
                    <CheckCircle2 className="w-3 h-3" />
                    OK
                  </div>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
