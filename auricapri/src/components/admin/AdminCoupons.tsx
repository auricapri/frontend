
import React from 'react';
import { Ticket, Plus, Tag, ShoppingBag, Edit3 } from 'lucide-react';
import { Coupon, Product, GlobalFinancialSettings } from '../../types';

interface AdminCouponsProps {
  coupons: Coupon[];
  products?: Product[]; // Optional to prevent breaking changes immediately, but needed for editor
  financials?: GlobalFinancialSettings;
  onEdit: (coupon: Coupon) => void;
  onAdd: () => void;
  // Props extras passadas pelo parent para o editor, se necessário renderizar o editor aqui dentro (mas estamos usando modal global no dashboard)
  // No design atual, AdminDashboard gerencia o estado de edição.
}

const AdminCoupons: React.FC<AdminCouponsProps> = ({ coupons, onAdd, onEdit }) => {
  return (
    <div className="space-y-12">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-3xl font-black uppercase italic tracking-tighter">Ofertas & Cupons</h3>
          <p className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest mt-1">Gerencie estratégias de desconto com proteção de margem</p>
        </div>
        <button onClick={onAdd} className="px-10 py-4 bg-black text-white rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl flex items-center gap-4 hover:scale-105 transition-all">
          <Plus className="w-5 h-5" /> Nova Oferta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {coupons.map(c => (
          <div key={c.id} onClick={() => onEdit(c)} className="bg-neutral-50 p-10 rounded-[3rem] border border-neutral-100 relative group cursor-pointer hover:border-black transition-all shadow-sm">
            <div className="absolute top-8 right-8 flex gap-3">
               {c.product_ids && c.product_ids.length > 0 && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                     <Tag className="w-3 h-3" /> {c.product_ids.length} Itens
                  </span>
               )}
               <div className={`w-3 h-3 rounded-full ${c.is_active ? 'bg-green-500' : 'bg-red-500'} shadow-lg mt-1`} />
            </div>
            
            <div className="flex items-center gap-4 mb-8 text-neutral-300 group-hover:text-black transition-colors">
              <Ticket className="w-8 h-8" strokeWidth={1} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Promocode</span>
            </div>

            <h4 className="text-3xl font-mono font-black uppercase tracking-tighter mb-4">{c.code}</h4>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-neutral-400">
                <Tag className="w-3 h-3" />
                <span>{c.discount_value}{c.discount_type === 'percentage' ? '%' : '$'} Desconto</span>
              </div>
              {c.min_purchase_amount && (
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-neutral-400">
                  <ShoppingBag className="w-3 h-3" />
                  <span>Min: ${c.min_purchase_amount}</span>
                </div>
              )}
            </div>
            
            <div className="mt-10 pt-8 border-t border-neutral-100 flex justify-between items-center">
              <span className="text-[8px] font-black uppercase text-neutral-300">Expiração: {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'Ilimitado'}</span>
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest group-hover:underline">
                 <Edit3 className="w-3 h-3" /> Editar
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCoupons;
