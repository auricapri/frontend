
import React, { useState } from 'react';
import { X, Save, Plus, Trash2, Megaphone, Tag, Calendar, Layout, Loader2 } from 'lucide-react';
import { Campaign } from '../../api/marketing.api';

interface AdminCampaignEditorProps {
  campaign: Campaign | null;
  onClose: () => void;
  onSave: (campaign: Partial<Campaign>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const AVAILABLE_TAGS = [
  'vip', 'new', 'returning', 'cold', 'hot', 
  'weather_rainy', 'weather_sunny', 'weather_cloudy',
  'high_spender', 'abandoned_cart', 'newsletter_subscriber'
];

const AdminCampaignEditor: React.FC<AdminCampaignEditorProps> = ({ campaign, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState<Partial<Campaign>>(
    campaign || {
      name: '',
      description: '',
      tags: [],
      is_active: true,
      start_date: null,
      end_date: null,
    }
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newTag, setNewTag] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert('O nome da campanha é obrigatório.');
      return;
    }
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      alert(`Erro ao salvar campanha: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!campaign?.id || !onDelete) return;
    if (!confirm('Tem certeza que deseja excluir esta campanha?')) return;
    
    setIsDeleting(true);
    try {
      await onDelete(campaign.id);
      onClose();
    } catch (err: any) {
      alert(`Erro ao excluir campanha: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleTag = (tag: string) => {
    const currentTags = formData.tags || [];
    if (currentTags.includes(tag)) {
      setFormData({ ...formData, tags: currentTags.filter(t => t !== tag) });
    } else {
      setFormData({ ...formData, tags: [...currentTags, tag] });
    }
  };

  const addCustomTag = () => {
    if (!newTag.trim()) return;
    const currentTags = formData.tags || [];
    if (!currentTags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...currentTags, newTag.trim()] });
    }
    setNewTag('');
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[1000] flex items-center justify-center p-4 md:p-12 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-[3.5rem] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 my-auto text-neutral-900">
        
        <header className="h-24 md:h-28 px-6 md:px-16 flex justify-between items-center border-b border-neutral-100 bg-white sticky top-0 z-[100]">
          <div className="flex items-center gap-12">
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase tracking-[0.5em] text-neutral-400">Marketing Engine</span>
              <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter">
                {campaign ? 'Editar Campanha' : 'Nova Campanha'}
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="p-4 bg-neutral-50 rounded-full hover:bg-neutral-100 transition-all text-neutral-900">
            <X className="w-6 h-6" />
          </button>
        </header>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 md:p-16 no-scrollbar space-y-12">
          {/* Identity Section */}
          <div className="space-y-8">
            <div className="flex items-center gap-4 mb-2">
              <Layout className="w-5 h-5 text-neutral-400" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Identidade da Campanha</h3>
            </div>
            
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Nome da Campanha</label>
              <input 
                className="w-full p-6 bg-neutral-50 border border-neutral-100 rounded-2xl text-lg font-bold outline-none focus:bg-white focus:border-black transition-all" 
                value={formData.name || ''} 
                onChange={e => setFormData({ ...formData, name: e.target.value })} 
                placeholder="Ex: Campanha de Verão 2026"
                required
              />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Descrição</label>
              <textarea 
                className="w-full p-6 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-medium min-h-[120px] outline-none focus:bg-white focus:border-black transition-all" 
                value={formData.description || ''} 
                onChange={e => setFormData({ ...formData, description: e.target.value })} 
                placeholder="Descreva o objetivo desta campanha..."
              />
            </div>
          </div>

          {/* Targeting Section */}
          <div className="space-y-8">
            <div className="flex items-center gap-4 mb-2">
              <Tag className="w-5 h-5 text-neutral-400" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Segmentação (Tags)</h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                    (formData.tags || []).includes(tag)
                      ? 'bg-black text-white border-black shadow-lg'
                      : 'bg-white text-neutral-400 border-neutral-100 hover:border-black'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            <div className="flex gap-4">
              <input 
                className="flex-1 p-4 bg-neutral-50 border border-neutral-100 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-black transition-all"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                placeholder="Adicionar tag personalizada..."
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
              />
              <button 
                type="button"
                onClick={addCustomTag}
                className="px-6 py-4 bg-neutral-100 text-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-neutral-200 transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Schedule & Status Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="flex items-center gap-4 mb-2">
                <Calendar className="w-5 h-5 text-neutral-400" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Agendamento</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Data Início</label>
                  <input 
                    type="date"
                    className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-xl text-xs font-bold outline-none"
                    value={formData.start_date ? formData.start_date.split('T')[0] : ''}
                    onChange={e => setFormData({ ...formData, start_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Data Fim</label>
                  <input 
                    type="date"
                    className="w-full p-4 bg-neutral-50 border border-neutral-100 rounded-xl text-xs font-bold outline-none"
                    value={formData.end_date ? formData.end_date.split('T')[0] : ''}
                    onChange={e => setFormData({ ...formData, end_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex items-center gap-4 mb-2">
                <Megaphone className="w-5 h-5 text-neutral-400" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Status</h3>
              </div>
              
              <div className="flex items-center gap-4 p-6 bg-neutral-50 border border-neutral-100 rounded-2xl">
                <input 
                  type="checkbox" 
                  className="w-6 h-6 accent-black cursor-pointer" 
                  checked={formData.is_active || false} 
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })} 
                />
                <div className="flex-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-900 cursor-pointer">Campanha Ativa</label>
                  <p className="text-[8px] text-neutral-400 mt-1">Se desativada, a campanha não será exibida ou processada</p>
                </div>
              </div>
            </div>
          </div>
        </form>

        <footer className="h-28 md:h-32 px-6 md:px-16 border-t border-neutral-100 flex items-center justify-end gap-3 md:gap-6 bg-white sticky bottom-0 z-[100]">
          {campaign && onDelete && (
            <button 
              type="button"
              onClick={handleDelete} 
              disabled={isDeleting || isSaving}
              className="px-6 md:px-12 py-4 md:py-6 text-red-500 hover:bg-red-50 rounded-2xl md:rounded-3xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all mr-auto"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          )}
          <button 
            type="button"
            onClick={onClose} 
            className="px-6 md:px-12 py-4 md:py-6 border border-neutral-200 rounded-2xl md:rounded-3xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-neutral-50 transition-all"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            onClick={handleSave}
            disabled={isSaving || isDeleting}
            className="px-10 md:px-16 py-4 md:py-6 bg-black text-white rounded-2xl md:rounded-3xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] shadow-2xl hover:scale-[1.02] transition-all flex items-center gap-2 md:gap-4 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <Save className="w-4 h-4 md:w-5 md:h-5" />}
            {campaign ? 'Atualizar Campanha' : 'Criar Campanha'}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default AdminCampaignEditor;
