/**
 * AdminGarmentGallery - Virtual try-on gallery management
 * Manages garments, models, processing, review workflow, and approved gallery
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Shirt, User, Play, CheckCircle, Image, Loader2, Plus, Trash2,
  RefreshCw, Upload, Eye, X, Check, XCircle
} from 'lucide-react';
import {
  GarmentTransferApi,
  Garment,
  GarmentModel,
  TransferJob,
  TransferResult,
  GalleryItem,
  PaginatedResponse,
  ReviewResponse,
} from '../../api/garment-transfer.api';

const api = new GarmentTransferApi();

// ============================================================================
// Types
// ============================================================================

type TabId = 'garments' | 'models' | 'processing' | 'review' | 'gallery';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

const TABS: Tab[] = [
  { id: 'garments', label: 'Peças', icon: Shirt },
  { id: 'models', label: 'Modelos', icon: User },
  { id: 'processing', label: 'Processar', icon: Play },
  { id: 'review', label: 'Revisão', icon: CheckCircle },
  { id: 'gallery', label: 'Galeria', icon: Image },
];

// ============================================================================
// Sub-components
// ============================================================================

interface ImageCardProps {
  imageUrl: string;
  title: string;
  subtitle?: string;
  status?: string;
  onDelete?: () => void;
  onClick?: () => void;
  selected?: boolean;
}

const ImageCard: React.FC<ImageCardProps> = ({
  imageUrl,
  title,
  subtitle,
  status,
  onDelete,
  onClick,
  selected,
}) => (
  <div
    onClick={onClick}
    className={`group relative bg-white rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
      selected ? 'border-black ring-2 ring-black/10' : 'border-transparent hover:border-neutral-200'
    }`}
  >
    <div className="aspect-[3/4] bg-neutral-100">
      <img
        src={imageUrl}
        alt={title}
        className="w-full h-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src = 'https://placehold.co/300x400?text=Imagem';
        }}
      />
    </div>
    <div className="p-3">
      <h4 className="font-medium text-sm truncate">{title}</h4>
      {subtitle && <p className="text-xs text-neutral-500 truncate">{subtitle}</p>}
      {status && (
        <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
          status === 'ready' ? 'bg-green-100 text-green-700' :
          status === 'error' ? 'bg-red-100 text-red-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {status === 'ready' ? 'Pronto' : status === 'error' ? 'Erro' : 'Processando'}
        </span>
      )}
    </div>
    {onDelete && (
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    )}
    {selected && (
      <div className="absolute top-2 left-2 p-1 bg-black text-white rounded-full">
        <Check className="w-4 h-4" />
      </div>
    )}
  </div>
);

interface UploadZoneProps {
  onUpload: (file: File, name: string) => Promise<void>;
  label: string;
  isUploading: boolean;
}

const UploadZone: React.FC<UploadZoneProps> = ({ onUpload, label, isUploading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [name, setName] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem');
      return;
    }
    const itemName = name.trim() || file.name.replace(/\.[^/.]+$/, '');
    await onUpload(file, itemName);
    setName('');
  };

  return (
    <div
      className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
        dragActive ? 'border-black bg-neutral-50' : 'border-neutral-300'
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragActive(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <Upload className="w-8 h-8 mx-auto mb-3 text-neutral-400" />
      <p className="text-sm text-neutral-600 mb-3">
        Arraste uma imagem ou{' '}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="text-black font-medium underline"
        >
          selecione um arquivo
        </button>
      </p>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={`Nome da ${label}...`}
        className="w-full max-w-xs px-4 py-2 border rounded-xl text-sm text-center mx-auto"
      />
      {isUploading && (
        <div className="mt-3 flex items-center justify-center gap-2 text-sm text-neutral-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          Enviando...
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Tab Components
// ============================================================================

const GarmentsTab: React.FC = () => {
  const [garments, setGarments] = useState<Garment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchGarments = async (pageNum = 1) => {
    try {
      const data = await api.listGarments(pageNum, 20);
      const items = data?.items || [];
      if (pageNum === 1) {
        setGarments(items);
      } else {
        setGarments(prev => [...prev, ...items]);
      }
      setHasMore(data?.has_more || false);
      setPage(pageNum);
    } catch (err) {
      console.error('Error fetching garments:', err);
      if (pageNum === 1) setGarments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchGarments(); }, []);

  const handleUpload = async (file: File, name: string) => {
    setIsUploading(true);
    try {
      await api.uploadGarment(file, name);
      await fetchGarments(1);
    } catch (err) {
      console.error('Error uploading garment:', err);
      alert('Erro ao enviar peça');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta peça?')) return;
    try {
      await api.deleteGarment(id);
      setGarments(prev => prev.filter(g => g.id !== id));
    } catch (err) {
      console.error('Error deleting garment:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <UploadZone onUpload={handleUpload} label="peça" isUploading={isUploading} />

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {garments.map(g => (
          <ImageCard
            key={g.id}
            imageUrl={g.image_url}
            title={g.name}
            subtitle={g.category}
            status={g.status}
            onDelete={() => handleDelete(g.id)}
          />
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => fetchGarments(page + 1)}
          className="w-full py-3 bg-neutral-100 hover:bg-neutral-200 rounded-xl text-sm font-medium"
        >
          Carregar mais
        </button>
      )}

      {garments.length === 0 && (
        <p className="text-center text-neutral-500 py-8">
          Nenhuma peça cadastrada. Faça upload de imagens de peças de roupa.
        </p>
      )}
    </div>
  );
};

const ModelsTab: React.FC = () => {
  const [models, setModels] = useState<GarmentModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchModels = async (pageNum = 1) => {
    try {
      const data = await api.listModels(pageNum, 20);
      const items = data?.items || [];
      if (pageNum === 1) {
        setModels(items);
      } else {
        setModels(prev => [...prev, ...items]);
      }
      setHasMore(data?.has_more || false);
      setPage(pageNum);
    } catch (err) {
      console.error('Error fetching models:', err);
      if (pageNum === 1) setModels([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchModels(); }, []);

  const handleUpload = async (file: File, name: string) => {
    setIsUploading(true);
    try {
      await api.uploadModel(file, name);
      await fetchModels(1);
    } catch (err) {
      console.error('Error uploading model:', err);
      alert('Erro ao enviar modelo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este modelo?')) return;
    try {
      await api.deleteModel(id);
      setModels(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error('Error deleting model:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <UploadZone onUpload={handleUpload} label="modelo" isUploading={isUploading} />

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {models.map(m => (
          <ImageCard
            key={m.id}
            imageUrl={m.image_url}
            title={m.name}
            subtitle={m.gender}
            status={m.status}
            onDelete={() => handleDelete(m.id)}
          />
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => fetchModels(page + 1)}
          className="w-full py-3 bg-neutral-100 hover:bg-neutral-200 rounded-xl text-sm font-medium"
        >
          Carregar mais
        </button>
      )}

      {models.length === 0 && (
        <p className="text-center text-neutral-500 py-8">
          Nenhum modelo cadastrado. Faça upload de fotos de modelos.
        </p>
      )}
    </div>
  );
};

const ProcessingTab: React.FC = () => {
  const [garments, setGarments] = useState<Garment[]>([]);
  const [models, setModels] = useState<GarmentModel[]>([]);
  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(null);
  const [selectedModel, setSelectedModel] = useState<GarmentModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentJob, setCurrentJob] = useState<TransferJob | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gData, mData] = await Promise.all([
          api.listGarments(1, 100),
          api.listModels(1, 100),
        ]);
        const gItems = gData?.items || [];
        const mItems = mData?.items || [];
        setGarments(gItems.filter(g => g.status === 'ready'));
        setModels(mItems.filter(m => m.status === 'ready'));
      } catch (err) {
        console.error('Error fetching data:', err);
        setGarments([]);
        setModels([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const startProcessing = async () => {
    if (!selectedGarment || !selectedModel) return;
    setIsProcessing(true);
    try {
      const job = await api.startTransfer(selectedGarment.id, selectedModel.id);
      setCurrentJob(job);

      // Poll for completion
      const result = await api.waitForTransfer(job.id, 120000);
      setCurrentJob(result);

      if (result.status === 'completed') {
        alert('Processamento concluído! A imagem está aguardando revisão.');
      } else if (result.status === 'failed') {
        alert(`Falha no processamento: ${result.error || 'Erro desconhecido'}`);
      }
    } catch (err) {
      console.error('Error processing:', err);
      alert('Erro ao processar');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Selection Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Garments */}
        <div>
          <h3 className="font-bold mb-4">1. Selecione a Peça</h3>
          <div className="grid grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2">
            {garments.map(g => (
              <ImageCard
                key={g.id}
                imageUrl={g.image_url}
                title={g.name}
                selected={selectedGarment?.id === g.id}
                onClick={() => setSelectedGarment(g)}
              />
            ))}
          </div>
          {garments.length === 0 && (
            <p className="text-neutral-500 text-sm">Nenhuma peça disponível</p>
          )}
        </div>

        {/* Models */}
        <div>
          <h3 className="font-bold mb-4">2. Selecione o Modelo</h3>
          <div className="grid grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2">
            {models.map(m => (
              <ImageCard
                key={m.id}
                imageUrl={m.image_url}
                title={m.name}
                selected={selectedModel?.id === m.id}
                onClick={() => setSelectedModel(m)}
              />
            ))}
          </div>
          {models.length === 0 && (
            <p className="text-neutral-500 text-sm">Nenhum modelo disponível</p>
          )}
        </div>
      </div>

      {/* Process Button */}
      <div className="flex flex-col items-center gap-4 py-6 border-t">
        <div className="flex items-center gap-4">
          {selectedGarment && (
            <div className="text-center">
              <img
                src={selectedGarment.image_url}
                alt={selectedGarment.name}
                className="w-20 h-24 object-cover rounded-lg"
              />
              <p className="text-xs mt-1">{selectedGarment.name}</p>
            </div>
          )}
          {selectedGarment && selectedModel && (
            <Plus className="w-6 h-6 text-neutral-400" />
          )}
          {selectedModel && (
            <div className="text-center">
              <img
                src={selectedModel.image_url}
                alt={selectedModel.name}
                className="w-20 h-24 object-cover rounded-lg"
              />
              <p className="text-xs mt-1">{selectedModel.name}</p>
            </div>
          )}
        </div>

        <button
          onClick={startProcessing}
          disabled={!selectedGarment || !selectedModel || isProcessing}
          className="flex items-center gap-2 px-8 py-3 bg-black text-white rounded-xl font-medium disabled:bg-neutral-300 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Processar Virtual Try-On
            </>
          )}
        </button>

        {currentJob && currentJob.status === 'completed' && currentJob.result_url && (
          <div className="mt-4">
            <p className="text-sm text-green-600 mb-2">Resultado:</p>
            <img
              src={currentJob.result_url}
              alt="Result"
              className="w-48 h-64 object-cover rounded-xl border"
            />
          </div>
        )}
      </div>
    </div>
  );
};

const ReviewTab: React.FC = () => {
  const [reviewItem, setReviewItem] = useState<TransferResult | null>(null);
  const [remainingCount, setRemainingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);

  const fetchNext = async () => {
    setIsLoading(true);
    try {
      const data = await api.getNextForReview();
      setReviewItem(data.item || null);
      setRemainingCount(data.remaining_count);
    } catch (err) {
      console.error('Error fetching review item:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchNext(); }, []);

  const handleApprove = async () => {
    if (!reviewItem) return;
    setIsActing(true);
    try {
      await api.approveResult(reviewItem.id);
      await fetchNext();
    } catch (err) {
      console.error('Error approving:', err);
    } finally {
      setIsActing(false);
    }
  };

  const handleReject = async () => {
    if (!reviewItem) return;
    setIsActing(true);
    try {
      await api.rejectResult(reviewItem.id);
      await fetchNext();
    } catch (err) {
      console.error('Error rejecting:', err);
    } finally {
      setIsActing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!reviewItem) {
    return (
      <div className="text-center py-16">
        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
        <h3 className="text-xl font-bold mb-2">Tudo revisado!</h3>
        <p className="text-neutral-500">Não há itens pendentes de revisão.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold">Revisão de Resultados</h3>
        <span className="text-sm text-neutral-500">
          {remainingCount} pendente{remainingCount !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Garment */}
        <div className="bg-white rounded-2xl p-4">
          <p className="text-xs text-neutral-500 mb-2">Peça</p>
          <img
            src={reviewItem.garment.image_url}
            alt={reviewItem.garment.name}
            className="w-full aspect-[3/4] object-cover rounded-xl"
          />
          <p className="text-sm font-medium mt-2">{reviewItem.garment.name}</p>
        </div>

        {/* Model */}
        <div className="bg-white rounded-2xl p-4">
          <p className="text-xs text-neutral-500 mb-2">Modelo</p>
          <img
            src={reviewItem.model.image_url}
            alt={reviewItem.model.name}
            className="w-full aspect-[3/4] object-cover rounded-xl"
          />
          <p className="text-sm font-medium mt-2">{reviewItem.model.name}</p>
        </div>

        {/* Result */}
        <div className="bg-white rounded-2xl p-4 ring-2 ring-black">
          <p className="text-xs text-neutral-500 mb-2">Resultado</p>
          <img
            src={reviewItem.result_url}
            alt="Result"
            className="w-full aspect-[3/4] object-cover rounded-xl"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <button
          onClick={handleReject}
          disabled={isActing}
          className="flex items-center gap-2 px-8 py-3 bg-red-100 text-red-700 hover:bg-red-200 rounded-xl font-medium disabled:opacity-50"
        >
          <XCircle className="w-5 h-5" />
          Rejeitar
        </button>
        <button
          onClick={handleApprove}
          disabled={isActing}
          className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white hover:bg-green-700 rounded-xl font-medium disabled:opacity-50"
        >
          <Check className="w-5 h-5" />
          Aprovar
        </button>
      </div>
    </div>
  );
};

const GalleryTab: React.FC = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [previewItem, setPreviewItem] = useState<GalleryItem | null>(null);

  const fetchGallery = async (pageNum = 1) => {
    try {
      const data = await api.listGallery(pageNum, 20);
      const items = data?.items || [];
      if (pageNum === 1) {
        setItems(items);
      } else {
        setItems(prev => [...prev, ...items]);
      }
      setHasMore(data?.has_more || false);
      setPage(pageNum);
    } catch (err) {
      console.error('Error fetching gallery:', err);
      if (pageNum === 1) setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchGallery(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Remover da galeria?')) return;
    try {
      await api.removeFromGallery(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      console.error('Error removing from gallery:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map(item => (
          <div key={item.id} className="group relative">
            <ImageCard
              imageUrl={item.result_url}
              title={item.garment.name}
              subtitle={item.model.name}
              onClick={() => setPreviewItem(item)}
            />
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => fetchGallery(page + 1)}
          className="w-full py-3 bg-neutral-100 hover:bg-neutral-200 rounded-xl text-sm font-medium"
        >
          Carregar mais
        </button>
      )}

      {items.length === 0 && (
        <p className="text-center text-neutral-500 py-8">
          Galeria vazia. Aprove resultados na aba de Revisão para adicionar à galeria.
        </p>
      )}

      {/* Preview Modal */}
      {previewItem && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold">{previewItem.garment.name}</h3>
              <button
                onClick={() => setPreviewItem(null)}
                className="p-2 hover:bg-neutral-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <img
                src={previewItem.result_url}
                alt={previewItem.garment.name}
                className="w-full rounded-xl"
              />
              <div className="mt-4 flex gap-4 text-sm text-neutral-600">
                <div>
                  <span className="font-medium">Peça:</span> {previewItem.garment.name}
                </div>
                <div>
                  <span className="font-medium">Modelo:</span> {previewItem.model.name}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const AdminGarmentGallery: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('garments');

  return (
    <div className="h-full flex flex-col">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black uppercase tracking-tight">
          Galeria Virtual
        </h1>
        <a
          href="#/provador"
          target="_blank"
          className="flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-xl text-sm font-medium"
        >
          <Eye className="w-4 h-4" />
          Ver Provador
        </a>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-black text-white'
                : 'bg-neutral-100 hover:bg-neutral-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeTab === 'garments' && <GarmentsTab />}
        {activeTab === 'models' && <ModelsTab />}
        {activeTab === 'processing' && <ProcessingTab />}
        {activeTab === 'review' && <ReviewTab />}
        {activeTab === 'gallery' && <GalleryTab />}
      </div>
    </div>
  );
};

export default AdminGarmentGallery;
