/**
 * AiAssistButton - AI generation button with auto-generate modal
 * Opens modal and immediately starts generating - no typing required
 */

import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Loader2, X, Check, RefreshCw, Copy } from 'lucide-react';
import { useAiPersonal } from '../../../hooks/useAiPersonal';

export interface AiAssistButtonProps {
  /** Label for the button */
  label?: string;
  /** Prompt template - use {{field}} for context variables */
  promptTemplate: string;
  /** Context data to inject into prompt */
  context?: Record<string, unknown>;
  /** Callback when user accepts generated content */
  onAccept: (content: string) => void;
  /** Custom system instruction */
  systemInstruction?: string;
  /** Button variant */
  variant?: 'default' | 'small' | 'icon';
  /** Disabled state */
  disabled?: boolean;
  /** Class name override */
  className?: string;
}

// Status display mapping
const statusDisplay: Record<string, string> = {
  thinking: 'Pensando...',
  searching: 'Pesquisando...',
  analyzing_image: 'Analisando...',
  tool_call: 'Processando...',
  tool_executing: 'Executando...',
};

function buildPrompt(template: string, context: Record<string, unknown>, systemInstruction?: string): string {
  let prompt = template;

  for (const [key, value] of Object.entries(context || {})) {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    const strValue = typeof value === 'string' ? value : JSON.stringify(value || '');
    prompt = prompt.replace(placeholder, strValue);
  }

  if (systemInstruction) {
    prompt = `${systemInstruction}\n\n${prompt}`;
  }

  return prompt;
}

// Modal Component
interface AiModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptTemplate: string;
  context: Record<string, unknown>;
  systemInstruction?: string;
  onAccept: (content: string) => void;
}

const AiModal: React.FC<AiModalProps> = ({
  isOpen,
  onClose,
  promptTemplate,
  context,
  systemInstruction,
  onAccept,
}) => {
  const {
    text,
    isGenerating,
    currentStatus,
    error,
    generate,
    abort,
    clear,
  } = useAiPersonal();

  // Auto-generate when modal opens
  useEffect(() => {
    if (isOpen && !text && !isGenerating) {
      const prompt = buildPrompt(promptTemplate, context, systemInstruction);
      generate(prompt);
    }
  }, [isOpen]);

  const handleRegenerate = useCallback(() => {
    clear();
    const prompt = buildPrompt(promptTemplate, context, systemInstruction);
    generate(prompt);
  }, [promptTemplate, context, systemInstruction, generate, clear]);

  const handleAccept = useCallback(() => {
    onAccept(text);
    onClose();
    clear();
  }, [text, onAccept, onClose, clear]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
  }, [text]);

  const handleClose = useCallback(() => {
    if (isGenerating) abort();
    onClose();
    clear();
  }, [isGenerating, abort, onClose, clear]);

  if (!isOpen) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/50 z-[9998]"
        onClick={handleClose}
      />
      <div className="fixed top-0 right-0 bottom-0 z-[9999] w-full max-w-md">
        <div className="h-full bg-paper shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-violet-50 to-indigo-50 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-xl">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-sm font-black uppercase tracking-tight">
                Assistente IA
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 bg-white/80 rounded-full hover:bg-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Loading State */}
            {isGenerating && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500 mb-4" />
                <span className="text-sm font-bold text-violet-600">
                  {currentStatus ? statusDisplay[currentStatus] || 'Gerando...' : 'Gerando...'}
                </span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm mb-4">
                {error}
                <button
                  onClick={handleRegenerate}
                  className="mt-2 w-full py-2 bg-red-100 rounded-lg text-xs font-bold hover:bg-red-200"
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {/* Generated Content */}
            {text && !isGenerating && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                    Resultado
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleCopy}
                      className="p-1.5 bg-neutral-100 rounded-lg hover:bg-neutral-200"
                      title="Copiar"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={handleRegenerate}
                      className="p-1.5 bg-neutral-100 rounded-lg hover:bg-neutral-200"
                      title="Regenerar"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="p-4 bg-neutral-50 border rounded-xl">
                  <div className="prose prose-sm max-w-none text-sm whitespace-pre-wrap">
                    {text}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {text && !isGenerating && (
            <div className="p-4 border-t bg-neutral-50 flex items-center justify-end gap-2 flex-shrink-0">
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-white border rounded-lg font-bold text-xs hover:bg-neutral-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleAccept}
                className="px-4 py-2 bg-black text-white rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-neutral-800"
              >
                <Check className="w-3 h-3" />
                Usar
              </button>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
};

// Main Button Component
export const AiAssistButton: React.FC<AiAssistButtonProps> = ({
  label = 'Gerar com IA',
  promptTemplate,
  context = {},
  onAccept,
  systemInstruction,
  variant = 'default',
  disabled = false,
  className = '',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const baseClasses = {
    default: 'px-4 py-2 bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:from-violet-600 hover:to-indigo-600 transition-all shadow-lg shadow-violet-200/50 disabled:opacity-50',
    small: 'px-3 py-1.5 bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 hover:from-violet-600 hover:to-indigo-600 transition-all shadow-md shadow-violet-200/50 disabled:opacity-50',
    icon: 'p-2 bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-lg hover:from-violet-600 hover:to-indigo-600 transition-all shadow-md shadow-violet-200/50 disabled:opacity-50',
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        disabled={disabled}
        className={`${baseClasses[variant]} ${className}`}
        title={variant === 'icon' ? label : undefined}
      >
        <Sparkles className={variant === 'icon' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
        {variant !== 'icon' && label}
      </button>

      <AiModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        promptTemplate={promptTemplate}
        context={context}
        systemInstruction={systemInstruction}
        onAccept={onAccept}
      />
    </>
  );
};

export default AiAssistButton;
