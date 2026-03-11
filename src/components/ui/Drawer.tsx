import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  side?: 'left' | 'right';
  width?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  side = 'right',
  width = 'w-full md:w-[400px]'
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sideClasses = side === 'right' ? 'right-0' : 'left-0';

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity animate-in fade-in duration-500"
        onClick={onClose}
      />
      <div role="dialog" aria-modal="true" className={`fixed top-0 ${sideClasses} h-full ${width} bg-paper z-[70] shadow-2xl flex flex-col animate-in slide-in-from-${side} duration-500`}>
        {title && (
          <div className="flex items-center justify-between p-6 md:p-8 border-b border-gray-100">
            <h2 className="text-xl font-light font-serif tracking-widest uppercase">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {children}
        </div>
      </div>
    </>
  );
};

