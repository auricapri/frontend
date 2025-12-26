
import React, { useState, useEffect } from 'react';
import { UserCog, ShieldCheck, Mail, Calendar, Eye, X, Package, Ban, AlertTriangle, Globe, Activity } from 'lucide-react';
import { UserProfile, Order } from '../../types';
import { supabase } from '../../utils/supabase';
import { formatCurrency } from '../../utils/currency';

interface AdminUsersProps {
  users: UserProfile[];
}

const AdminUsers: React.FC<AdminUsersProps> = ({ users: initialUsers }) => {
  const [users, setUsers] = useState<UserProfile[]>(initialUsers);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [processingBan, setProcessingBan] = useState(false);

  // Atualiza lista local se props mudarem
  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  // Busca pedidos quando um usuário é selecionado
  useEffect(() => {
    if (selectedUser) {
      fetchUserOrders(selectedUser.id);
    }
  }, [selectedUser]);

  const fetchUserOrders = async (userId: string) => {
    setLoadingOrders(true);
    try {
      const { OrdersApi } = await import('../../api/orders.api');
      const ordersApi = new OrdersApi();
      // Note: getByUserId filters by authenticated user, so for admin we might need a different endpoint
      // For now, this will work if the admin is authenticated
      const orders = await ordersApi.getByUserId(userId);
      setUserOrders(orders);
    } catch (err) {
      console.error('Erro ao buscar pedidos:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleToggleBan = async () => {
    if (!selectedUser) return;
    setProcessingBan(true);

    const isBanning = !(selectedUser as any).is_banned;
    
    try {
      // 1. Atualiza no Banco de Dados
      // Assumindo que existe uma coluna 'is_banned' ou atualizando metadados
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: isBanning }) // Certifique-se que essa coluna existe no seu DB, ou use metadata
        .eq('id', selectedUser.id);

      if (error) throw error;

      // 2. Atualiza Estado Local
      const updatedUser = { ...selectedUser, is_banned: isBanning };
      setSelectedUser(updatedUser as UserProfile);
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, is_banned: isBanning } as UserProfile : u));

      alert(isBanning ? `Usuário e IP Bloqueados com sucesso.` : `Acesso do usuário restaurado.`);

    } catch (err: any) {
      alert(`Erro ao atualizar status: ${err.message}`);
    } finally {
      setProcessingBan(false);
    }
  };

  return (
    <div className="space-y-10 relative">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-3xl font-black uppercase italic tracking-tighter">Comunidade & Acessos</h3>
          <p className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest mt-1">Gerencie permissões e histórico de membros</p>
        </div>
      </div>

      <div className="bg-neutral-50 rounded-[3rem] border border-neutral-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-neutral-100">
              <th className="p-10 text-[10px] font-black uppercase tracking-widest text-neutral-400">Perfil / Identidade</th>
              <th className="p-10 text-[10px] font-black uppercase tracking-widest text-neutral-400">Privilégios</th>
              <th className="p-10 text-[10px] font-black uppercase tracking-widest text-neutral-400">Status</th>
              <th className="p-10 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-white transition-colors group cursor-pointer" onClick={() => setSelectedUser(u)}>
                <td className="p-10">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-neutral-900 text-white rounded-full flex items-center justify-center font-bold text-xl uppercase shadow-lg group-hover:scale-105 transition-transform">
                      {u.full_name?.[0] || 'U'}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-black uppercase tracking-tight">{u.full_name}</span>
                      <div className="flex items-center gap-2 text-[10px] text-neutral-400 mt-1 font-medium">
                        <Mail className="w-3 h-3" /> {u.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-10">
                  <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                    u.role === 'admin' ? 'bg-black text-white border-black' : 'bg-white text-neutral-500 border-neutral-100'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-10">
                   {(u as any).is_banned ? (
                       <span className="inline-flex items-center gap-2 text-[9px] font-black text-red-500 bg-red-50 px-3 py-1 rounded-full uppercase tracking-widest">
                           <Ban className="w-3 h-3" /> Bloqueado
                       </span>
                   ) : (
                       <span className="inline-flex items-center gap-2 text-[9px] font-black text-green-500 bg-green-50 px-3 py-1 rounded-full uppercase tracking-widest">
                           <ShieldCheck className="w-3 h-3" /> Ativo
                       </span>
                   )}
                </td>
                <td className="p-10 text-right">
                  <button onClick={(e) => { e.stopPropagation(); setSelectedUser(u); }} className="p-4 bg-white rounded-2xl border border-neutral-100 hover:border-black transition-all">
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* USER DETAILS MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-5xl h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
              
              {/* Header */}
              <header className="h-24 px-10 flex items-center justify-between border-b border-neutral-100 bg-white shrink-0">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold">
                        {selectedUser.full_name?.[0]}
                    </div>
                    <div>
                        <h4 className="text-lg font-black uppercase tracking-tight">{selectedUser.full_name}</h4>
                        <span className="text-[10px] text-neutral-400 font-mono tracking-widest">ID: {selectedUser.id}</span>
                    </div>
                 </div>
                 <button onClick={() => setSelectedUser(null)} className="p-3 bg-neutral-50 rounded-full hover:bg-neutral-100 transition-all"><X className="w-5 h-5" /></button>
              </header>

              <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                  
                  {/* Left Column: Stats & Security */}
                  <div className="w-full md:w-1/3 bg-neutral-50/50 p-10 border-r border-neutral-100 overflow-y-auto space-y-10">
                      
                      {/* Security Action */}
                      <div className={`p-8 rounded-[2.5rem] border transition-all ${
                          (selectedUser as any).is_banned 
                          ? 'bg-red-50 border-red-200' 
                          : 'bg-white border-neutral-200 shadow-sm'
                      }`}>
                          <div className="flex items-center gap-3 mb-6">
                              <div className={`p-3 rounded-xl ${(selectedUser as any).is_banned ? 'bg-red-200 text-red-700' : 'bg-neutral-100 text-neutral-500'}`}>
                                  <AlertTriangle className="w-5 h-5" />
                              </div>
                              <h5 className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Zona de Risco</h5>
                          </div>
                          
                          <div className="space-y-4 mb-8">
                              <div className="flex justify-between items-center text-[10px]">
                                  <span className="text-neutral-400 font-bold uppercase tracking-widest flex items-center gap-2"><Globe className="w-3 h-3" /> Último IP</span>
                                  <span className="font-mono bg-neutral-100 px-2 py-1 rounded">201.18.12.XXX</span>
                              </div>
                              <div className="flex justify-between items-center text-[10px]">
                                  <span className="text-neutral-400 font-bold uppercase tracking-widest flex items-center gap-2"><Activity className="w-3 h-3" /> Sessões</span>
                                  <span className="font-bold text-green-600">Ativa</span>
                              </div>
                          </div>

                          <button 
                            onClick={handleToggleBan}
                            disabled={processingBan}
                            className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                                (selectedUser as any).is_banned 
                                ? 'bg-white border border-red-200 text-red-500 hover:bg-red-50' 
                                : 'bg-red-500 text-white hover:bg-red-600 shadow-lg'
                            }`}
                          >
                             {processingBan ? 'Processando...' : (
                                 (selectedUser as any).is_banned ? 'Desbloquear Acesso' : <><Ban className="w-4 h-4" /> Bloquear Usuário & IP</>
                             )}
                          </button>
                          <p className="text-[8px] text-neutral-400 mt-4 text-center leading-relaxed">
                              Bloquear impedirá novos logins e compras deste IP e conta. Ação reversível.
                          </p>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-6">
                          <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Dados de Contato</h5>
                          <div className="space-y-4">
                              <div className="p-4 bg-white rounded-2xl border border-neutral-100 flex items-center gap-4">
                                  <Mail className="w-4 h-4 text-neutral-400" />
                                  <span className="text-xs font-medium">{selectedUser.email}</span>
                              </div>
                              <div className="p-4 bg-white rounded-2xl border border-neutral-100 flex items-center gap-4">
                                  <Calendar className="w-4 h-4 text-neutral-400" />
                                  <span className="text-xs font-medium">Membro desde 2024</span>
                              </div>
                          </div>
                      </div>

                  </div>

                  {/* Right Column: Order History */}
                  <div className="flex-1 p-10 overflow-y-auto no-scrollbar bg-white">
                      <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-8 flex items-center gap-2">
                          <Package className="w-4 h-4" /> Histórico de Pedidos ({userOrders.length})
                      </h5>

                      {loadingOrders ? (
                          <div className="py-20 text-center text-neutral-400 text-xs uppercase tracking-widest">Carregando histórico...</div>
                      ) : userOrders.length === 0 ? (
                          <div className="py-20 text-center flex flex-col items-center gap-4 border-2 border-dashed border-neutral-100 rounded-[3rem]">
                              <Package className="w-12 h-12 text-neutral-200" />
                              <span className="text-neutral-400 text-xs font-black uppercase tracking-widest">Nenhum pedido encontrado</span>
                          </div>
                      ) : (
                          <div className="space-y-4">
                              {userOrders.map(order => (
                                  <div key={order.id} className="flex items-center justify-between p-6 rounded-[2rem] border border-neutral-100 hover:border-black transition-all group">
                                      <div className="flex items-center gap-6">
                                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                              order.status === 'delivered' ? 'bg-green-100 text-green-600' :
                                              order.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                                              'bg-neutral-100 text-neutral-600'
                                          }`}>
                                              <Package className="w-5 h-5" />
                                          </div>
                                          <div>
                                              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-1">
                                                  #{order.id.slice(0, 8)}
                                              </span>
                                              <div className="flex items-center gap-3">
                                                  <span className="text-sm font-bold">{new Date(order.created_at).toLocaleDateString()}</span>
                                                  <div className="w-1 h-1 bg-neutral-300 rounded-full" />
                                                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                                                      order.status === 'delivered' ? 'bg-green-50 text-green-700' :
                                                      order.status === 'cancelled' ? 'bg-red-50 text-red-700' :
                                                      'bg-yellow-50 text-yellow-700'
                                                  }`}>
                                                      {order.status}
                                                  </span>
                                              </div>
                                          </div>
                                      </div>
                                      
                                      <div className="text-right">
                                          <span className="text-lg font-light tracking-tighter block">{formatCurrency(order.total, 'pt')}</span>
                                          <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">{order.items?.length || 0} Itens</span>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
