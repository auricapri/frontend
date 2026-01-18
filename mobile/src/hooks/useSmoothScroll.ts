/**
 * Hook for smooth scrolling in React Native
 * Implements smooth scroll behavior similar to CSS scroll-behavior: smooth
 */

import { useCallback } from 'react';
import { ScrollView } from 'react-native';

interface SmoothScrollOptions {
  offset?: number; // Offset from top (e.g., for navbar)
}

export const useSmoothScroll = (scrollViewRef: React.RefObject<ScrollView>) => {
  const smoothScrollTo = useCallback((
    y: number, 
    options: SmoothScrollOptions = {}
  ) => {
    const { offset = 0 } = options;
    const targetY = Math.max(0, y - offset);

    if (!scrollViewRef.current) return;

    // Use animated scroll for smooth behavior
    scrollViewRef.current.scrollTo({
      y: targetY,
      animated: true,
    });
  }, [scrollViewRef]);

  const scrollToTop = useCallback((instant = false) => {
    if (!scrollViewRef.current) return;
    
    scrollViewRef.current.scrollTo({ 
      y: 0, 
      animated: !instant 
    });
  }, [scrollViewRef]);

  return {
    smoothScrollTo,
    scrollToTop,
  };
};

