
import React, { useState } from 'react';
import { Plus, AlertTriangle, Trash2, CheckSquare, Square, Store } from 'lucide-react';
import { Product } from '../../types';
import { Supplier } from '../../types/suppliers';
import { Locale } from '../../i18n';

interface AdminInventoryProps {
  products: Product[];
  suppliers?: Supplier[];
  onEdit: (product: Product) => void;
  onDelete: (ids: string[]) => void;
  onAdd: () => void;
  locale: Locale;
}

const AdminInventory: React.FC<AdminInventoryProps> = ({ products, suppliers = [], onEdit, onDelete, onAdd, locale }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Helper robusto para LocalizedText
  const getLoc = (obj: any): string => {
    if (obj === null || obj === undefined) return "";
    if (typeof obj === 'string') {
      if (obj.trim().startsWith('{')) {
        try { return getLoc(JSON.parse(obj)); } catch { return obj; }
      }
      return obj;
    }
    if (typeof obj === 'object') {
      const val = obj[locale] || obj['pt'] || obj['en'] || obj['es'] || obj['fr'];
      if (typeof val === 'string') return val;
      const first = Object.values(obj).find(v => typeof v === 'string');
      return (first as string) || "";
    }
    return String(obj);
  };

  const toggleSelection = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map(p => p.id)));
    }
  };

  const handleDeleteSelected = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIds.size > 0) {
      onDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    }
  };

  const handleSingleDelete = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete([productId]);
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {!isSelectionMode ? (
            <button
              onClick={() => setIsSelectionMode(true)}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-xl font-medium hover:bg-neutral-200 transition-colors"
            >
              <CheckSquare className="w-4 h-4" />
              Selecionar Produtos
            </button>
          ) : (
            <>
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-xl font-medium hover:bg-neutral-200 transition-colors"
              >
                {selectedIds.size === products.length ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                {selectedIds.size === products.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </button>
              <span className="text-sm text-neutral-600 font-medium">
                {selectedIds.size} produto{selectedIds.size !== 1 ? 's' : ''} selecionado{selectedIds.size !== 1 ? 's' : ''}
              </span>
              {selectedIds.size > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir Selecionados ({selectedIds.size})
                </button>
              )}
              <button
                onClick={() => {
                  setIsSelectionMode(false);
                  setSelectedIds(new Set());
                }}
                className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded-xl font-medium hover:bg-neutral-300 transition-colors"
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {products.map(p => {
          const totalStock = p.variants?.reduce((acc, v) => acc + (v.stock_quantity || 0), 0) || 0;
          const isLowStock = totalStock <= 10;
          const isSelected = selectedIds.has(p.id);

          return (
            <div 
              key={p.id} 
              className={`bg-neutral-50 rounded-[2.5rem] p-6 border group hover:border-black transition-all cursor-pointer flex flex-col shadow-sm relative ${
                isLowStock ? 'border-orange-200' : 'border-neutral-100'
              } ${isSelected ? 'ring-2 ring-red-500 border-red-500' : ''}`}
              onClick={() => !isSelectionMode && onEdit(p)}
            >
              {/* Checkbox - appears in selection mode */}
              {isSelectionMode && (
                <div
                  onClick={(e) => toggleSelection(p.id, e)}
                  className="absolute top-6 left-6 z-20 cursor-pointer"
                >
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                    isSelected 
                      ? 'bg-red-500 border-red-500' 
                      : 'bg-white border-neutral-300 hover:border-red-400'
                  }`}>
                    {isSelected && (
                      <CheckSquare className="w-4 h-4 text-white" />
                    )}
                  </div>
                </div>
              )}

              <div className="aspect-[3/4] bg-white rounded-[1.5rem] overflow-hidden mb-6 relative border border-neutral-100 shadow-inner">
                <img 
                  src={p.default_image_url || p.base_images?.[0]} 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
                  alt=""
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-neutral-100">
                  {p.variants?.length || 0} Variants
                </div>
                
                {isLowStock && (
                  <div className="absolute bottom-4 left-4 bg-red-500 text-white px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg animate-pulse">
                     <AlertTriangle className="w-3 h-3" /> Estoque Baixo ({totalStock})
                  </div>
                )}
              </div>
              <div className="flex justify-between items-start gap-4">
                <h3 className="text-[11px] font-black uppercase truncate">{getLoc(p.name)}</h3>
                <span className={`w-2 h-2 rounded-full flex-none mt-1 ${p.is_active ? 'bg-green-400' : 'bg-red-400'}`} />
              </div>
              <p className="text-[9px] text-neutral-400 font-bold uppercase mt-1 tracking-widest">
                SKU: {p.variants?.[0]?.sku || 'Sem SKUs'}
              </p>
              {p.supplier_id && (
                <div className="flex items-center gap-2 mt-2 text-[9px] text-neutral-500">
                  <Store className="w-3 h-3" />
                  <span className="font-bold uppercase">
                    {suppliers.find(s => s.id === p.supplier_id)?.store_name || 'Fornecedor não encontrado'}
                  </span>
                </div>
              )}
              
              {/* Delete button - appears on hover when not in selection mode */}
              {!isSelectionMode && (
                <button
                  onClick={(e) => handleSingleDelete(p.id, e)}
                  className="absolute top-6 right-6 p-3 bg-red-500 text-white rounded-full shadow-xl hover:scale-110 transition-all opacity-0 group-hover:opacity-100 z-10"
                  title="Excluir produto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
        <button 
          onClick={onAdd}
          className="border-2 border-dashed border-neutral-200 rounded-[3rem] min-h-[350px] flex flex-col items-center justify-center text-neutral-300 hover:border-black hover:text-black hover:bg-neutral-50 transition-all group"
        >
          <Plus className="w-12 h-12 mb-4 group-hover:rotate-90 transition-all" />
          <span className="text-[10px] font-black uppercase tracking-widest">Novo Produto Master</span>
        </button>
      </div>
    </div>
  );
};

export default AdminInventory;
