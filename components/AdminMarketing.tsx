
import React from 'react';
import { ImageIcon, Plus, Trash2, Edit3, Loader2 } from 'lucide-react';
import { Banner } from '../types';
import { Locale } from '../i18n';
import { supabase } from '../utils/supabase';

interface AdminMarketingProps {
  banners: Banner[];
  onEdit: (banner: Banner) => void;
  onRefresh: () => void;
  locale: Locale;
}

const AdminMarketing: React.FC<AdminMarketingProps> = ({ banners, onEdit, onRefresh, locale }) => {
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const getLoc = (obj: any) => {
    if (!obj) return "";
    if (typeof obj === 'string') return obj;
    return obj[locale] || obj['pt'] || obj['en'] || Object.values(obj)[0] || "";
  };

  const handleDelete = async (e: React.MouseEvent, banner: Banner) => {
    e.stopPropagation();
    if (!banner.id) return;
    
    if (!confirm('Tem certeza que deseja excluir este banner?')) return;

    setDeletingId(banner.id);
    try {
      const { error } = await supabase.from('banners').delete().eq('id', banner.id);
      if (error) throw error;
      onRefresh();
    } catch (err: any) {
      alert(`Erro ao excluir banner: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateNew = () => {
    onEdit({ 
      title: { pt: '', en: '', es: '', fr: '' }, 
      image_url: { pt: '', en: '', es: '', fr: '' }, 
      position: 'hero_main', 
      sort_order: banners.length, 
      is_active: true 
    });
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h3 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-4">
            <ImageIcon className="w-6 h-6" /> Gestão de Banners
          </h3>
          <p className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest mt-1">Configure o visual da sua vitrine principal</p>
        </div>
        <button 
          onClick={handleCreateNew}
          className="px-8 py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl hover:scale-105 transition-all"
        >
          <Plus className="w-4 h-4" /> Novo Banner
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {banners.map(b => (
          <div 
            key={b.id} 
            className="relative aspect-video rounded-[3rem] overflow-hidden group border border-neutral-100 shadow-2xl cursor-pointer bg-neutral-50"
            onClick={() => onEdit(b)}
          >
            <img 
              src={getLoc(b.image_url) || 'https://via.placeholder.com/800x450?text=Sem+Imagem'} 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
              alt=""
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-12 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-all duration-500">
              <h4 className="text-white text-3xl font-black uppercase italic tracking-tighter leading-none whitespace-pre-line">
                {getLoc(b.title)}
              </h4>
              <div className="flex items-center gap-4 mt-6">
                <span className="text-white/40 text-[9px] font-black uppercase tracking-widest">Ordem: {b.sort_order}</span>
                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${b.is_active ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                  {b.is_active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>

            <div className="absolute top-8 right-8 flex gap-3 opacity-0 group-hover:opacity-100 transition-all">
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(b); }}
                className="p-4 bg-white rounded-full shadow-xl hover:scale-110 transition-all text-black"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button 
                disabled={deletingId === b.id}
                onClick={(e) => handleDelete(e, b)}
                className="p-4 bg-red-500 rounded-full shadow-xl hover:scale-110 transition-all text-white disabled:opacity-50"
              >
                {deletingId === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminMarketing;
