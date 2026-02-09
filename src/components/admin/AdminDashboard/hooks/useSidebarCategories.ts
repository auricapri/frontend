/// Sidebar Categories Hook
/// Manages expanded/collapsed state of sidebar categories

import { useState, useCallback } from 'react';

export const useSidebarCategories = (initialExpanded: string[] = ['principal', 'produtos', 'vendas', 'sistema']) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(initialExpanded)
  );

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const isExpanded = useCallback((category: string) => {
    return expandedCategories.has(category);
  }, [expandedCategories]);

  return {
    expandedCategories,
    toggleCategory,
    isExpanded,
  };
};
