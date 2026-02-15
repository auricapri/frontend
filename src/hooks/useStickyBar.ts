/**
 * useStickyBar Hook
 * Detects scroll position to show/hide sticky bottom bar
 * Works with both custom scroll containers and window scroll
 */

import { useState, useEffect, useCallback } from 'react';

export interface UseStickyBarProps {
  /** Scroll threshold in pixels to show the bar (default: 200) */
  threshold?: number;
  /** ID of custom scroll container (default: 'main-content') */
  containerId?: string;
  /** Whether the hook is enabled (default: true) */
  enabled?: boolean;
}

/**
 * Hook for detecting scroll position to control sticky bar visibility
 *
 * @param props - Configuration options
 * @returns Whether the sticky bar should be visible
 *
 * @example
 * const showStickyBar = useStickyBar({ threshold: 200 });
 *
 * @example
 * // With custom container
 * const showStickyBar = useStickyBar({
 *   threshold: 300,
 *   containerId: 'my-scroll-container',
 * });
 */
export function useStickyBar({
  threshold = 200,
  containerId = 'main-content',
  enabled = true,
}: UseStickyBarProps = {}): boolean {
  const [showStickyBar, setShowStickyBar] = useState(false);

  const handleScroll = useCallback(() => {
    // Get scroll container
    const scrollContainer = document.getElementById(containerId);

    // Get scroll position from container or window as fallback
    const scrollY = scrollContainer?.scrollTop || window.scrollY || window.pageYOffset || 0;

    // Show bar when scrolled past threshold
    setShowStickyBar(scrollY > threshold);
  }, [containerId, threshold]);

  useEffect(() => {
    if (!enabled) {
      setShowStickyBar(false);
      return;
    }

    const scrollContainer = document.getElementById(containerId);

    // Check initial scroll position
    handleScroll();

    // Listen to scroll on the container
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    }

    // Also listen to window scroll as fallback
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, [containerId, enabled, handleScroll]);

  return showStickyBar;
}
