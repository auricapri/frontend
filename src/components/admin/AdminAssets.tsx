
import React, { useState } from 'react';
import { Package, Plus, Trash2, Edit3, DollarSign, Archive, AlertCircle, Image as ImageIcon, Loader2, Save, X } from 'lucide-react';
import { Asset } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { Locale } from '../../i18n';
// Supabase storage is still used for image uploads (safe)
import { supabase } from '../../utils/supabase';

interface AdminAssetsProps {
  assets: Asset[];
  onAdd: (asset: Asset) => void;
  onUpdate: (asset: Asset) => void;
  onDelete: (id: string) => void;
  locale: Locale;
}

const AdminAssets: React.FC<AdminAssetsProps> = ({ assets, onAdd, onUpdate, onDelete, locale }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Asset>>({});
  const [uploading, setUploading] = useState(false);

  // Gerador de UUID compatível com Supabase/Postgres
  const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleEdit = (asset: Asset) => {
    setEditingId(asset.id);
    setFormData(asset);
  };

  const handleCreate = () => {
    // Usa UUID válido para evitar erros de tipo no banco de dados
    const newId = generateUUID();
    setEditingId(newId);
    setFormData({ id: newId, name: '', cost_price: 0, stock_quantity: 0, image_url: '' });
  };

  const handleSave = () => {
    if (formData.name && formData.id) {
        // Garante tipos numéricos
        const payload = {
            ...formData,
            cost_price: Number(formData.cost_price),
            stock_quantity: Number(formData.stock_quantity)
        } as Asset;

        if (assets.find(a => a.id === formData.id)) {
            onUpdate(payload);
        } else {
            onAdd(payload);
        }
        setEditingId(null);
        setFormData({});
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `asset-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `misc/${fileName}`;
      const { error } = await supabase.storage.from('products').upload(filePath, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath);
      setFormData(prev => ({ ...prev, image_url: publicUrl }));
    } catch (err: any) { 
        alert(`Erro upload: ${err.message}`); 
    } finally { 
        setUploading(false); 
    }
  };

  return (
    <div className="space-y-12 pb-24">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-4">
            <Archive className="w-8 h-8" /> Insumos & Correlacionados
          </h3>
          <p className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest mt-2">
            Gestão visual de itens internos (embalagens, brindes, tags) que compõem o custo.
          </p>
        </div>
        {!editingId && (
            <button onClick={handleCreate} className="px-8 py-4 bg-black text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 shadow-xl hover:scale-105 transition-all active:scale-95">
            <Plus className="w-4 h-4" /> Novo Ativo
            </button>
        )}
      </div>

      {/* Editor Panel (Condicional) */}
      {editingId && (
          <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-neutral-100 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500 mb-12 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-black" />
              
              <div className="flex justify-between items-center mb-10">
                  <h4 className="text-xl font-black uppercase italic tracking-tighter">
                      {assets.find(a => a.id === editingId) ? 'Editar Insumo' : 'Novo Cadastro'}
                  </h4>
                  <button onClick={() => setEditingId(null)} className="p-3 bg-neutral-50 rounded-full hover:bg-neutral-100 transition-all"><X className="w-5 h-5" /></button>
              </div>

              <div className="flex flex-col md:flex-row gap-12">
                  {/* Image Upload Area */}
                  <div className="w-full md:w-1/4">
                      <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-3 block">Identidade Visual</label>
                      <div className="relative aspect-square bg-neutral-50 rounded-[2rem] border-2 border-dashed border-neutral-200 hover:border-black transition-all group overflow-hidden flex flex-col items-center justify-center">
                          {formData.image_url ? (
                              <>
                                <img src={formData.image_url} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Edit3 className="w-6 h-6 text-white" />
                                </div>
                              </>
                          ) : (
                              <div className="text-center p-4">
                                  {uploading ? <Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-300" /> : <ImageIcon className="w-8 h-8 text-neutral-300 mx-auto mb-2" />}
                                  <span className="text-[8px] font-bold uppercase tracking-widest text-neutral-400">Upload Imagem</span>
                              </div>
                          )}
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            onChange={handleImageUpload} 
                            disabled={uploading}
                          />
                      </div>
                  </div>

                  {/* Form Fields */}
                  <div className="flex-1 space-y-8">
                      <div className="space-y-4">
                          <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Identificação do Item</label>
                          <input 
                            className="w-full p-6 bg-neutral-50 border border-neutral-100 rounded-[1.5rem] text-lg font-black uppercase tracking-wide outline-none focus:bg-white focus:border-black transition-all placeholder:text-neutral-300" 
                            placeholder="EX: CAIXA PREMIUM G" 
                            value={formData.name || ''} 
                            onChange={e => setFormData({...formData, name: e.target.value})} 
                            autoFocus 
                          />
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-4">
                              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Custo Unitário (R$)</label>
                              <div className="relative">
                                  <DollarSign className="w-4 h-4 absolute left-6 top-1/2 -translate-y-1/2 text-neutral-400" />
                                  <input 
                                    type="number" 
                                    step="0.01"
                                    className="w-full p-6 pl-14 bg-neutral-50 border border-neutral-100 rounded-[1.5rem] text-sm font-bold font-mono outline-none focus:bg-white focus:border-black transition-all" 
                                    placeholder="0.00" 
                                    value={formData.cost_price || ''} 
                                    onChange={e => setFormData({...formData, cost_price: Number(e.target.value)})} 
                                  />
                              </div>
                          </div>
                          <div className="space-y-4">
                              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Estoque Atual</label>
                              <div className="relative">
                                  <Package className="w-4 h-4 absolute left-6 top-1/2 -translate-y-1/2 text-neutral-400" />
                                  <input 
                                    type="number" 
                                    className="w-full p-6 pl-14 bg-neutral-50 border border-neutral-100 rounded-[1.5rem] text-sm font-bold font-mono outline-none focus:bg-white focus:border-black transition-all" 
                                    placeholder="0" 
                                    value={formData.stock_quantity || ''} 
                                    onChange={e => setFormData({...formData, stock_quantity: Number(e.target.value)})} 
                                  />
                              </div>
                          </div>
                      </div>

                      <div className="flex justify-end gap-4 pt-6 border-t border-neutral-50">
                          <button onClick={() => setEditingId(null)} className="px-8 py-5 border border-neutral-200 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-neutral-50 transition-all">Cancelar</button>
                          <button 
                            onClick={handleSave} 
                            disabled={!formData.name || uploading}
                            className="px-12 py-5 bg-black text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-50 disabled:hover:scale-100"
                          >
                             <Save className="w-4 h-4" /> Salvar Item
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Assets Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {assets.map(asset => (
            <div key={asset.id} className="group relative bg-white rounded-[2.5rem] border border-neutral-100 hover:border-black transition-all duration-300 p-5 flex gap-6 overflow-hidden shadow-sm hover:shadow-xl">
                {/* Visual */}
                <div className="w-28 h-28 rounded-[1.8rem] bg-neutral-50 flex-none overflow-hidden relative border border-neutral-50">
                    {asset.image_url ? (
                        <img src={asset.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-200">
                            <Package className="w-8 h-8" strokeWidth={1} />
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-center py-2">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-neutral-900 mb-2 line-clamp-1 leading-tight">{asset.name}</h4>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs font-mono font-bold text-neutral-400 bg-neutral-50 px-2 py-1 rounded-lg">{formatCurrency(asset.cost_price, locale)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <div className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wide border flex items-center gap-2 ${asset.stock_quantity === 0 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-black text-white border-black'}`}>
                            {asset.stock_quantity === 0 && <AlertCircle className="w-3 h-3" />}
                            {asset.stock_quantity} un.
                        </div>
                    </div>
                </div>

                {/* Actions Hover */}
                <div className="absolute top-5 right-5 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                    <button onClick={() => handleEdit(asset)} className="p-3 bg-black text-white rounded-xl shadow-lg hover:scale-110 transition-all">
                        <Edit3 className="w-3 h-3" />
                    </button>
                    <button onClick={() => onDelete(asset.id)} className="p-3 bg-white text-red-500 border border-red-100 rounded-xl shadow-lg hover:bg-red-50 transition-all">
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>
            </div>
         ))}
         
         {!editingId && assets.length === 0 && (
             <div className="col-span-full py-20 text-center flex flex-col items-center justify-center text-neutral-300 space-y-6 border-2 border-dashed border-neutral-100 rounded-[3rem]">
                 <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center"><Package className="w-8 h-8 opacity-20" /></div>
                 <div className="space-y-2">
                    <p className="text-sm font-black uppercase tracking-widest text-neutral-400">Nenhum insumo cadastrado</p>
                    <p className="text-[10px] text-neutral-300 uppercase tracking-widest">Adicione itens para compor o custo dos produtos</p>
                 </div>
             </div>
         )}
      </div>
    </div>
  );
};

export default AdminAssets;
