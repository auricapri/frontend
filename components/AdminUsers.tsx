
import React from 'react';
import { UserCog, ShieldCheck, Mail, Calendar } from 'lucide-react';
import { UserProfile } from '../types';

interface AdminUsersProps {
  users: UserProfile[];
}

const AdminUsers: React.FC<AdminUsersProps> = ({ users }) => {
  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-3xl font-black uppercase italic tracking-tighter">Comunidade & Acessos</h3>
          <p className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest mt-1">Gerencie permissões de membros</p>
        </div>
      </div>

      <div className="bg-neutral-50 rounded-[3rem] border border-neutral-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-neutral-100">
              <th className="p-10 text-[10px] font-black uppercase tracking-widest text-neutral-400">Perfil / Identidade</th>
              <th className="p-10 text-[10px] font-black uppercase tracking-widest text-neutral-400">Privilégios</th>
              <th className="p-10 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-white transition-colors group">
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
                <td className="p-10 text-right">
                  <button className="p-4 bg-white rounded-2xl border border-neutral-100 hover:border-black transition-all">
                    <UserCog className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;
