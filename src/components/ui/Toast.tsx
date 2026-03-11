
import React, { useEffect } from 'react';
import { X, Info, AlertTriangle } from 'lucide-react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
  type?: 'info' | 'error';
}

const Toast: React.FC<ToastProps> = ({ message, isVisible, onClose, duration = 4000, type = 'info' }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[3000] animate-in fade-in slide-in-from-top-4 duration-500 w-full max-w-sm px-4">
      <div className="bg-paper/90 backdrop-blur-xl border border-neutral-200 text-neutral-900 px-6 py-5 rounded-[1.5rem] shadow-2xl flex items-start gap-4">
        <div className={`p-2 rounded-full flex-none ${type === 'error' ? 'bg-red-50 text-red-500' : 'bg-neutral-100 text-neutral-500'}`}>
           {type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
        </div>
        <div className="flex-1 pt-1">
            <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
            {message}
            </p>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded-full transition-colors -mr-2 -mt-2">
          <X className="w-4 h-4 text-neutral-400" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
