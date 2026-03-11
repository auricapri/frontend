/// Presentation Section
/// Expandable product presentation content

import React from 'react';
import DOMPurify from 'dompurify';
import { Plus, Minus } from 'lucide-react';

interface PresentationSectionProps {
  content: string;
  isExpanded: boolean;
  onToggle: () => void;
}

export function PresentationSection({
  content,
  isExpanded,
  onToggle,
}: PresentationSectionProps) {
  if (!content) return null;

  return (
    <div className="w-full bg-paper border-t border-neutral-100 py-16 md:py-24 px-8 md:px-24">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={onToggle}
          className="w-full flex justify-between items-center mb-8 md:mb-12 group"
        >
          <div className="flex flex-col items-start">
            <h2 className="text-2xl md:text-4xl font-light font-serif tracking-tight uppercase">
              Conheça o Produto
            </h2>
            <p className="text-[10px] text-neutral-400 tracking-[0.2em] uppercase font-bold mt-1">
              Detalhes, fotos e vídeos exclusivos
            </p>
          </div>
          <span className="flex items-center gap-2 text-sm text-neutral-500 group-hover:text-black transition-colors">
            <span className="text-[10px] uppercase font-bold tracking-widest hidden md:inline">
              {isExpanded ? 'Recolher' : 'Expandir'}
            </span>
            <div className="p-3 bg-paper rounded-full shadow-sm group-hover:shadow-md transition-all">
              {isExpanded ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
          </span>
        </button>

        <div
          className={`overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isExpanded ? 'max-h-none opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div
            className="prose prose-lg max-w-none prose-headings:font-light prose-headings:tracking-tight prose-headings:uppercase prose-p:text-neutral-600 prose-p:leading-relaxed prose-img:rounded-2xl prose-img:shadow-lg prose-a:text-black prose-a:font-bold prose-strong:text-black"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
          />
        </div>
      </div>
    </div>
  );
}
