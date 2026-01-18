import React from 'react';
import { Package, Tag, Layers, Image as ImageIcon } from 'lucide-react';
import { Category, Asset, Collection, LocalizedText } from '../../../types';
import { Locale } from '../../../i18n';

interface PreviewPanelProps {
  title: string;
  description: string;
  imageUrl: string;
  category?: Category;
  assets: Asset[];
  collections: Collection[];
  locale: Locale;
}

const getLocalizedText = (text: LocalizedText | string | undefined, locale: Locale): string => {
  if (!text) return '';
  if (typeof text === 'string') return text;
  return text[locale] || text.pt || text.en || '';
};

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  title,
  description,
  imageUrl,
  category,
  assets,
  collections,
  locale,
}) => {
  return (
    <div className="grid grid-cols-2 gap-8">
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500">
          Preview do Produto
        </h3>
        
        <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-100">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full aspect-square object-cover rounded-xl mb-4"
            />
          ) : (
            <div className="w-full aspect-square bg-neutral-200 rounded-xl mb-4 flex items-center justify-center">
              <ImageIcon className="w-16 h-16 text-neutral-300" />
            </div>
          )}

          <h2 className="text-xl font-bold mb-2">
            {title || 'Titulo do Produto'}
          </h2>

          {category && (
            <span className="inline-block px-3 py-1 bg-neutral-200 text-neutral-600 text-xs font-medium rounded-full mb-3">
              {getLocalizedText(category.name, locale)}
            </span>
          )}

          <p className="text-sm text-neutral-500 line-clamp-3">
            {description || 'Descricao do produto aparecera aqui...'}
          </p>

          <div className="mt-4 pt-4 border-t border-neutral-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-400">Preco</span>
              <span className="font-bold text-lg">R$ 0,00</span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              * Preco sera definido ao finalizar o rascunho
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500 mb-3 flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Categoria
          </h3>
          {category ? (
            <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
              {category.image_url && (
                <img
                  src={category.image_url}
                  alt={getLocalizedText(category.name, locale)}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              )}
              <div>
                <p className="font-medium">{getLocalizedText(category.name, locale)}</p>
                <p className="text-xs text-neutral-400">Categoria ativa</p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-neutral-50 rounded-xl border border-dashed border-neutral-200 text-center">
              <p className="text-sm text-neutral-400">Nenhuma categoria selecionada</p>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500 mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Colecoes ({collections.length})
          </h3>
          {collections.length > 0 ? (
            <div className="space-y-2">
              {collections.map(col => (
                <div
                  key={col.id}
                  className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl"
                >
                  {col.image_url && (
                    <img
                      src={col.image_url}
                      alt={getLocalizedText(col.name, locale)}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  )}
                  <p className="font-medium text-sm text-indigo-700">
                    {getLocalizedText(col.name, locale)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-neutral-50 rounded-xl border border-dashed border-neutral-200 text-center">
              <p className="text-sm text-neutral-400">Nenhuma colecao associada</p>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-500 mb-3 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Insumos ({assets.length})
          </h3>
          {assets.length > 0 ? (
            <div className="space-y-2">
              {assets.map(asset => (
                <div
                  key={asset.id}
                  className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl"
                >
                  {asset.image_url && (
                    <img
                      src={asset.image_url}
                      alt={asset.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-sm text-amber-700">{asset.name}</p>
                    <p className="text-xs text-amber-500">
                      Estoque: {asset.stock_quantity} | Custo: R$ {asset.cost_price?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-neutral-50 rounded-xl border border-dashed border-neutral-200 text-center">
              <p className="text-sm text-neutral-400">Nenhum insumo associado</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
          <h4 className="font-bold text-emerald-700 text-sm mb-2">O que sera gerado:</h4>
          <ul className="text-xs text-emerald-600 space-y-1">
            <li>1 Produto em rascunho (inativo)</li>
            <li>1 Variante padrao com preco R$ 0,00</li>
            {collections.length > 0 && (
              <li>Associacao com {collections.length} colecao(oes)</li>
            )}
            {category && (
              <li>Categoria: {getLocalizedText(category.name, locale)}</li>
            )}
          </ul>
          <p className="text-xs text-emerald-500 mt-3">
            Voce podera editar todos os detalhes no catalogo antes de ativar.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PreviewPanel;

