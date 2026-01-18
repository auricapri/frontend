/**
 * Hook for animated entry animations (fade-in, slide-in)
 * Mimics Tailwind's animate-in classes
 */

import { useEffect, useRef } from 'react';
import { Animated, Platform } from 'react-native';

interface UseAnimatedEntryOptions {
  delay?: number;
  duration?: number;
  offsetY?: number; // For slide-in-from-bottom
}

export const useAnimatedEntry = (options: UseAnimatedEntryOptions = {}) => {
  const { delay = 0, duration = 700, offsetY = 16 } = options;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(offsetY)).current;
  const useNativeDriver = Platform.OS !== 'web';

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration,
          useNativeDriver,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration,
          useNativeDriver,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, duration, opacity, translateY, useNativeDriver]);

  return {
    opacity,
    transform: [{ translateY }],
  };
};

