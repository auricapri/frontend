/**
 * AiAssistButton - Reusable AI generation button with modal
 */

import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Loader2, X, Check, RefreshCw, Wand2, Copy, ArrowRight } from 'lucide-react';
import { useAiPersonal } from '../../../hooks/useAiPersonal';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Prompt Builder
// ============================================================================

function buildPrompt(template: string, context: Record<string, unknown>, systemInstruction?: string): string {
  let prompt = template;

  // Replace {{field}} placeholders
  for (const [key, value] of Object.entries(context)) {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    const strValue = typeof value === 'string' ? value : JSON.stringify(value);
    prompt = prompt.replace(placeholder, strValue);
  }

  // Add system instruction if provided
  if (systemInstruction) {
    prompt = `${systemInstruction}\n\n${prompt}`;
  }

  return prompt;
}

// ============================================================================
// Modal Component
// ============================================================================

interface AiGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptTemplate: string;
  context: Record<string, unknown>;
  systemInstruction?: string;
  onAccept: (content: string) => void;
}

const AiGenerateModal: React.FC<AiGenerateModalProps> = ({
  isOpen,
  onClose,
  promptTemplate,
  context,
  systemInstruction,
  onAccept,
}) => {
  const [customPrompt, setCustomPrompt] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const {
    text,
    isGenerating,
    currentStatus,
    error,
    generate,
    abort,
    clear,
    refine,
  } = useAiPersonal({
    onError: (err) => console.error('AI Error:', err),
  });

  // Status display mapping
  const statusDisplay: Record<string, string> = {
    thinking: 'Pensando...',
    searching: 'Pesquisando...',
    analyzing_image: 'Analisando imagem...',
    tool_call: 'Usando ferramenta...',
    tool_executing: 'Executando...',
    image_gen: 'Gerando imagem...',
  };

  const handleGenerate = useCallback(async () => {
    const prompt = customPrompt || buildPrompt(promptTemplate, context, systemInstruction);
    await generate(prompt);
  }, [customPrompt, promptTemplate, context, systemInstruction, generate]);

  const handleRefine = useCallback(async () => {
    const basePrompt = customPrompt || promptTemplate;
    const contextStr = Object.entries(context || {})
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
    const refined = await refine(basePrompt, contextStr);
    const safeSuggestions = Array.isArray(refined) ? refined : [];
    setSuggestions(safeSuggestions);
    setShowSuggestions(safeSuggestions.length > 0);
  }, [customPrompt, promptTemplate, context, refine]);

  const handleAccept = useCallback(() => {
    onAccept(text);
    onClose();
    clear();
    setCustomPrompt('');
    setSuggestions([]);
    setShowSuggestions(false);
  }, [text, onAccept, onClose, clear]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
  }, [text]);

  const handleSelectSuggestion = useCallback((suggestion: string) => {
    setCustomPrompt(suggestion);
    setShowSuggestions(false);
  }, []);

  const handleClose = useCallback(() => {
    if (isGenerating) abort();
    onClose();
    clear();
    setCustomPrompt('');
    setSuggestions([]);
    setShowSuggestions(false);
  }, [isGenerating, abort, onClose, clear]);

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop - semi-transparent, click to close */}
      <div
        className="fixed inset-0 bg-black/50 z-[9998] animate-in fade-in duration-200"
        onClick={handleClose}
      />
      {/* Side Drawer - right side */}
      <div className="fixed top-0 right-0 bottom-0 z-[9999] w-full max-w-md animate-in slide-in-from-right duration-300 overflow-hidden">
        <div className="h-full bg-white shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-100 bg-gradient-to-r from-violet-50 to-indigo-50">
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
              className="p-2 bg-white/80 rounded-full hover:bg-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3 overflow-y-auto flex-1">
            {/* Custom Prompt Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                Prompt (opcional)
              </label>
              <div className="relative">
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder={promptTemplate.slice(0, 100) + '...'}
                  className="w-full p-3 pr-12 bg-neutral-50 border border-neutral-200 rounded-xl text-xs resize-none focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all"
                  rows={2}
                  disabled={isGenerating}
                />
                <button
                  onClick={handleRefine}
                  disabled={isGenerating}
                  className="absolute right-2 top-2 p-1.5 bg-white border border-neutral-200 rounded-lg hover:bg-violet-50 hover:border-violet-300 transition-all disabled:opacity-50"
                  title="Refinar prompt"
                >
                  <Wand2 className="w-3 h-3 text-violet-500" />
                </button>
              </div>
            </div>

            {/* Suggestions */}
            {showSuggestions && suggestions && suggestions.length > 0 && (
              <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 space-y-2 animate-in slide-in-from-top-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600">
                  Sugestões
                </p>
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className="w-full text-left p-2 bg-white rounded-lg text-xs hover:bg-violet-100 transition-all flex items-center gap-2 group"
                  >
                    <ArrowRight className="w-3 h-3 text-violet-400 group-hover:text-violet-600 transition-colors flex-shrink-0" />
                    <span className="line-clamp-2">{suggestion}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:from-violet-700 hover:to-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-violet-200"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {currentStatus ? statusDisplay[currentStatus] || currentStatus : 'Gerando...'}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Gerar
                </>
              )}
            </button>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">
                {error}
              </div>
            )}

            {/* Generated Content */}
            {text && (
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                    Resultado
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleCopy}
                      className="p-1.5 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-all"
                      title="Copiar"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="p-1.5 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-all disabled:opacity-50"
                      title="Regenerar"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl max-h-[40vh] overflow-y-auto">
                  <div className="prose prose-sm max-w-none text-xs whitespace-pre-wrap">
                    {text}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {text && (
            <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex items-center justify-end gap-2 flex-shrink-0">
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-white border border-neutral-200 rounded-lg font-bold text-xs hover:bg-neutral-100 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleAccept}
                className="px-4 py-2 bg-black text-white rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-neutral-800 transition-all"
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

// ============================================================================
// Main Component
// ============================================================================

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

      <AiGenerateModal
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
