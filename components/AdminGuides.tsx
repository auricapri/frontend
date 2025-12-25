
import React, { useState } from 'react';
import { Ruler, Plus, Trash2, Edit3, Image as ImageIcon, Upload, Loader2, Save, X } from 'lucide-react';
import { SizeGuide } from '../types';
import { supabase } from '../utils/supabase';

interface AdminGuidesProps {
  guides: SizeGuide[];
  onAdd: (guide: SizeGuide) => void;
  onUpdate: (guide: SizeGuide) => void;
  onDelete: (id: string) => void;
}

const AdminGuides: React.FC<AdminGuidesProps> = ({ guides, onAdd, onUpdate, onDelete }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<SizeGuide>>({});
  const [uploading, setUploading] = useState(false);

  const handleCreate = () => {
    setEditingId('new');
    setFormData({ name: '', image_url: '' });
  };

  const handleEdit = (guide: SizeGuide) => {
    setEditingId(guide.id);
    setFormData(guide);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.image_url) {
        alert("Nome e Imagem são obrigatórios.");
        return;
    }

    try {
        if (editingId === 'new') {
            const { data, error } = await supabase.from('size_guides').insert({
                name: formData.name,
                image_url: formData.image_url
            }).select().single();
            if (error) throw error;
            onAdd(data);
        } else {
            const { data, error } = await supabase.from('size_guides').update({
                name: formData.name,
                image_url: formData.image_url
            }).eq('id', editingId).select().single();
            if (error) throw error;
            onUpdate(data);
        }
        setEditingId(null);
        setFormData({});
    } catch (err: any) {
        alert(`Erro ao salvar: ${err.message}`);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `guide-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
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

  const handleDelete = async (id: string) => {
      if(!confirm("Tem certeza? Isso pode afetar produtos que usam este guia.")) return;
      try {
          const { error } = await supabase.from('size_guides').delete().eq('id', id);
          if (error) throw error;
          onDelete(id);
      } catch (err: any) {
          alert(`Erro ao deletar: ${err.message}`);
      }
  };

  return (
    <div className="space-y-12 pb-24">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-4">
            <Ruler className="w-8 h-8" /> Guias de Medidas
          </h3>
          <p className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest mt-2">
            Biblioteca global de tabelas de medidas reutilizáveis nos produtos.
          </p>
        </div>
        {!editingId && (
            <button onClick={handleCreate} className="px-8 py-4 bg-black text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 shadow-xl hover:scale-105 transition-all active:scale-95">
            <Plus className="w-4 h-4" /> Novo Guia
            </button>
        )}
      </div>

      {/* Editor Panel */}
      {editingId && (
          <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-neutral-100 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500 mb-12 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-black" />
              
              <div className="flex justify-between items-center mb-10">
                  <h4 className="text-xl font-black uppercase italic tracking-tighter">
                      {editingId === 'new' ? 'Novo Guia' : 'Editar Guia'}
                  </h4>
                  <button onClick={() => setEditingId(null)} className="p-3 bg-neutral-50 rounded-full hover:bg-neutral-100 transition-all"><X className="w-5 h-5" /></button>
              </div>

              <div className="flex flex-col md:flex-row gap-12">
                  {/* Image Upload Area */}
                  <div className="w-full md:w-1/3">
                      <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-3 block">Imagem da Tabela</label>
                      <div className="relative aspect-[4/3] bg-neutral-50 rounded-[2rem] border-2 border-dashed border-neutral-200 hover:border-black transition-all group overflow-hidden flex flex-col items-center justify-center">
                          {formData.image_url ? (
                              <>
                                <img src={formData.image_url} className="w-full h-full object-contain p-2" />
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
                          <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Nome de Referência</label>
                          <input 
                            className="w-full p-6 bg-neutral-50 border border-neutral-100 rounded-[1.5rem] text-lg font-black uppercase tracking-wide outline-none focus:bg-white focus:border-black transition-all placeholder:text-neutral-300" 
                            placeholder="EX: CAMISETAS FEMININAS" 
                            value={formData.name || ''} 
                            onChange={e => setFormData({...formData, name: e.target.value})} 
                            autoFocus 
                          />
                          <p className="text-[9px] text-neutral-400 font-medium">Este nome aparecerá apenas internamente para seleção nos produtos.</p>
                      </div>

                      <div className="flex justify-end gap-4 pt-6 border-t border-neutral-50 mt-auto">
                          <button onClick={() => setEditingId(null)} className="px-8 py-5 border border-neutral-200 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-neutral-50 transition-all">Cancelar</button>
                          <button 
                            onClick={handleSave} 
                            disabled={!formData.name || !formData.image_url || uploading}
                            className="px-12 py-5 bg-black text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-50 disabled:hover:scale-100"
                          >
                             <Save className="w-4 h-4" /> Salvar Guia
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {guides.map(guide => (
            <div key={guide.id} className="group relative bg-white rounded-[2.5rem] border border-neutral-100 hover:border-black transition-all duration-300 p-5 flex flex-col gap-6 overflow-hidden shadow-sm hover:shadow-xl">
                <div className="w-full aspect-[4/3] rounded-[1.8rem] bg-neutral-50 flex-none overflow-hidden relative border border-neutral-50">
                    <img src={guide.image_url} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-700" />
                </div>

                <div className="flex items-center justify-between px-2 pb-2">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-neutral-900 line-clamp-1">{guide.name}</h4>
                    <div className="flex gap-2">
                        <button onClick={() => handleEdit(guide)} className="p-2 bg-neutral-100 rounded-lg hover:bg-black hover:text-white transition-all">
                            <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(guide.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
         ))}
         
         {!editingId && guides.length === 0 && (
             <div className="col-span-full py-20 text-center flex flex-col items-center justify-center text-neutral-300 space-y-6 border-2 border-dashed border-neutral-100 rounded-[3rem]">
                 <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center"><Ruler className="w-8 h-8 opacity-20" /></div>
                 <div className="space-y-2">
                    <p className="text-sm font-black uppercase tracking-widest text-neutral-400">Nenhum guia cadastrado</p>
                    <p className="text-[10px] text-neutral-300 uppercase tracking-widest">Crie tabelas de medidas para vincular aos seus produtos</p>
                 </div>
             </div>
         )}
      </div>
    </div>
  );
};

export default AdminGuides;
