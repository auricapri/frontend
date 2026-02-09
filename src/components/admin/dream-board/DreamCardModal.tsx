import React, { useState } from 'react';
import { X, Trash2, Image, Tag, MessageSquare, Workflow } from 'lucide-react';
import { Category, Asset, Collection, Product } from '../../../types';
import { DreamCard } from '../../../types/dream';
import { Locale, t } from '../../../i18n';
import CommentSection from './CommentSection';
import DiagramEditor from './DiagramEditor';
import ResourceSelector from './ResourceSelector';

interface DreamCardModalProps {
  card: DreamCard;
  categories: Category[];
  collections: Collection[];
  assets: Asset[];
  products: Product[];
  locale: Locale;
  isLastColumn: boolean;
  onUpdate: (updates: Partial<DreamCard>) => void;
  onDelete: () => void;
  onClose: () => void;
}

type Tab = 'details' | 'diagram' | 'resources' | 'comments';

const DreamCardModal: React.FC<DreamCardModalProps> = ({
  card,
  categories,
  collections,
  assets,
  products,
  locale,
  isLastColumn,
  onUpdate,
  onDelete,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('details');
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [imageUrl, setImageUrl] = useState(card.image_url || '');
  const [categoryId, setCategoryId] = useState(card.category_id || '');
  const [strategy, setStrategy] = useState(card.metadata?.strategy || '');

  const handleSave = () => {
    onUpdate({
      title,
      description: description || undefined,
      image_url: imageUrl || undefined,
      category_id: categoryId || undefined,
      metadata: {
        ...card.metadata,
        strategy: strategy || undefined,
      },
    });
  };

  const handleDiagramUpdate = (diagram: DreamCard['metadata']['diagram']) => {
    onUpdate({
      metadata: {
        ...card.metadata,
        diagram,
      },
    });
  };

  const handleResourcesUpdate = (resources: {
    associated_assets?: string[];
    associated_collections?: string[];
    draft_product_id?: string;
    draft_collection_id?: string;
    draft_category_id?: string;
  }) => {
    onUpdate({
      metadata: {
        ...card.metadata,
        ...resources,
      },
    });
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'details', label: 'Detalhes', icon: <Tag className="w-4 h-4" /> },
    { id: 'diagram', label: 'Diagrama', icon: <Workflow className="w-4 h-4" /> },
    { id: 'resources', label: 'Recursos', icon: <Image className="w-4 h-4" /> },
    { id: 'comments', label: 'Comentarios', icon: <MessageSquare className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-neutral-100">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold">{card.title}</h2>
            {isLastColumn && card.completed_at && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-lg">
                Concluido
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirm('Tem certeza que deseja excluir este card?')) {
                  onDelete();
                }
              }}
              className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex border-b border-neutral-100">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-black text-black'
                  : 'text-neutral-400 hover:text-neutral-600'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Titulo
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleSave}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Titulo do card"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Descricao
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={handleSave}
                  rows={4}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black resize-none"
                  placeholder="Descreva a ideia..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Imagem (URL)
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onBlur={handleSave}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="https://..."
                />
                {imageUrl && (
                  <div className="mt-3">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="max-h-48 rounded-xl object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Categoria
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    setTimeout(handleSave, 0);
                  }}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black bg-white"
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name[locale] || cat.name.pt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Estrategia / Notas
                </label>
                <textarea
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value)}
                  onBlur={handleSave}
                  rows={3}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black resize-none"
                  placeholder="Anotacoes sobre estrategia de producao..."
                />
              </div>
            </div>
          )}

          {activeTab === 'diagram' && (
            <DiagramEditor
              diagram={card.metadata?.diagram}
              products={products}
              locale={locale}
              onUpdate={handleDiagramUpdate}
            />
          )}

          {activeTab === 'resources' && (
            <ResourceSelector
              metadata={card.metadata}
              assets={assets}
              collections={collections}
              categories={categories}
              products={products}
              locale={locale}
              onUpdate={handleResourcesUpdate}
            />
          )}

          {activeTab === 'comments' && (
            <CommentSection cardId={card.id} />
          )}
        </div>
      </div>
    </div>
  );
};

export default DreamCardModal;
