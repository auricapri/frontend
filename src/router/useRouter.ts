import { useState, useCallback, useRef } from 'react';
import { View } from './routes';

export const useRouter = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const mainRef = useRef<HTMLElement>(null);

  const navigate = useCallback((view: View, targetSection?: string) => {
    setCurrentView(view);
    
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }

    if (view === 'home' && targetSection) {
      setTimeout(() => {
        const el = document.getElementById(targetSection);
        if (el && mainRef.current) {
          mainRef.current.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
        }
      }, 100);
    }
  }, []);

  return {
    currentView,
    navigate,
    mainRef
  };
};

