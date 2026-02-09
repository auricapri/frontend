/**
 * Customer Info Section
 */
import React from 'react';
import { User, Loader2 } from 'lucide-react';
import type { CustomerInfoProps } from '../types';

export const CustomerInfo: React.FC<CustomerInfoProps> = ({
  userId,
  customerData,
  loadingCustomer,
}) => {
  if (!userId) return null;

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-200 shadow-xl">
      <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-6 flex items-center gap-2">
        <User className="w-4 h-4" /> Dados do Cliente
      </h5>
      {loadingCustomer ? (
        <div className="flex items-center gap-3 text-neutral-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm font-bold">Carregando dados do cliente...</span>
        </div>
      ) : customerData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400 block mb-2">
              Nome Completo
            </span>
            <p className="text-sm font-bold text-neutral-900">
              {customerData.full_name || 'N/A'}
            </p>
          </div>
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400 block mb-2">
              Email
            </span>
            <a
              href={`mailto:${customerData.email}`}
              className="text-sm font-bold text-blue-600 hover:underline"
            >
              {customerData.email || 'N/A'}
            </a>
          </div>
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400 block mb-2">
              Telefone
            </span>
            <a
              href={`tel:${customerData.phone}`}
              className="text-sm font-bold text-blue-600 hover:underline"
            >
              {customerData.phone || 'N/A'}
            </a>
          </div>
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400 block mb-2">
              ID do Usuário
            </span>
            <p className="text-sm font-mono font-bold text-neutral-600">
              {userId.slice(0, 8)}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-sm font-bold text-neutral-400">
          Dados do cliente não encontrados
        </p>
      )}
    </div>
  );
};
