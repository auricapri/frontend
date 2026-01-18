import React, { useMemo } from 'react';
import { Store, Package, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { type DeliverySupplierGroup } from '../../api/delivery.api';

function formatAddress(address: any): string {
  if (!address) return '';
  const parts = [
    address.logradouro,
    address.numero ? String(address.numero) : null,
    address.bairro ? String(address.bairro) : null,
    address.localidade ? String(address.localidade) : null,
    address.uf ? String(address.uf) : null,
  ].filter(Boolean);
  return parts.join(', ');
}

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
      <div className="bg-white rounded-2xl border border-neutral-100 p-8 text-center">
        <Store className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
        <div className="text-sm font-medium text-neutral-600">Nenhum fornecedor encontrado</div>
        <div className="text-xs text-neutral-400 mt-1">Tente atualizar em alguns instantes</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
      <div className="p-5 border-b border-neutral-100">
        <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Fornecedores</div>
        <div className="text-sm text-neutral-700 mt-1">Clique para ver itens e ações</div>
      </div>

      <div className="max-h-[calc(100vh-260px)] overflow-auto">
        {sorted.map((group) => {
          const isSelected = selectedSupplierId === group.supplier_id;
          const remaining = group.total_items - group.picked_up_items;
          const hasPending = remaining > 0;
          const address = formatAddress(group.supplier?.address);

          return (
            <button
              key={group.supplier_id}
              type="button"
              onClick={() => onSelectSupplier(group.supplier_id)}
              className={
                `w-full text-left p-5 border-b border-neutral-50 hover:bg-neutral-50 active:scale-[0.995] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30 ` +
                (isSelected ? 'bg-neutral-50 ring-1 ring-black/10' : '')
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-black uppercase tracking-tight truncate">
                    {group.supplier?.store_name || 'Fornecedor'}
                  </div>
                  {address ? (
                    <div className="text-xs text-neutral-500 mt-1 truncate">{address}</div>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs font-bold text-neutral-600">
                    <Package className="w-4 h-4" />
                    {group.total_items}
                  </div>
                  {hasPending ? (
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-800 text-[10px] font-bold uppercase tracking-widest">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {remaining}
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-widest">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      OK
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
