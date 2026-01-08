
import React, { useState, useEffect } from 'react';
import { 
  User, 
  Package, 
  Ticket, 
  ChevronRight, 
  Copy, 
  Check, 
  Loader2, 
  Phone, 
  ShoppingBag,
  ArrowLeft,
  X,
  Truck,
  Star,
  Download,
  Trophy,
  LogOut,
  DollarSign
} from 'lucide-react';
import { UserProfile, Order, OrderItem } from '../../types';
import { Locale } from '../../i18n';
import { supabase } from '../../utils/supabase';
import { OrderReceipt } from '../orders';
import { formatCurrency } from '../../utils/currency';

interface UserProfileViewProps {
  user: UserProfile;
  t: (key: string) => any;
  locale: Locale;
  onUpdate: (user: UserProfile) => void;
  onLogout?: () => void;
  storeConfig?: any;
}

const UserProfileView: React.FC<UserProfileViewProps> = ({ user, t, locale, onUpdate, onLogout, storeConfig }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'affiliate'>('profile');
  const [isUpdating, setIsUpdating] = useState(false);
  const [fullName, setFullName] = useState(user.full_name);
  const [viewingReceiptOrder, setViewingReceiptOrder] = useState<Order | null>(null);
  
  const getPhonePrefix = (loc: Locale) => {
    switch (loc) {
      case 'pt': return '+55 ';
      case 'en': return '+1 ';
      case 'es': return '+34 ';
      case 'fr': return '+33 ';
      default: return '';
    }
  };

  const [phone, setPhone] = useState(user.phone || getPhonePrefix(locale));

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [orderReviews, setOrderReviews] = useState<Record<string, boolean>>({});

  const getLoc = (obj: any) => {
    if (!obj) return "";
    if (typeof obj === 'string') return obj;
    return obj[locale] || obj['pt'] || obj['en'] || Object.values(obj)[0] || "";
  };

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
  }, [activeTab]);

  useEffect(() => {
    if (!user.phone) {
        const currentVal = phone.trim();
        const prefixes = ['+55', '+1', '+34', '+33'];
        if (currentVal === '' || prefixes.includes(currentVal)) {
            setPhone(getPhonePrefix(locale));
        }
    }
  }, [locale]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
        const { OrdersApi } = await import('../../api/orders.api');
        const { ProductReviewsApi } = await import('../../api/product-reviews.api');
        const ordersApi = new OrdersApi();
        const reviewsApi = new ProductReviewsApi();
        const orders = await ordersApi.getByUserId(user.id);
        setOrders(orders);

        const deliveredOrders = orders.filter(o => {
          const status = o.status?.toLowerCase();
          return status === 'delivered' || status === 'entregue';
        });

        const reviewsMap: Record<string, boolean> = {};
        for (const order of deliveredOrders) {
          try {
            const items = await reviewsApi.getOrderItemsForReview(order.id, user.id);
            const hasAllReviews = items.length > 0 && items.every(item => item.has_review);
            reviewsMap[order.id] = hasAllReviews;
          } catch {
            reviewsMap[order.id] = false;
          }
        }
        setOrderReviews(reviewsMap);
    } catch (err: any) {
        console.error('Erro ao buscar pedidos:', err);
    } finally {
        setLoadingOrders(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const { UsersApi } = await import('../../api/users.api');
      const usersApi = new UsersApi();
      const updatedProfile = await usersApi.updateProfile({ 
        full_name: fullName, 
        phone 
      });
      
      onUpdate(updatedProfile);
      alert('Perfil atualizado com sucesso.');
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopyCode = () => {
    const code = user.affiliate_code || `AUR-${user.full_name.split(' ')[0].toUpperCase()}-${user.id.slice(0,4)}`;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (viewingReceiptOrder) {
      return (
          <div className="fixed inset-0 z-[200] bg-white overflow-y-auto">
              <OrderReceipt 
                  order={viewingReceiptOrder} 
                  onBack={() => setViewingReceiptOrder(null)} 
                  t={t} 
                  locale={locale} 
              />
          </div>
      );
  }

  // Loyalty Data
  const xp = user.loyalty?.current_xp || 0;
  const level = user.loyalty?.current_level || 1;
  const cashback = user.loyalty?.cashback_balance || 0;
  // Estimate next level: Assume linear 5000XP steps or simple logic for display
  const nextLevelXp = level < 4 ? (level === 1 ? 1000 : level === 2 ? 5000 : 15000) : xp * 1.5;
  const xpProgress = Math.min(100, (xp / nextLevelXp) * 100);

  return (
    <div className="flex flex-col h-full bg-white relative">
      
      {/* Tab Navigation */}
      <div className="flex bg-neutral-50 p-2 rounded-3xl border border-neutral-100 mx-8 mt-4 gap-1">
        {[
          { id: 'profile', label: t('auth.profile'), icon: User },
          { id: 'orders', label: t('auth.orderHistory'), icon: Package },
          { id: 'affiliate', label: t('auth.affiliate'), icon: Ticket },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id ? 'bg-black text-white shadow-lg' : 'text-neutral-400 hover:text-black'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
        {activeTab === 'profile' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             
             {/* LOYALTY CARD */}
             <div className="bg-neutral-900 text-white p-8 rounded-[3rem] border border-neutral-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10"><Trophy className="w-32 h-32 rotate-12" /></div>
                
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 block mb-1">Status Fidelidade</span>
                            <h3 className="text-2xl font-light tracking-tighter">Nível {level}</h3>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                            <span className="text-[10px] font-black uppercase tracking-widest">{formatCurrency(cashback, locale)} Cashback</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-white/60">
                            <span>{xp} XP</span>
                            <span>{nextLevelXp} XP</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-500 transition-all duration-1000" style={{ width: `${xpProgress}%` }}></div>
                        </div>
                        <p className="text-[9px] text-white/40 text-center pt-2">Continue comprando para subir de nível e ganhar cupons exclusivos.</p>
                    </div>
                </div>
             </div>

             <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 px-4">{t('admin.customer')}</label>
                  <input 
                    className="w-full p-6 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-black outline-none focus:bg-white focus:border-black transition-all"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 px-4">{t('auth.phone')}</label>
                  <div className="relative">
                    <input 
                      className="w-full p-6 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-black outline-none focus:bg-white focus:border-black transition-all pl-14"
                      placeholder="+55 11 99999-9999"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                    />
                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isUpdating}
                  className="w-full py-6 bg-black text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] shadow-xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
                >
                    {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>{t('auth.save')}</span>}
                </button>
             </form>

             {/* Logout Button */}
             {onLogout && (
                <button 
                  onClick={async () => {
                    await supabase.auth.signOut();
                    onLogout();
                  }}
                  className="w-full mt-6 py-6 bg-red-50 text-red-500 border border-red-100 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] shadow-sm hover:bg-red-100 hover:border-red-200 transition-all flex items-center justify-center gap-4 active:scale-95"
                >
                    <LogOut className="w-5 h-5" />
                    <span>{t('auth.logout')}</span>
                </button>
             )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {loadingOrders ? (
               <div className="py-20 flex flex-col items-center justify-center text-neutral-300 space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin" strokeWidth={1} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Carregando Histórico...</span>
               </div>
             ) : orders.length === 0 ? (
               <div className="py-20 text-center space-y-6">
                  <ShoppingBag className="w-12 h-12 text-neutral-100 mx-auto" />
                  <p className="text-sm text-neutral-400 font-medium">{t('auth.noOrders')}</p>
               </div>
             ) : (
               orders.map(order => {
                 const orderStatus = order.status?.toLowerCase();
                 const isDelivered = orderStatus === 'delivered' || orderStatus === 'entregue';
                 const hasReview = orderReviews[order.id] || false;
                 
                 return (
                 <div 
                   key={order.id} 
                   className="p-8 bg-neutral-50 rounded-[2.5rem] border border-neutral-100 group hover:border-black transition-all"
                 >
                    <div 
                      onClick={() => setSelectedOrder(order)}
                      className="flex justify-between items-center cursor-pointer"
                 >
                       <div className="space-y-2 flex-1">
                       <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">ID: {order.id.slice(0, 8)}</span>
                          {order.wishlist_slug && (
                            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full">
                              Wishlist
                            </span>
                          )}
                          {order.gift_from_user_id && (
                            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">
                              Presente
                            </span>
                          )}
                       </div>
                       <h4 className="text-sm font-black uppercase tracking-tight italic">{new Date(order.created_at).toLocaleDateString(locale)}</h4>
                       <div className="flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-full ${isDelivered ? 'bg-green-500' : 'bg-orange-400'}`} />
                          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">{order.status}</span>
                       </div>
                    </div>
                    <div className="text-right flex items-center gap-6">
                       <span className="text-xl font-light tracking-tighter">${order.total?.toFixed(2)}</span>
                       <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:translate-x-1 transition-transform" />
                    </div>
                 </div>
                    {isDelivered && (
                       <div className="mt-4 pt-4 border-t border-neutral-200">
                          {hasReview ? (
                             <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `/order-review/${order.id}`;
                                }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200 transition-colors text-sm font-medium"
                             >
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                Editar Avaliação
                             </button>
                          ) : (
                             <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `/order-review/${order.id}`;
                                }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm font-medium relative"
                             >
                                <Star className="w-4 h-4" />
                                <span>Avaliar Pedido</span>
                                {storeConfig?.loyalty_program?.review_cashback_amount && storeConfig.loyalty_program.review_cashback_amount > 0 && (
                                  <span className="ml-auto flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded">
                                    <DollarSign className="w-3 h-3" />
                                    +{formatCurrency(storeConfig.loyalty_program.review_cashback_amount, locale)}
                                  </span>
                                )}
                             </button>
                          )}
                       </div>
                    )}
                 </div>
               )})
             )}
          </div>
        )}

        {activeTab === 'affiliate' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="bg-neutral-900 text-white rounded-[3rem] p-10 md:p-12 text-center space-y-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <Ticket className="w-32 h-32 rotate-12" />
                </div>
                <div className="relative z-10 space-y-4">
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none">Auricapri Muse</h3>
                  <p className="text-xs text-white/40 max-w-xs mx-auto leading-relaxed uppercase tracking-widest font-black">
                    Compartilhe elegância e ganhe 10% de comissão em cada venda convertida.
                  </p>
                </div>

                <div className="relative z-10 space-y-3">
                   <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white/40">Seu Código Único</span>
                   <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] flex items-center justify-between group hover:border-white/40 transition-all">
                      <code className="text-2xl font-mono font-black uppercase tracking-[0.2em]">
                        {user.affiliate_code || `AUR-${user.full_name.split(' ')[0].toUpperCase()}-${user.id.slice(0,4)}`}
                      </code>
                      <button 
                        onClick={handleCopyCode}
                        className="p-4 bg-white text-black rounded-2xl hover:scale-110 active:scale-90 transition-all shadow-xl"
                      >
                         {copiedCode ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                   </div>
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-neutral-50 rounded-[2rem] border border-neutral-100 text-center">
                   <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-2">Total Ganhos</span>
                   <span className="text-2xl font-light tracking-tighter">$0.00</span>
                </div>
                <div className="p-6 bg-neutral-50 rounded-[2rem] border border-neutral-100 text-center">
                   <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-2">Vendas</span>
                   <span className="text-2xl font-light tracking-tighter">0</span>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Order Detail Overlay */}
      {selectedOrder && (
        <div className="absolute inset-0 z-20 bg-white flex flex-col animate-in slide-in-from-right duration-500">
           <header className="h-24 px-8 flex items-center justify-between border-b border-neutral-100">
              <button onClick={() => setSelectedOrder(null)} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-black">
                 <ArrowLeft className="w-4 h-4" /> {t('nav.back')}
              </button>
              <h4 className="text-sm font-black uppercase tracking-tight italic">Pedido {selectedOrder.id.slice(0, 8)}</h4>
              <button onClick={() => setSelectedOrder(null)} className="p-3 bg-neutral-50 rounded-full"><X className="w-4 h-4" /></button>
           </header>

           <div className="flex-1 overflow-y-auto p-8 no-scrollbar space-y-12">
              <div className="bg-neutral-50 p-8 rounded-[2.5rem] border border-neutral-100 space-y-8">
                 <div className="flex items-center gap-6">
                    <div className="p-4 bg-black text-white rounded-2xl"><Truck className="w-6 h-6" /></div>
                    <div>
                       <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{t('auth.tracking')}</span>
                       <p className="text-sm font-black uppercase tracking-tight">{selectedOrder.tracking_code || 'Aguardando Despacho'}</p>
                    </div>
                 </div>
                 {/* Visual Track Bar */}
                 <div className="relative h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div className="absolute inset-0 bg-black transition-all duration-1000" style={{ width: selectedOrder.status === 'delivered' ? '100%' : selectedOrder.status === 'shipped' ? '60%' : '15%' }} />
                 </div>
                 <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-neutral-400">
                    <span>Processando</span>
                    <span className={selectedOrder.status === 'shipped' || selectedOrder.status === 'delivered' ? 'text-black' : ''}>Enviado</span>
                    <span className={selectedOrder.status === 'delivered' ? 'text-black' : ''}>Entregue</span>
                 </div>
              </div>

              <div className="space-y-6">
                 <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-300 px-2">Itens do Pedido</h5>
                 {(selectedOrder.items || []).map((item) => (
                   <div key={item.id} className="flex items-center gap-6 p-4 rounded-3xl border border-neutral-50 hover:border-neutral-200 transition-all">
                      <img src={item.image} className="w-16 h-20 object-cover rounded-xl flex-none bg-neutral-100" />
                      <div className="flex-1">
                         <h6 className="text-[11px] font-black uppercase tracking-tight">{getLoc(item.name)}</h6>
                         <p className="text-[9px] text-neutral-400 uppercase font-bold tracking-widest mt-1">{getLoc(item.color_name)} | {item.size}</p>
                         <p className="text-[10px] font-black mt-1">Qtd: {item.quantity}</p>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                         <span className="text-sm font-black tracking-tighter">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                   </div>
                 ))}
              </div>

              <div className="pt-8 border-t border-neutral-100 space-y-6">
                 <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    <span>Total Pago</span>
                    <span className="text-xl text-black font-light tracking-tighter">${selectedOrder.total?.toFixed(2)}</span>
                 </div>
                 
                 <button 
                    onClick={() => setViewingReceiptOrder(selectedOrder)}
                    className="w-full py-5 border border-neutral-200 rounded-[2rem] flex items-center justify-center gap-3 hover:bg-neutral-50 transition-all text-[10px] font-black uppercase tracking-widest group"
                 >
                    <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Baixar Comprovante Fiscal
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileView;
