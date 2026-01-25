import { useCallback, useState } from 'react';

export interface Toast {
  message: string;
  visible: boolean;
  type?: 'info' | 'error';
}

export function useToast() {
  const [toast, setToast] = useState<Toast>({
    message: '',
    visible: false,
  });

  const showToast = useCallback((message: string, type: 'info' | 'error' = 'info') => {
    setToast({ message, visible: true, type });
  }, []);

  const closeToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  return {
    toast,
    showToast,
    closeToast,
  };
}
