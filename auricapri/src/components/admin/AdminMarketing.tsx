import React from 'react';
import { ImageIcon, Plus, Trash2, Edit3, Loader2, Megaphone, Users, BarChart3 } from 'lucide-react';
import { Banner } from '../../types';
import { Locale } from '../../i18n';
import { BannersApi } from '../../api/banners.api';
import { Campaign } from '../../api/marketing.api';

interface AdminMarketingProps {
  banners: Banner[];
  campaigns: Campaign[];
  onEdit: (banner: Banner) => void;
  onRefresh: () => void;
  locale: Locale;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onAddCampaign: () => void;
  onEditCampaign: (campaign: Campaign) => void;
}

type Tab = 'banners' | 'campaigns' | 'users' | 'analytics';

  const AdminMarketing: React.FC<AdminMarketingProps> = ({ 
  banners, 
  campaigns,
  onEdit, 
  onRefresh, 
  locale,
  activeTab,
  onTabChange,
  onAddCampaign,
  onEditCampaign
}) => {
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (activeTab === 'campaigns') {
      // We still want to show a loading state if needed, but campaigns are now props.
      // If we want to force a refresh on tab switch, we can call onRefresh.
      onRefresh();
    }
  }, [activeTab]);

  const getLoc = (obj: any) => {
    if (!obj) return "";
    if (typeof obj === 'string') return obj;
    return obj[locale] || obj['pt'] || obj['en'] || Object.values(obj)[0] || "";
  };

  const handleDeleteBanner = async (e: React.MouseEvent, banner: Banner) => {
    e.stopPropagation();
    if (!banner.id) return;
    
    if (!confirm('Tem certeza que deseja excluir este banner?')) return;

    setDeletingId(banner.id);
    try {
      const bannersApi = new BannersApi();
      await bannersApi.delete(banner.id);
      onRefresh();
    } catch (err: any) {
      alert(`Erro ao excluir banner: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateNewBanner = () => {
    onEdit({ 
      title: { pt: '', en: '', es: '', fr: '' }, 
      image_url: { pt: '', en: '', es: '', fr: '' }, 
      position: 'hero_main', 
      sort_order: banners.length, 
      is_active: true 
    });
  };

  return (
    <div className="space-y-8">
      {/* Tabs */}
      <div className="flex border-b border-neutral-100">
        <button
          onClick={() => onTabChange('banners')}
          className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
            activeTab === 'banners' ? 'border-black text-black' : 'border-transparent text-neutral-400 hover:text-neutral-600'
          }`}
        >
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" /> Banners
          </div>
        </button>
        <button
          onClick={() => onTabChange('campaigns')}
          className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
            activeTab === 'campaigns' ? 'border-black text-black' : 'border-transparent text-neutral-400 hover:text-neutral-600'
          }`}
        >
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4" /> Campanhas
          </div>
        </button>
        <button
          onClick={() => onTabChange('users')}
          className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
            activeTab === 'users' ? 'border-black text-black' : 'border-transparent text-neutral-400 hover:text-neutral-600'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" /> Usuários
          </div>
        </button>
        <button
          onClick={() => onTabChange('analytics')}
          className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${
            activeTab === 'analytics' ? 'border-black text-black' : 'border-transparent text-neutral-400 hover:text-neutral-600'
          }`}
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Analytics
          </div>
        </button>
      </div>

      {activeTab === 'banners' && (
        <div className="space-y-10">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-4">
                Gestão de Banners
              </h3>
              <p className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest mt-1">Configure o visual da sua vitrine principal</p>
            </div>
            <button 
              onClick={handleCreateNewBanner}
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
                    onClick={(e) => handleDeleteBanner(e, b)}
                    className="p-4 bg-red-500 rounded-full shadow-xl hover:scale-110 transition-all text-white disabled:opacity-50"
                  >
                    {deletingId === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-4">
                Campanhas de Marketing
              </h3>
              <p className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest mt-1">Gerencie suas campanhas e segmentações</p>
            </div>
            <button 
              onClick={onAddCampaign}
              className="px-8 py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl hover:scale-105 transition-all"
            >
              <Plus className="w-4 h-4" /> Nova Campanha
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {campaigns.map(c => (
              <div key={c.id} className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex justify-between items-center group hover:shadow-md transition-all">
                <div>
                  <h4 className="font-bold text-lg">{c.name}</h4>
                  <p className="text-sm text-neutral-500">{c.description || 'Sem descrição'}</p>
                  <div className="flex gap-2 mt-2">
                    {c.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-neutral-100 text-[9px] font-bold uppercase rounded-md text-neutral-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${c.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {c.is_active ? 'Ativa' : 'Inativa'}
                  </span>
                  <button 
                    onClick={() => onEditCampaign(c)}
                    className="p-3 hover:bg-neutral-50 rounded-full transition-all"
                  >
                    <Edit3 className="w-4 h-4 text-neutral-400" />
                  </button>
                </div>
              </div>
            ))}
            {campaigns.length === 0 && (
              <div className="text-center py-20 bg-neutral-50 rounded-[3rem] border-2 border-dashed border-neutral-100">
                <Megaphone className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
                <p className="text-neutral-400 text-sm font-bold uppercase tracking-widest">Nenhuma campanha encontrada</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="text-center py-20 bg-neutral-50 rounded-[3rem] border-2 border-dashed border-neutral-100">
          <Users className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
          <p className="text-neutral-400 text-sm font-bold uppercase tracking-widest">Módulo de Perfil de Usuário em Breve</p>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="text-center py-20 bg-neutral-50 rounded-[3rem] border-2 border-dashed border-neutral-100">
          <BarChart3 className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
          <p className="text-neutral-400 text-sm font-bold uppercase tracking-widest">Módulo de Analytics em Breve</p>
        </div>
      )}
    </div>
  );
};

export default AdminMarketing;
