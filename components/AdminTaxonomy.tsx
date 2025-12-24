
import React from 'react';
import { Plus, FolderTree, Image as ImageIcon, Layers } from 'lucide-react';
import { Category, Collection } from '../types';
import { Locale } from '../i18n';

interface AdminTaxonomyProps {
  categories: Category[];
  collections: Collection[];
  onEditCategory: (cat: Category) => void;
  onEditCollection: (coll: Collection) => void;
  onAddCategory: () => void;
  onAddCollection: () => void;
  locale: Locale;
}

const AdminTaxonomy: React.FC<AdminTaxonomyProps> = ({ 
  categories, 
  collections, 
  onEditCategory, 
  onEditCollection, 
  onAddCategory, 
  onAddCollection, 
  locale 
}) => {
  const getLoc = (obj: any): string => {
    if (obj === null || obj === undefined) return "";
    
    // Check if it's already an object (Supabase often parses JSONB automatically)
    if (typeof obj === 'object') {
      const val = obj[locale] || obj['pt'] || obj['en'] || obj['es'] || obj['fr'];
      if (typeof val === 'string') return val;
      const first = Object.values(obj).find(v => typeof v === 'string');
      return (first as string) || "";
    }

    // Check if it's a string that needs parsing
    if (typeof obj === 'string') {
      if (obj.trim().startsWith('{') || obj.trim().startsWith('[')) {
        try { 
            const parsed = JSON.parse(obj);
            // Recursive call with parsed object
            return getLoc(parsed); 
        } catch { 
            // Fallback if parsing fails (it's just a string)
            return obj; 
        }
      }
      return obj;
    }
    
    return String(obj);
  };

  return (
    <div className="space-y-20">
      <section className="space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-4">
              <FolderTree className="w-6 h-6" /> Categorias
            </h3>
            <p className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest mt-1">Organize seu catálogo por tipo</p>
          </div>
          <button onClick={onAddCategory} className="px-8 py-3 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
            <Plus className="w-4 h-4" /> Nova Categoria
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map(cat => (
            <div key={cat.id} onClick={() => onEditCategory(cat)} className="bg-neutral-50 p-6 rounded-[2.5rem] border border-neutral-100 group hover:border-black transition-all cursor-pointer">
              <div className="aspect-square rounded-2xl bg-white mb-6 overflow-hidden border border-neutral-100 shadow-inner">
                {cat.image_url ? (
                  <img src={cat.image_url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-200"><ImageIcon className="w-8 h-8" /></div>
                )}
              </div>
              <h4 className="text-[11px] font-black uppercase tracking-widest">{getLoc(cat.name)}</h4>
              <p className="text-[9px] text-neutral-400 mt-1 uppercase font-mono">/{cat.slug}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-4">
              <Layers className="w-6 h-6" /> Coleções Curadas
            </h3>
            <p className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest mt-1">Destaque tendências e estações</p>
          </div>
          <button onClick={onAddCollection} className="px-8 py-3 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
            <Plus className="w-4 h-4" /> Nova Coleção
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {collections.map(coll => (
            <div key={coll.id} onClick={() => onEditCollection(coll)} className="relative aspect-[21/9] rounded-[2.5rem] overflow-hidden group border border-neutral-100 cursor-pointer shadow-xl">
              <img src={coll.image_url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="" />
              <div className="absolute inset-0 bg-black/40 p-10 flex flex-col justify-end">
                <h4 className="text-white text-3xl font-black uppercase italic tracking-tighter leading-none">{getLoc(coll.name)}</h4>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">Slug: {coll.slug}</span>
                  <div className={`w-2 h-2 rounded-full ${coll.is_active ? 'bg-green-400' : 'bg-red-400'}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminTaxonomy;
