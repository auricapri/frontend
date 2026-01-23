import React from 'react';
import { Plus, Store, Star, Trash2, Edit, MapPin, Phone, Mail, Globe, Tag } from 'lucide-react';
import { Supplier } from '../../types/suppliers';

interface AdminSuppliersProps {
  suppliers: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

const AdminSuppliers: React.FC<AdminSuppliersProps> = ({ 
  suppliers, 
  onEdit, 
  onDelete, 
  onAdd 
}) => {
  const formatAddress = (address: any): string => {
    if (!address) return 'Sem endereço';
    const parts = [];
    if (address.logradouro) parts.push(address.logradouro);
    if (address.numero) parts.push(address.numero);
    if (address.bairro) parts.push(address.bairro);
    if (address.localidade) parts.push(address.localidade);
    if (address.uf) parts.push(address.uf);
    return parts.length > 0 ? parts.join(', ') : 'Sem endereço';
  };

  return (
    <div className="space-y-12 pb-24">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-4">
            <Store className="w-8 h-8" /> Fornecedores
          </h3>
          <p className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest mt-2">
            Gerencie todos os fornecedores do catálogo
          </p>
        </div>
        <button 
          onClick={onAdd} 
          className="px-8 py-4 bg-black text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 shadow-xl hover:scale-105 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Novo Fornecedor
        </button>
      </div>

      {suppliers.length === 0 ? (
        <div className="text-center py-24">
          <Store className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-400 font-medium">Nenhum fornecedor cadastrado</p>
          <button 
            onClick={onAdd}
            className="mt-6 px-6 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
          >
            Criar Primeiro Fornecedor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {suppliers.map(supplier => (
            <div 
              key={supplier.id} 
              className="bg-neutral-50 rounded-[2.5rem] border border-neutral-100 group hover:border-black transition-all overflow-hidden"
            >
              <div className="relative aspect-[16/9] bg-white overflow-hidden">
                {supplier.image_url ? (
                  <img 
                    src={supplier.image_url} 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
                    alt={supplier.store_name} 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-200 bg-neutral-50">
                    <Store className="w-12 h-12" />
                  </div>
                )}
                {!supplier.is_active && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase">
                    Inativo
                  </div>
                )}
                {supplier.guarantees_stock && (
                  <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase">
                    Garante Estoque
                  </div>
                )}
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <h4 className="text-lg font-black uppercase tracking-tighter mb-1">
                    {supplier.store_name}
                  </h4>
                  {supplier.average_rating > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-bold">{supplier.average_rating.toFixed(1)}</span>
                      <span className="text-xs text-neutral-400">({supplier.total_reviews} avaliações)</span>
                    </div>
                  )}
                </div>

                {(supplier.categories && supplier.categories.length > 0) || supplier.material_rating ? (
                  <div className="space-y-3 py-3 border-y border-neutral-200">
                    {supplier.categories && supplier.categories.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Tag className="w-3 h-3 text-neutral-400" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">
                            Categorias
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {supplier.categories.map((cat, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-neutral-100 rounded-md text-[10px] font-medium text-neutral-600"
                            >
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {supplier.material_rating && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="w-3 h-3 text-neutral-400" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">
                            Nota do Material
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <Star
                              key={rating}
                              className={`w-4 h-4 ${
                                supplier.material_rating && supplier.material_rating >= rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-neutral-300'
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-xs font-bold text-neutral-600">
                            {supplier.material_rating}/5
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}

                <div className="space-y-2 text-sm">
                  {supplier.address && (
                    <div className="flex items-start gap-2 text-neutral-600">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span className="text-xs line-clamp-2">{formatAddress(supplier.address)}</span>
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="flex items-center gap-2 text-neutral-600">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs">{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center gap-2 text-neutral-600">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs truncate">{supplier.email}</span>
                    </div>
                  )}
                  {supplier.website && (
                    <div className="flex items-center gap-2 text-neutral-600">
                      <Globe className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs truncate">{supplier.website}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t border-neutral-200">
                  <button
                    onClick={() => onEdit(supplier)}
                    className="flex-1 px-4 py-2 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit className="w-3 h-3" />
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Tem certeza que deseja excluir "${supplier.store_name}"?`)) {
                        onDelete(supplier.id);
                      }
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors flex items-center justify-center"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSuppliers;
