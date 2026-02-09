/// Product Accordions
/// Description and composition expandable sections

import React from 'react';
import { Plus, Minus } from 'lucide-react';

interface AccordionSection {
  id: string;
  label: string;
  content: string;
}

interface ProductAccordionsProps {
  sections: AccordionSection[];
  openSection: string | null;
  onToggleSection: (id: string | null) => void;
}

export function ProductAccordions({
  sections,
  openSection,
  onToggleSection,
}: ProductAccordionsProps) {
  return (
    <div className="pt-6 border-t border-neutral-100 mt-6">
      <div className="space-y-2">
        {sections.map(section => (
          <div key={section.id} className="border-b border-neutral-50 last:border-0">
            <button
              onClick={() => onToggleSection(openSection === section.id ? null : section.id)}
              className="w-full flex justify-between items-center py-5 text-[11px] font-black uppercase tracking-[0.3em] hover:opacity-60 transition-opacity"
            >
              {section.label}
              {openSection === section.id ? (
                <Minus className="w-4 h-4 text-neutral-400" />
              ) : (
                <Plus className="w-4 h-4 text-neutral-400" />
              )}
            </button>
            <div
              className={`overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                openSection === section.id ? 'max-h-[500px] opacity-100 pb-6' : 'max-h-0 opacity-0'
              }`}
            >
              <div
                className="prose prose-sm max-w-sm text-neutral-500 prose-p:text-[12px] prose-p:leading-relaxed prose-p:font-medium prose-headings:text-neutral-700 prose-headings:text-sm prose-strong:text-neutral-700"
                dangerouslySetInnerHTML={{ __html: section.content }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
