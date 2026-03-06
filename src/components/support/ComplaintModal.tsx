import React, { useState, useCallback, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { supportApi } from '../../api/instances';
import { Paperclip, X, FileText, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface ComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FormState = 'idle' | 'submitting' | 'success' | 'error';

const CATEGORIES = [
  { value: 'order', label: 'Pedido' },
  { value: 'product', label: 'Produto' },
  { value: 'shipping', label: 'Envio' },
  { value: 'payment', label: 'Pagamento' },
  { value: 'other', label: 'Outro' },
] as const;

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf'];
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 3;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(name: string): string {
  return name.slice(name.lastIndexOf('.')).toLowerCase();
}

const ComplaintModal: React.FC<ComplaintModalProps> = ({ isOpen, onClose }) => {
  const [formState, setFormState] = useState<FormState>('idle');
  const [category, setCategory] = useState('');
  const [orderId, setOrderId] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [ticketId, setTicketId] = useState('');
  const [serverError, setServerError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = useCallback(() => {
    setFormState('idle');
    setCategory('');
    setOrderId('');
    setSubject('');
    setDescription('');
    setFiles([]);
    setErrors({});
    setTicketId('');
    setServerError('');
    // Revoke object URLs
    Object.values(filePreviews).forEach(URL.revokeObjectURL);
    setFilePreviews({});
  }, [filePreviews]);

  const handleClose = useCallback(() => {
    if (formState === 'submitting') return;
    resetForm();
    onClose();
  }, [formState, resetForm, onClose]);

  const validateFile = (file: File): string | null => {
    const ext = getFileExtension(file.name);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Tipo não permitido: ${ext}. Use JPG, PNG, WEBP, GIF ou PDF.`;
    }
    if (!ALLOWED_MIMES.includes(file.type)) {
      return `Tipo MIME não permitido: ${file.type}`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `Arquivo excede 5MB (${formatFileSize(file.size)})`;
    }
    return null;
  };

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    if (!newFiles.length) return;

    const totalFiles = files.length + newFiles.length;
    if (totalFiles > MAX_FILES) {
      setErrors(prev => ({ ...prev, files: `Máximo de ${MAX_FILES} arquivos permitidos.` }));
      return;
    }

    const validFiles: File[] = [];
    for (const file of newFiles) {
      const error = validateFile(file);
      if (error) {
        setErrors(prev => ({ ...prev, files: error }));
        return;
      }
      validFiles.push(file);
    }

    // Generate previews for images
    const newPreviews: Record<string, string> = {};
    for (const file of validFiles) {
      if (file.type.startsWith('image/')) {
        newPreviews[file.name + file.size] = URL.createObjectURL(file);
      }
    }

    setFiles(prev => [...prev, ...validFiles]);
    setFilePreviews(prev => ({ ...prev, ...newPreviews }));
    setErrors(prev => {
      const { files: _, ...rest } = prev;
      return rest;
    });

    // Reset input so the same file can be re-added if removed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileRemove = (index: number) => {
    const file = files[index];
    const key = file.name + file.size;
    if (filePreviews[key]) {
      URL.revokeObjectURL(filePreviews[key]);
      setFilePreviews(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!category) newErrors.category = 'Selecione uma categoria.';
    if (subject.length < 5) newErrors.subject = 'Assunto deve ter pelo menos 5 caracteres.';
    if (subject.length > 200) newErrors.subject = 'Assunto deve ter no máximo 200 caracteres.';
    if (description.length < 20) newErrors.description = 'Descrição deve ter pelo menos 20 caracteres.';
    if (description.length > 5000) newErrors.description = 'Descrição deve ter no máximo 5000 caracteres.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setFormState('submitting');
    setServerError('');

    try {
      const result = await supportApi.createTicket(
        {
          subject,
          description,
          category,
          order_id: orderId || undefined,
        },
        files.length > 0 ? files : undefined
      );
      setTicketId(result.id);
      setFormState('success');
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Erro desconhecido');
      setFormState('error');
    }
  };

  // ─── Success screen ───────────────────────────────────────────────
  if (formState === 'success') {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Reclamação" size="lg">
        <div className="flex flex-col items-center text-center py-8 space-y-6">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-neutral-900">Reclamação enviada com sucesso!</h3>
            <div className="bg-neutral-50 rounded-2xl p-4 inline-block">
              <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-widest mb-1">Protocolo</p>
              <p className="text-xl font-black tracking-wider text-neutral-900">#{ticketId.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-neutral-600">Responderemos em até <strong>24 horas úteis</strong>.</p>
            <p className="text-sm text-neutral-500">Você receberá uma confirmação por email.</p>
          </div>
          <button
            onClick={handleClose}
            className="px-8 py-3.5 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-[2rem] hover:bg-neutral-800 transition-colors"
          >
            Fechar
          </button>
        </div>
      </Modal>
    );
  }

  // ─── Error screen ─────────────────────────────────────────────────
  if (formState === 'error') {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Reclamação" size="lg">
        <div className="flex flex-col items-center text-center py-8 space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-neutral-900">Não foi possível enviar sua reclamação</h3>
            {serverError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{serverError}</p>
            )}
          </div>
          <div className="bg-neutral-50 rounded-2xl p-6 text-left space-y-3 w-full max-w-sm">
            <p className="text-sm text-neutral-700">Por favor, entre em contato diretamente:</p>
            <a
              href="mailto:suporte@auricapri.com"
              className="flex items-center gap-2 text-sm font-bold text-black hover:underline"
            >
              suporte@auricapri.com
            </a>
            <p className="text-xs text-neutral-500">Respondemos em até 24 horas úteis</p>
            <div className="border-t border-neutral-200 pt-3 mt-3">
              <p className="text-xs text-neutral-500 mb-1">Inclua no email:</p>
              <ul className="text-xs text-neutral-600 space-y-1 list-disc pl-4">
                <li>Descrição do problema</li>
                <li>Número do pedido (se aplicável)</li>
                <li>Anexos relevantes</li>
              </ul>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setFormState('idle')}
              className="px-6 py-3 text-xs font-bold uppercase tracking-widest rounded-[2rem] border border-neutral-200 hover:bg-neutral-50 transition-colors"
            >
              Tentar Novamente
            </button>
            <button
              onClick={handleClose}
              className="px-6 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-[2rem] hover:bg-neutral-800 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  // ─── Form ─────────────────────────────────────────────────────────
  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Reclamação" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Category */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-widest">
            Categoria *
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 text-neutral-900 text-sm appearance-none"
          >
            <option value="">Selecione uma categoria</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
        </div>

        {/* Order ID (conditional) */}
        {category === 'order' && (
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-widest">
              Nº do Pedido
            </label>
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Ex: a1b2c3d4-..."
              className="w-full px-4 py-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 text-neutral-900 text-sm"
            />
          </div>
        )}

        {/* Subject */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-widest">
            Assunto *
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Descreva brevemente o problema"
            maxLength={200}
            className="w-full px-4 py-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 text-neutral-900 text-sm"
          />
          <div className="flex justify-between">
            {errors.subject && <p className="text-xs text-red-500">{errors.subject}</p>}
            <p className="text-[10px] text-neutral-400 ml-auto">{subject.length}/200</p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-widest">
            Descrição *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva o problema com detalhes (mínimo 20 caracteres)"
            maxLength={5000}
            rows={5}
            className="w-full px-4 py-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 text-neutral-900 text-sm resize-none"
          />
          <div className="flex justify-between">
            {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
            <p className="text-[10px] text-neutral-400 ml-auto">{description.length}/5000</p>
          </div>
        </div>

        {/* Attachments */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-widest">
            Anexos ({files.length}/{MAX_FILES})
          </label>

          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {files.map((file, idx) => {
                const key = file.name + file.size;
                const preview = filePreviews[key];
                return (
                  <div key={key} className="relative group bg-neutral-50 rounded-xl border border-neutral-200 p-2 flex items-center gap-2 max-w-[200px]">
                    {preview ? (
                      <img src={preview} alt={file.name} className="w-10 h-10 rounded-lg object-cover" loading="lazy" decoding="async" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-neutral-200 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-neutral-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-neutral-700 truncate">{file.name}</p>
                      <p className="text-[10px] text-neutral-400">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleFileRemove(idx)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {files.length < MAX_FILES && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-3 bg-neutral-50 rounded-2xl border border-dashed border-neutral-300 text-sm text-neutral-500 hover:bg-neutral-100 hover:border-neutral-400 transition-colors flex items-center justify-center gap-2"
            >
              <Paperclip className="w-4 h-4" />
              Anexar arquivo
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.gif,.pdf"
            multiple
            onChange={handleFileAdd}
            className="hidden"
          />
          {errors.files && <p className="text-xs text-red-500">{errors.files}</p>}
          <p className="text-[10px] text-neutral-400">JPG, PNG, WEBP, GIF ou PDF. Máx. 5MB por arquivo.</p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={formState === 'submitting'}
          className="w-full py-4 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-[2rem] hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {formState === 'submitting' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enviando...
            </>
          ) : (
            'Enviar Reclamação'
          )}
        </button>
      </form>
    </Modal>
  );
};

export default ComplaintModal;
