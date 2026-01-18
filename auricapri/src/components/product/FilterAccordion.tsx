import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface FilterAccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  count?: number;
}

export const FilterAccordion: React.FC<FilterAccordionProps> = ({
  title,
  children,
  defaultOpen = false,
  count
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [children]);

  return (
    <div className="border-b border-neutral-200 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 text-left group"
        aria-expanded={isOpen}
      >
        <span className="text-[13px] font-semibold uppercase tracking-[0.08em] text-neutral-800 group-active:text-neutral-600 transition-colors">
          {title}
          {count !== undefined && count > 0 && (
            <span className="ml-2 text-[11px] font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
              {count}
            </span>
          )}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-neutral-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-200 ease-out"
        style={{
          maxHeight: isOpen ? `${contentHeight}px` : '0px',
          opacity: isOpen ? 1 : 0
        }}
      >
        <div className="pb-5">
          {children}
        </div>
      </div>
    </div>
  );
};
