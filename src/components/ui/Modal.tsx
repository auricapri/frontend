import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md'
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

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[200] animate-in fade-in duration-500"
        onClick={onClose}
      />
      <div role="dialog" aria-modal="true" className="fixed inset-0 z-[201] flex items-start md:items-center justify-center p-4 md:p-12 overflow-y-auto">
        <div
          className={`bg-paper w-full ${
            sizeClasses[size]
          } rounded-[3rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-500 max-h-[calc(100vh-2rem)] md:max-h-[calc(100vh-6rem)] flex flex-col`}
        >
          {title && (
            <div className="flex items-center justify-between p-6 md:p-8 border-b border-neutral-100">
              <h2 className="text-2xl font-black font-serif uppercase italic tracking-tighter leading-none">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-4 bg-neutral-50 rounded-full hover:bg-neutral-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          <div className="p-6 md:p-8 overflow-y-auto min-h-0">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};
