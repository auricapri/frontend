import React, { useState } from 'react';
import { X, Search, Check } from 'lucide-react';
import { Asset, Collection, LocalizedText } from '../../../types';
import { Locale } from '../../../i18n';

interface ResourceSelectorProps {
  type: 'assets' | 'collections';
  items: (Asset | Collection)[];
  selectedIds: string[];
  locale: Locale;
  onSelect: (ids: string[]) => void;
  onClose: () => void;
}

const getLocalizedText = (text: LocalizedText | string | undefined, locale: Locale): string => {
  if (!text) return '';
  if (typeof text === 'string') return text;
  return text[locale] || text.pt || text.en || '';
};

const ResourceSelector: React.FC<ResourceSelectorProps> = ({
  type,
  items,
  selectedIds,
  locale,
  onSelect,
  onClose,
}) => {
  const [search, setSearch] = useState('');
  const [localSelected, setLocalSelected] = useState<string[]>(selectedIds);

  const filteredItems = items.filter(item => {
    const name = type === 'assets' 
      ? (item as Asset).name 
      : getLocalizedText((item as Collection).name, locale);
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const toggleItem = (id: string) => {
    setLocalSelected(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const handleSave = () => {
    onSelect(localSelected);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h2 className="text-lg font-bold">
            {type === 'assets' ? 'Selecionar Insumos' : 'Selecionar Colecoes'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-4 border-b border-neutral-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto p-4">
          {filteredItems.length === 0 ? (
            <p className="text-center text-neutral-400 py-8">Nenhum item encontrado</p>
          ) : (
            <div className="space-y-2">
              {filteredItems.map(item => {
                const isSelected = localSelected.includes(item.id);
                const name = type === 'assets' 
                  ? (item as Asset).name 
                  : getLocalizedText((item as Collection).name, locale);
                
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${
                      isSelected 
                        ? 'bg-black text-white' 
                        : 'bg-neutral-50 hover:bg-neutral-100'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                      isSelected 
                        ? 'bg-white border-white' 
                        : 'border-neutral-300'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-black" />}
                    </div>
                    
                    {type === 'assets' && (item as Asset).image_url && (
                      <img
                        src={(item as Asset).image_url}
                        alt={name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    )}
                    
                    {type === 'collections' && (item as Collection).image_url && (
                      <img
                        src={(item as Collection).image_url}
                        alt={name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    )}
                    
                    <div className="flex-1">
                      <p className="font-medium text-sm">{name}</p>
                      {type === 'assets' && (
                        <p className={`text-xs ${isSelected ? 'text-white/70' : 'text-neutral-400'}`}>
                          Estoque: {(item as Asset).stock_quantity}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 bg-neutral-50">
          <span className="text-sm text-neutral-500">
            {localSelected.length} selecionado(s)
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-black text-white text-sm font-medium rounded-xl hover:bg-neutral-800 transition-colors"
            >
              Confirmar
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ResourceSelector;

