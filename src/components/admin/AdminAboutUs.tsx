
import React, { useState } from 'react';
import { StoreConfig } from '../../types';
import { Locale } from '../../i18n';
import { Save, Upload, Loader2, Image as ImageIcon, BookOpen } from 'lucide-react';
import { supabase } from '../../utils/supabase';

interface AdminAboutUsProps {
  config: StoreConfig;
  onChange: (config: StoreConfig) => void;
  onSave: () => void;
  locale: Locale;
  onLocaleChange: (l: Locale) => void;
}

const AdminAboutUs: React.FC<AdminAboutUsProps> = ({ config, onChange, onSave, locale, onLocaleChange }) => {
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `about-us-${Date.now()}.${fileExt}`;
      const filePath = `misc/${fileName}`; // Using 'misc' folder in products bucket or similar
      
      const { error } = await supabase.storage.from('products').upload(filePath, file);
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath);
      onChange({ ...config, about_us_image: publicUrl });
    } catch (err: any) {
      alert(`Erro no upload: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const currentText = config.about_us ? (config.about_us[locale] || '') : '';

  const handleTextChange = (text: string) => {
    const newAboutUs = { ...(config.about_us || { pt: '', en: '' }), [locale]: text };
    onChange({ ...config, about_us: newAboutUs });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-32">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-4">
            <BookOpen className="w-8 h-8" /> Sobre a Marca
          </h3>
          <p className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest mt-2">
            Conte sua história. Adicione uma imagem impactante e o texto institucional.
          </p>
        </div>
        <div className="flex bg-neutral-100 p-1.5 rounded-2xl border border-neutral-200 gap-1">
            {(['pt', 'en', 'es', 'fr'] as Locale[]).map(l => (
              <button 
                key={l} 
                onClick={() => onLocaleChange(l)}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${locale === l ? 'bg-black text-white shadow-lg' : 'text-neutral-400 hover:text-black'}`}
              >
                {l}
              </button>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
         {/* Image Section */}
         <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-6 block">Imagem Institucional</label>
                
                <div className="relative aspect-[4/5] bg-neutral-50 rounded-[2rem] border-2 border-dashed border-neutral-200 overflow-hidden group">
                    {config.about_us_image ? (
                        <img src={config.about_us_image} className="w-full h-full object-cover" alt="About Us" />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-neutral-300">
                            <ImageIcon className="w-12 h-12 mb-4" />
                            <span className="text-[9px] font-bold uppercase tracking-widest">Nenhuma imagem selecionada</span>
                        </div>
                    )}
                    
                    <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer">
                        <div className="bg-white px-6 py-3 rounded-xl flex items-center gap-3 shadow-xl">
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            <span className="text-[10px] font-black uppercase tracking-widest">Alterar Imagem</span>
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                    </label>
                </div>
                <p className="text-[9px] text-neutral-400 mt-4 text-center">Recomendado: Formato Retrato ou Quadrado, Alta Resolução.</p>
            </div>
         </div>

         {/* Text Section */}
         <div className="space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm h-full flex flex-col">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-6 block">Texto Institucional ({locale.toUpperCase()})</label>
                <textarea 
                    className="flex-1 w-full p-6 bg-neutral-50 border border-neutral-100 rounded-[2rem] text-sm font-medium leading-relaxed outline-none focus:bg-white focus:border-black transition-all resize-none"
                    placeholder="Escreva a história da sua marca, missão e valores..."
                    value={currentText}
                    onChange={(e) => handleTextChange(e.target.value)}
                />
            </div>
         </div>
      </div>

      <footer className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-neutral-200 p-6 md:px-12 flex justify-end z-50 shadow-2xl md:ml-64 md:w-[calc(100%-16rem)]">
          <button 
            onClick={onSave}
            className="px-12 py-6 bg-black text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl hover:scale-105 transition-all flex items-center gap-4 active:scale-95"
          >
            <Save className="w-4 h-4" /> Salvar Conteúdo
          </button>
      </footer>
    </div>
  );
};

export default AdminAboutUs;
