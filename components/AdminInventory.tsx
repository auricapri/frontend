
import React from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import { Product } from '../types';
import { Locale } from '../i18n';

interface AdminInventoryProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  locale: Locale;
}

const AdminInventory: React.FC<AdminInventoryProps> = ({ products, onEdit, onDelete, onAdd, locale }) => {
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      {products.map(p => {
        const totalStock = p.variants?.reduce((acc, v) => acc + (v.stock_quantity || 0), 0) || 0;
        const isLowStock = totalStock <= 10;

        return (
          <div 
            key={p.id} 
            className={`bg-neutral-50 rounded-[2.5rem] p-6 border group hover:border-black transition-all cursor-pointer flex flex-col shadow-sm ${isLowStock ? 'border-orange-200' : 'border-neutral-100'}`}
            onClick={() => onEdit(p)}
          >
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
  );
};

export default AdminInventory;
