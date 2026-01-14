
import React, { useMemo } from 'react';
import { ShoppingCart, CreditCard, XCircle, User, ArrowRight } from 'lucide-react';
import { CartSession } from '../../types';
import { Locale } from '../../i18n';

interface AdminCartsProps {
  carts: CartSession[];
  locale: Locale;
}

const formatTime = (isoString: string, locale: Locale) => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
  
  if (diffMins < 60) return `${diffMins} min atrás`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h atrás`;
  return date.toLocaleDateString(locale);
};

const CartCard: React.FC<{ session: CartSession, type: 'active' | 'checkout' | 'abandoned', locale: Locale }> = ({ session, type, locale }) => (
  <div className="bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm hover:shadow-md transition-all group">
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-500 font-bold uppercase text-xs">
          {session.user_name.charAt(0)}
        </div>
        <div>
          <h4 className="text-[11px] font-black uppercase tracking-tight">{session.user_name}</h4>
          <span className="text-[9px] text-neutral-400 font-medium flex items-center gap-1">
            <User className="w-3 h-3" /> {session.user_email}
          </span>
        </div>
      </div>
      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
        type === 'active' ? 'bg-blue-50 text-blue-600' :
        type === 'checkout' ? 'bg-green-50 text-green-600' :
        'bg-red-50 text-red-600'
      }`}>
        {formatTime(session.last_updated, locale)}
      </span>
    </div>

    <div className="space-y-3 mb-6 bg-neutral-50/50 p-4 rounded-xl border border-neutral-50">
      {session.items_preview.slice(0, 2).map((item, idx) => (
        <div key={idx} className="flex items-center justify-between text-[10px]">
          <span className="font-medium text-neutral-600 truncate max-w-[120px]">{typeof item.name === 'string' ? item.name : (item.name as any)[locale] || Object.values(item.name)[0]}</span>
          <span className="text-neutral-400">x{item.quantity}</span>
        </div>
      ))}
      {session.items_count > 2 && (
        <p className="text-[9px] text-neutral-400 italic">+ {session.items_count - 2} outros itens...</p>
      )}
    </div>

    <div className="flex justify-between items-center pt-2 border-t border-neutral-50">
      <div className="flex flex-col">
        <span className="text-[8px] font-black uppercase tracking-widest text-neutral-300">Total Previsto</span>
        <span className="text-sm font-black text-neutral-900">${session.total_value.toFixed(2)}</span>
      </div>
      {type === 'abandoned' ? (
         <button className="text-[9px] font-bold text-red-400 uppercase tracking-widest hover:text-red-600 flex items-center gap-1">
           Recuperar <ArrowRight className="w-3 h-3" />
         </button>
      ) : (
         <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      )}
    </div>
  </div>
);

const AdminCarts: React.FC<AdminCartsProps> = ({ carts, locale }) => {
  
  const { active, checkout, abandoned } = useMemo(() => {
    return {
      active: carts.filter(c => c.status === 'active'),
      checkout: carts.filter(c => c.status === 'checkout_started'),
      abandoned: carts.filter(c => c.status === 'abandoned'),
    };
  }, [carts]);

  return (
    <div className="h-full flex flex-col space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-3xl font-black uppercase italic tracking-tighter">Carrinhos em Tempo Real</h3>
          <p className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest mt-1">Monitoramento de conversão e abandono</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-neutral-900 text-white p-6 rounded-[2.5rem] flex items-center justify-between shadow-xl">
           <div>
              <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Navegando Agora</span>
              <h4 className="text-3xl font-light tracking-tighter mt-2">{active.length}</h4>
           </div>
           <div className="p-3 bg-white/10 rounded-2xl"><ShoppingCart className="w-6 h-6" /></div>
        </div>
        <div className="bg-green-500 text-white p-6 rounded-[2.5rem] flex items-center justify-between shadow-xl">
           <div>
              <span className="text-[9px] font-black uppercase tracking-widest opacity-80">No Checkout</span>
              <h4 className="text-3xl font-light tracking-tighter mt-2">{checkout.length}</h4>
           </div>
           <div className="p-3 bg-white/20 rounded-2xl"><CreditCard className="w-6 h-6" /></div>
        </div>
        <div className="bg-white border border-neutral-100 p-6 rounded-[2.5rem] flex items-center justify-between shadow-sm">
           <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Abandonados (24h)</span>
              <h4 className="text-3xl font-light tracking-tighter mt-2 text-neutral-900">{abandoned.length}</h4>
           </div>
           <div className="p-3 bg-neutral-50 rounded-2xl text-red-400"><XCircle className="w-6 h-6" /></div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex gap-8 h-full min-w-[1000px]">
          
          {/* COLUNA 1: ATIVOS */}
          <div className="flex-1 flex flex-col bg-neutral-50/50 rounded-[3rem] border border-neutral-100 p-6">
             <header className="flex items-center gap-3 mb-6 px-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Carrinhos Ativos</h4>
                <span className="ml-auto text-[9px] font-bold text-neutral-300">{active.length}</span>
             </header>
             <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-2">
                {active.map(s => <CartCard key={s.id} session={s} type="active" locale={locale} />)}
             </div>
          </div>

          {/* COLUNA 2: CHECKOUT */}
          <div className="flex-1 flex flex-col bg-neutral-50/50 rounded-[3rem] border border-neutral-100 p-6">
             <header className="flex items-center gap-3 mb-6 px-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Pagamento Iniciado</h4>
                <span className="ml-auto text-[9px] font-bold text-neutral-300">{checkout.length}</span>
             </header>
             <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-2">
                {checkout.map(s => <CartCard key={s.id} session={s} type="checkout" locale={locale} />)}
             </div>
          </div>

          {/* COLUNA 3: ABANDONADOS */}
          <div className="flex-1 flex flex-col bg-neutral-50/50 rounded-[3rem] border border-neutral-100 p-6">
             <header className="flex items-center gap-3 mb-6 px-2">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Abandonados</h4>
                <span className="ml-auto text-[9px] font-bold text-neutral-300">{abandoned.length}</span>
             </header>
             <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-2">
                {abandoned.map(s => <CartCard key={s.id} session={s} type="abandoned" locale={locale} />)}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminCarts;
