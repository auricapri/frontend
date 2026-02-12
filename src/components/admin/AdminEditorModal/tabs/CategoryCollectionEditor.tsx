import React from 'react';
import { ImageIcon, Upload, Loader2, X, Clock, Calendar } from 'lucide-react';
import { Category } from '../../../../types';
import { LocalizedText } from '../types';
import { CATEGORY_ICONS } from '../constants';

interface CategoryCollectionEditorProps {
  type: 'category' | 'collection';
  data: any;
  editLocale: string;
  uploading: string | null;
  getLocVal: (obj: LocalizedText | string | null | undefined) => string;
  updateNested: (field: string, value: string) => void;
  updateSimple: (field: string, value: any) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>, field: string) => void;
}

export const CategoryCollectionEditor: React.FC<CategoryCollectionEditorProps> = ({
  type,
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
          Nome ({editLocale})
        </label>
        <input
          className="w-full p-8 bg-neutral-50 border border-neutral-100 rounded-[2rem] text-2xl font-black outline-none focus:bg-white focus:border-black transition-all"
          value={getLocVal(data.name)}
          onChange={e => updateNested('name', e.target.value)}
        />
      </div>

      {type === 'collection' && (
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
            Descrição ({editLocale})
          </label>
          <textarea
            className="w-full p-8 bg-neutral-50 border border-neutral-100 rounded-[2rem] text-sm font-medium min-h-[150px] outline-none focus:bg-white focus:border-black transition-all"
            value={getLocVal(data.description)}
            onChange={e => updateNested('description', e.target.value)}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
            Imagem de Capa
          </label>
          <div className="relative aspect-video bg-neutral-50 rounded-[2rem] border border-neutral-100 overflow-hidden group">
            {data.image_url ? (
              <img src={data.image_url} className="w-full h-full object-cover" />
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
                onChange={(e) => onUpload(e, 'image_url')}
                disabled={!!uploading}
              />
            </label>
          </div>
        </div>
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">
              Slug (URL)
            </label>
            <input
              className="w-full p-5 bg-white border border-neutral-200 rounded-2xl text-xs font-bold"
              value={data.slug || ''}
              onChange={e => updateSimple('slug', e.target.value)}
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

      {/* COLLECTION-ONLY: Limited Time Settings */}
      {type === 'collection' && (
        <div className="space-y-6 pt-6 border-t border-neutral-100">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-5 h-5 text-orange-500" />
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider">Coleção Limitada</h4>
              <p className="text-[10px] text-neutral-400 font-medium">
                Configure datas para criar urgência. A coleção sumirá automaticamente ao expirar.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                Data de Início
              </label>
              <input
                type="datetime-local"
                className="w-full p-5 bg-white border border-neutral-200 rounded-2xl text-xs font-bold focus:border-black focus:ring-0 outline-none transition-colors"
                value={data.starts_at ? new Date(data.starts_at).toISOString().slice(0, 16) : ''}
                onChange={e => updateSimple('starts_at', e.target.value ? new Date(e.target.value).toISOString() : null)}
              />
              <p className="text-[9px] text-neutral-400">
                Deixe vazio para iniciar imediatamente
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                Data de Término
              </label>
              <input
                type="datetime-local"
                className="w-full p-5 bg-white border border-neutral-200 rounded-2xl text-xs font-bold focus:border-black focus:ring-0 outline-none transition-colors"
                value={data.ends_at ? new Date(data.ends_at).toISOString().slice(0, 16) : ''}
                onChange={e => updateSimple('ends_at', e.target.value ? new Date(e.target.value).toISOString() : null)}
              />
              <p className="text-[9px] text-neutral-400">
                Deixe vazio para coleção permanente
              </p>
            </div>
          </div>

          {(data.starts_at || data.ends_at) && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl">
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-orange-600 mt-0.5" />
                <div className="text-[10px] text-orange-800">
                  <p className="font-bold mb-1">Preview do Countdown:</p>
                  {data.starts_at && new Date(data.starts_at) > new Date() ? (
                    <p>A coleção começará em {new Date(data.starts_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  ) : data.ends_at ? (
                    <p>A coleção terminará em {new Date(data.ends_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  ) : (
                    <p>Coleção sem data de término definida</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {data.ends_at && (
            <button
              type="button"
              onClick={() => {
                updateSimple('starts_at', null);
                updateSimple('ends_at', null);
              }}
              className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase tracking-widest"
            >
              Remover Limite de Tempo
            </button>
          )}
        </div>
      )}

      {/* CATEGORY-ONLY: Icon Selection */}
      {type === 'category' && (
        <div className="space-y-6 pt-4 border-t border-neutral-100">
          <div className="space-y-4">
            <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">
              Ícone da Categoria
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {/* No icon option */}
              <button
                type="button"
                onClick={() => updateSimple('icon', null)}
                className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all hover:scale-105 ${
                  !(data as Category).icon
                    ? 'border-black bg-black text-white'
                    : 'border-neutral-200 bg-white text-neutral-400 hover:border-neutral-300'
                }`}
              >
                <X className="w-5 h-5" />
                <span className="text-[8px] font-bold">Nenhum</span>
              </button>
              {/* Icon options */}
              {CATEGORY_ICONS.map(({ name, icon: Icon, label }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => updateSimple('icon', name)}
                  className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all hover:scale-105 ${
                    (data as Category).icon === name
                      ? 'border-black bg-black text-white'
                      : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[8px] font-bold truncate px-1">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
