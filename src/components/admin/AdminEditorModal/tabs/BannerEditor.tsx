import React from 'react';
import { ImageIcon, Upload, Loader2 } from 'lucide-react';
import { LocalizedText } from '../types';

interface BannerEditorProps {
  data: any;
  editLocale: string;
  uploading: string | null;
  getLocVal: (obj: LocalizedText | string | null | undefined) => string;
  updateNested: (field: string, value: string) => void;
  updateSimple: (field: string, value: any) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const BannerEditor: React.FC<BannerEditorProps> = ({
  data,
  editLocale,
  uploading,
  getLocVal,
  updateNested,
  updateSimple,
  onUpload,
}) => {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
      <div className="space-y-4">
        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
          Título do Banner ({editLocale})
        </label>
        <textarea
          className="w-full p-8 bg-neutral-50 border border-neutral-100 rounded-[2rem] text-2xl font-black outline-none focus:bg-white focus:border-black transition-all whitespace-pre-line"
          value={getLocVal(data.title)}
          onChange={e => updateNested('title', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
            Imagem ({editLocale})
          </label>
          <div className="relative aspect-video bg-neutral-50 rounded-[2rem] border border-neutral-100 overflow-hidden group">
            {getLocVal(data.image_url) ? (
              <img src={getLocVal(data.image_url)} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-neutral-300" />
              </div>
            )}
            <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer">
              <span className="px-6 py-3 bg-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload
              </span>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={onUpload}
                disabled={!!uploading}
              />
            </label>
          </div>
        </div>
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Posição</label>
            <input
              className="w-full p-5 bg-white border border-neutral-200 rounded-2xl text-xs font-bold"
              value={data.position || 'hero_main'}
              onChange={e => updateSimple('position', e.target.value)}
            />
          </div>
          <div className="space-y-3">
            <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Ordem</label>
            <input
              type="number"
              className="w-full p-5 bg-white border border-neutral-200 rounded-2xl text-xs font-bold"
              value={data.sort_order || 0}
              onChange={e => updateSimple('sort_order', Number(e.target.value))}
            />
          </div>
          <div className="flex items-center gap-4 p-5 bg-white border border-neutral-200 rounded-2xl">
            <input
              type="checkbox"
              className="w-5 h-5 accent-black"
              checked={data.is_active}
              onChange={e => updateSimple('is_active', e.target.checked)}
            />
            <span className="text-xs font-black uppercase tracking-widest">Ativo</span>
          </div>
        </div>
      </div>
    </div>
  );
};
