import React, { useMemo, useState } from 'react';
import { Camera, AlertCircle, Trash2, UploadCloud } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { DeliveryApi } from '../../api/delivery.api';

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Falha ao ler arquivo'));
    reader.readAsDataURL(file);
  });
}

export function ReportProblemModal(props: {
  isOpen: boolean;
  onClose: () => void;
  supplierName: string;
  context: { orderId: string; orderItemId: string } | null;
  onReported: () => void;
}) {
  const { isOpen, onClose, supplierName, context, onReported } = props;
  const api = useMemo(() => new DeliveryApi(), []);

  const [notes, setNotes] = useState('');
  const [issueType, setIssueType] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const canSubmit = context && issueType.trim().length > 0 && files.length > 0 && !isLoading;

  const reset = () => {
    setNotes('');
    setIssueType('');
    setFiles([]);
    setPreviews([]);
    setError('');
    setIsLoading(false);
  };

  const handleClose = () => {
    if (!isLoading) {
      reset();
      onClose();
    }
  };

  const onPickFiles = async (picked: FileList | null) => {
    if (!picked || picked.length === 0) return;
    const list = Array.from(picked).slice(0, 3);
    setFiles(list);

    try {
      const urls = await Promise.all(list.map((f) => readFileAsDataUrl(f)));
      setPreviews(urls);
    } catch {
      setPreviews([]);
    }
  };

  const removeEvidence = () => {
    setFiles([]);
    setPreviews([]);
  };

  const handleSubmit = async () => {
    if (!context) return;
    if (!issueType.trim()) {
      setError('Selecione o tipo de problema');
      return;
    }
    if (files.length === 0) {
      setError('Adicione pelo menos uma evidência');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const mediaUrls: string[] = [];

      for (const file of files) {
        const dataUrl = await readFileAsDataUrl(file);
        const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        const uploaded = await api.uploadMedia({
          base64,
          fileName: file.name || `evidencia-${Date.now()}.jpg`,
          contentType: file.type || 'image/jpeg',
        });
        mediaUrls.push(uploaded.url);
      }

      const description = [
        `Tipo: ${issueType}`,
        notes.trim() ? `Observações: ${notes.trim()}` : null,
      ].filter(Boolean).join('\n');

      await api.reportProblem({
        orderId: context.orderId,
        orderItemId: context.orderItemId,
        mediaUrls,
        description,
      });

      onReported();
      reset();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Falha ao enviar reporte');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Reportar problema" size="lg">
      <div className="space-y-6">
        <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4">
          <div className="text-xs font-bold uppercase tracking-widest text-neutral-500">Fornecedor</div>
          <div className="text-sm font-black uppercase tracking-tight mt-1">{supplierName || 'Fornecedor'}</div>
        </div>

        {error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800 font-medium">{error}</div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-neutral-600 mb-2">Tipo</label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all"
            >
              <option value="">Selecione</option>
              <option value="Produto ausente">Produto ausente</option>
              <option value="Produto divergente">Produto divergente</option>
              <option value="Fornecedor fechado">Fornecedor fechado</option>
              <option value="Avaria">Avaria</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-neutral-600 mb-2">Evidência</label>
            <div className="flex items-center gap-3">
              <label className="flex-1 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => onPickFiles(e.target.files)}
                  disabled={isLoading}
                />
                <div className="w-full px-4 py-3 bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest inline-flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all">
                  <Camera className="w-4 h-4" />
                  Abrir câmera
                </div>
              </label>

              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onPickFiles(e.target.files)}
                  disabled={isLoading}
                />
                <div className="px-4 py-3 bg-neutral-100 text-neutral-800 rounded-xl text-xs font-black uppercase tracking-widest inline-flex items-center justify-center gap-2 hover:bg-neutral-200 transition-all">
                  <UploadCloud className="w-4 h-4" />
                  Enviar
                </div>
              </label>

              <button
                type="button"
                onClick={removeEvidence}
                disabled={isLoading || files.length === 0}
                className="px-4 py-3 bg-neutral-100 text-neutral-800 rounded-xl text-xs font-black uppercase tracking-widest inline-flex items-center justify-center gap-2 hover:bg-neutral-200 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {previews.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {previews.map((src, idx) => (
              <div key={idx} className="aspect-[4/5] rounded-2xl overflow-hidden bg-neutral-100">
                <img src={src} alt="Evidência" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-neutral-500">Adicione até 3 imagens como evidência.</div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-neutral-600 mb-2">Observações</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Descreva o que aconteceu (opcional)"
            className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black transition-all"
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="px-5 py-3 rounded-xl bg-neutral-100 text-neutral-800 text-xs font-black uppercase tracking-widest hover:bg-neutral-200 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-5 py-3 rounded-xl bg-red-600 text-white text-xs font-black uppercase tracking-widest hover:bg-red-700 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Enviando...' : 'Enviar reporte'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
