import React, { useState, useEffect, useRef } from 'react';
import { X, Trash2, Upload, GitBranch, Sparkles, ExternalLink, Loader2, ImagePlus, Clock, AlertTriangle, RotateCcw, Download, ChevronDown } from 'lucide-react';
import { Node, Edge } from 'reactflow';
import { DreamCard, Category, Collection, Asset, LocalizedText, Product } from '../../../types';
import { Locale } from '../../../i18n';
import { DreamApi } from '../../../api/dream.api';
import DiagramEditor from './DiagramEditor';
import ResourceSelector from './ResourceSelector';
import CommentSection from './CommentSection';
import PreviewPanel from './PreviewPanel';
import { exportDiagramAsPNG, exportDiagramAsSVG, exportDiagramAsJSON } from '../../../utils/diagram-export';

interface DreamCardModalProps {
  card: DreamCard;
  categories: Category[];
  collections: Collection[];
  assets: Asset[];
  products?: Product[];
  locale: Locale;
  isLastColumn: boolean;
  onUpdate: (updates: Partial<DreamCard>) => void;
  onDelete: () => void;
  onClose: () => void;
}

const getLocalizedText = (text: LocalizedText | string | undefined, locale: Locale): string => {
  if (!text) return '';
  if (typeof text === 'string') return text;
  return text[locale] || text.pt || text.en || '';
};

const DreamCardModal: React.FC<DreamCardModalProps> = ({
  card,
  products = [],
  categories,
  collections,
  assets,
  locale,
  isLastColumn,
  onUpdate,
  onDelete,
  onClose,
}) => {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [imageUrl, setImageUrl] = useState(card.image_url || '');
  const [categoryId, setCategoryId] = useState(card.category_id || '');
  const [strategy, setStrategy] = useState(card.metadata?.strategy || '');
  const [associatedAssets, setAssociatedAssets] = useState<string[]>(card.metadata?.associated_assets || []);
  const [associatedCollections, setAssociatedCollections] = useState<string[]>(card.metadata?.associated_collections || []);
  const [diagram, setDiagram] = useState(card.metadata?.diagram || { nodes: [], edges: [] });

  const [showDiagramEditor, setShowDiagramEditor] = useState(false);
  const [showResourceSelector, setShowResourceSelector] = useState<'assets' | 'collections' | null>(null);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [draftResult, setDraftResult] = useState<{ product_id?: string } | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'png' | 'svg' | 'json' | null>(null);
  
  // Estado de exclusão automática
  const [deletionInfo, setDeletionInfo] = useState<{ is_completed: boolean; deletion_date: string | null; days_until_deletion: number | null } | null>(null);
  const [isReopening, setIsReopening] = useState(false);

  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'preview'>('details');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const hiddenDiagramRef = useRef<HTMLDivElement>(null);
  const dreamApi = new DreamApi();

  // Buscar informações de exclusão quando card está na última coluna
  useEffect(() => {
    if (isLastColumn && card.id) {
      dreamApi.getDeletionInfo(card.id)
        .then(info => setDeletionInfo(info))
        .catch(err => console.error('Erro ao buscar info de exclusão:', err));
    }
  }, [isLastColumn, card.id]);

  useEffect(() => {
    const handler = setTimeout(() => {
      const updates: Partial<DreamCard> = {
        title,
        description,
        image_url: imageUrl,
        category_id: categoryId || undefined,
        metadata: {
          ...card.metadata,
          strategy,
          associated_assets: associatedAssets,
          associated_collections: associatedCollections,
          diagram,
        },
      };
      onUpdate(updates);
    }, 500);

    return () => clearTimeout(handler);
  }, [title, description, imageUrl, categoryId, strategy, associatedAssets, associatedCollections, diagram]);

  const handleGenerateDraft = async () => {
    if (!title.trim()) {
      alert('O titulo e obrigatorio para gerar o rascunho.');
      return;
    }

    setIsGeneratingDraft(true);
    try {
      const result = await dreamApi.generateDraft(card.id);
      setDraftResult(result);
      onUpdate({
        metadata: {
          ...card.metadata,
          draft_product_id: result.product_id,
          draft_collection_id: result.collection_id,
          draft_category_id: result.category_id,
        },
      });
    } catch (error) {
      console.error('Error generating draft:', error);
      alert('Erro ao gerar rascunho. Tente novamente.');
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const handleDeleteConfirm = () => {
    if (confirm('Tem certeza que deseja excluir este card?')) {
      onDelete();
    }
  };

  const hasDraft = card.metadata?.draft_product_id || draftResult?.product_id;

  const handleReopenCard = async () => {
    setIsReopening(true);
    try {
      await dreamApi.reopenCard(card.id);
      setDeletionInfo(null);
      alert('Card reaberto! Não será mais removido automaticamente.');
    } catch (error) {
      console.error('Erro ao reabrir card:', error);
      alert('Erro ao reabrir card.');
    } finally {
      setIsReopening(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setImageUrl(base64);
        setIsUploadingImage(false);
      };
      reader.onerror = () => {
        setIsUploadingImage(false);
        alert('Erro ao ler a imagem. Tente novamente.');
      };
      reader.readAsDataURL(file);
    } catch {
      setIsUploadingImage(false);
      alert('Erro ao processar a imagem.');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as HTMLElement)) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu]);

  const handleExportPNG = async () => {
    if (diagram.nodes.length === 0) return;
    
    if (!showDiagramEditor) {
      alert('Para exportar como PNG, abra o editor do diagrama primeiro.');
      setShowExportMenu(false);
      return;
    }
    
    setIsExporting(true);
    setExportFormat('png');
    setShowExportMenu(false);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const reactFlowElement = document.querySelector('.react-flow__viewport') as HTMLElement || 
                               document.querySelector('.react-flow') as HTMLElement;
      if (reactFlowElement) {
        await exportDiagramAsPNG(reactFlowElement, diagram, title);
      } else {
        throw new Error('ReactFlow element not found. Certifique-se de que o editor está aberto.');
      }
    } catch (error) {
      console.error('Error exporting PNG:', error);
      alert('Erro ao exportar diagrama como PNG. Certifique-se de que o editor está aberto e tente novamente.');
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  };

  const handleExportSVG = () => {
    if (diagram.nodes.length === 0) return;
    
    setIsExporting(true);
    setExportFormat('svg');
    setShowExportMenu(false);

    try {
      const nodes = diagram.nodes as Node[];
      const edges = diagram.edges as Edge[];
      exportDiagramAsSVG(nodes, edges, diagram, title);
    } catch (error) {
      console.error('Error exporting SVG:', error);
      alert('Erro ao exportar diagrama como SVG. Tente novamente.');
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  };

  const handleExportJSON = () => {
    if (diagram.nodes.length === 0) return;
    
    setIsExporting(true);
    setExportFormat('json');
    setShowExportMenu(false);

    try {
      exportDiagramAsJSON(diagram, title);
    } catch (error) {
      console.error('Error exporting JSON:', error);
      alert('Erro ao exportar diagrama como JSON. Tente novamente.');
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50">
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titulo da ideia..."
              className="text-xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 w-96"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDeleteConfirm}
              className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-200 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="flex border-b border-neutral-100">
          {(['details', 'comments', 'preview'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-black border-b-2 border-black'
                  : 'text-neutral-400 hover:text-neutral-600'
              }`}
            >
              {tab === 'details' && 'Detalhes'}
              {tab === 'comments' && 'Comentarios'}
              {tab === 'preview' && 'Preview'}
            </button>
          ))}
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'details' && (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-neutral-500 mb-2">
                    Descricao
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva sua ideia em detalhes..."
                    rows={4}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-neutral-500 mb-2">
                    Estrategia
                  </label>
                  <textarea
                    value={strategy}
                    onChange={(e) => setStrategy(e.target.value)}
                    placeholder="Qual sera a estrategia de marketing, vendas, etc..."
                    rows={3}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-neutral-500 mb-2">
                    Categoria
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="">Selecionar categoria...</option>
                    {categories.filter(c => c.is_active).map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {getLocalizedText(cat.name, locale)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-neutral-500 mb-2">
                    Colecoes Associadas
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {associatedCollections.map(colId => {
                      const col = collections.find(c => c.id === colId);
                      return col ? (
                        <span
                          key={colId}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full"
                        >
                          {getLocalizedText(col.name, locale)}
                          <button
                            onClick={() => setAssociatedCollections(prev => prev.filter(id => id !== colId))}
                            className="hover:text-indigo-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                  <button
                    onClick={() => setShowResourceSelector('collections')}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    + Adicionar colecao
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-neutral-500 mb-2">
                    Insumos Associados
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {associatedAssets.map(assetId => {
                      const asset = assets.find(a => a.id === assetId);
                      return asset ? (
                        <span
                          key={assetId}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full"
                        >
                          {asset.name}
                          <button
                            onClick={() => setAssociatedAssets(prev => prev.filter(id => id !== assetId))}
                            className="hover:text-amber-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                  <button
                    onClick={() => setShowResourceSelector('assets')}
                    className="text-sm text-amber-600 hover:text-amber-800 font-medium"
                  >
                    + Adicionar insumo
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-neutral-500 mb-2">
                    Imagem
                  </label>
                  {imageUrl ? (
                    <div className="relative group">
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-xl border border-neutral-200"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-2 bg-white text-black text-xs font-medium rounded-lg hover:bg-neutral-100"
                        >
                          Trocar
                        </button>
                        <button
                          onClick={() => setImageUrl('')}
                          className="p-2 bg-white/90 rounded-lg hover:bg-red-50"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-neutral-200 rounded-xl p-6 text-center space-y-4">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className="w-full flex flex-col items-center gap-2 p-4 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors"
                      >
                        {isUploadingImage ? (
                          <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
                        ) : (
                          <ImagePlus className="w-8 h-8 text-neutral-400" />
                        )}
                        <span className="text-sm font-medium text-neutral-600">
                          {isUploadingImage ? 'Carregando...' : 'Upload do dispositivo'}
                        </span>
                      </button>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-neutral-200" />
                        <span className="text-xs text-neutral-400">ou</span>
                        <div className="flex-1 h-px bg-neutral-200" />
                      </div>
                      
                      <div>
                        <p className="text-xs text-neutral-400 mb-2">Cole a URL da imagem</p>
                        <input
                          type="text"
                          placeholder="https://..."
                          onChange={(e) => setImageUrl(e.target.value)}
                          className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                        />
                      </div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-neutral-500 mb-2">
                    Diagrama de Fluxo
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDiagramEditor(true)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-4 border-2 border-dashed border-neutral-200 rounded-xl text-sm font-medium text-neutral-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                    >
                      <GitBranch className="w-5 h-5" />
                      {diagram.nodes.length > 0 ? `Editar Diagrama (${diagram.nodes.length} nos)` : 'Criar Diagrama'}
                    </button>
                    {diagram.nodes.length > 0 && (
                      <div className="relative" ref={exportMenuRef}>
                        <button
                          onClick={() => setShowExportMenu(!showExportMenu)}
                          disabled={isExporting}
                          className="flex items-center justify-center gap-2 px-4 py-4 border-2 border-neutral-200 rounded-xl text-sm font-medium text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isExporting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <Download className="w-5 h-5" />
                              <ChevronDown className="w-4 h-4" />
                            </>
                          )}
                        </button>
                        {showExportMenu && !isExporting && (
                          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-neutral-200 rounded-xl shadow-lg z-50 overflow-hidden">
                            <button
                              onClick={handleExportPNG}
                              className="w-full px-4 py-3 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-2"
                              title={!showDiagramEditor ? 'Abra o editor primeiro para exportar PNG' : ''}
                            >
                              <Download className="w-4 h-4" />
                              Exportar PNG
                              {!showDiagramEditor && <span className="text-xs text-neutral-400 ml-auto">(requer editor)</span>}
                            </button>
                            <button
                              onClick={handleExportSVG}
                              className="w-full px-4 py-3 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Exportar SVG
                            </button>
                            <button
                              onClick={handleExportJSON}
                              className="w-full px-4 py-3 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              Exportar JSON
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <CommentSection cardId={card.id} locale={locale} />
          )}

          {activeTab === 'preview' && (
            <PreviewPanel
              title={title}
              description={description}
              imageUrl={imageUrl}
              category={categories.find(c => c.id === categoryId)}
              assets={assets.filter(a => associatedAssets.includes(a.id))}
              collections={collections.filter(c => associatedCollections.includes(c.id))}
              locale={locale}
            />
          )}
        </div>

        {/* Aviso de exclusão automática */}
        {isLastColumn && deletionInfo?.is_completed && (
          <div className="px-6 py-4 bg-amber-50 border-t border-amber-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Exclusão Automática Agendada
                </p>
                <p className="text-xs text-amber-800 mt-1">
                  Este card será removido automaticamente em{' '}
                  <span className="font-bold">
                    {deletionInfo.days_until_deletion !== null 
                      ? `${deletionInfo.days_until_deletion} dia${deletionInfo.days_until_deletion !== 1 ? 's' : ''}`
                      : 'breve'}
                  </span>
                  {deletionInfo.deletion_date && (
                    <> ({new Date(deletionInfo.deletion_date).toLocaleDateString('pt-BR')})</>
                  )}.
                </p>
                <p className="text-[10px] text-amber-700 mt-1">
                  Todos os dados, comentários e rascunhos serão excluídos permanentemente.
                </p>
              </div>
              <button
                onClick={handleReopenCard}
                disabled={isReopening}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                {isReopening ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                Reabrir Card
              </button>
            </div>
          </div>
        )}

        <footer className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 bg-neutral-50">
          <div className="text-xs text-neutral-400">
            {card.created_at && (
              <span>Criado em {new Date(card.created_at).toLocaleDateString('pt-BR')}</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {hasDraft && (
              <a
                href={`/admin?tab=inventory&product=${card.metadata?.draft_product_id || draftResult?.product_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Ver Rascunho
              </a>
            )}

            {isLastColumn && !hasDraft && (
              <button
                onClick={handleGenerateDraft}
                disabled={isGeneratingDraft}
                className="flex items-center gap-2 px-6 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                {isGeneratingDraft ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Gerar Rascunho
                  </>
                )}
              </button>
            )}

            <button
              onClick={onClose}
              className="px-6 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-neutral-800 transition-colors"
            >
              Fechar
            </button>
          </div>
        </footer>
      </div>

      {showDiagramEditor && (
        <DiagramEditor
          diagram={diagram}
          products={products}
          collections={collections}
          locale={locale}
          onSave={(newDiagram) => {
            setDiagram(newDiagram);
            setShowDiagramEditor(false);
          }}
          onClose={() => setShowDiagramEditor(false)}
        />
      )}

      {showResourceSelector && (
        <ResourceSelector
          type={showResourceSelector}
          items={showResourceSelector === 'assets' ? assets : collections}
          selectedIds={showResourceSelector === 'assets' ? associatedAssets : associatedCollections}
          locale={locale}
          onSelect={(ids) => {
            if (showResourceSelector === 'assets') {
              setAssociatedAssets(ids);
            } else {
              setAssociatedCollections(ids);
            }
            setShowResourceSelector(null);
          }}
          onClose={() => setShowResourceSelector(null)}
        />
      )}
    </div>
  );
};

export default DreamCardModal;

