import { useEffect, useState } from 'react';

const STORAGE_KEY = 'recently_viewed_products';
const MAX_ITEMS = 10;

interface RecentProduct {
  id: string;
  timestamp: number;
}

export function useRecentlyViewed(currentProductId?: string) {
  const [viewedIds, setViewedIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const items: RecentProduct[] = stored ? JSON.parse(stored) : [];
      // Filter out current product and return IDs
      setViewedIds(items.filter(i => i.id !== currentProductId).map(i => i.id));
    } catch {
      setViewedIds([]);
    }
  }, [currentProductId]);

  useEffect(() => {
    if (!currentProductId) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let items: RecentProduct[] = stored ? JSON.parse(stored) : [];
      // Remove if already exists
      items = items.filter(i => i.id !== currentProductId);
      // Add to front
      items.unshift({ id: currentProductId, timestamp: Date.now() });
      // Limit
      items = items.slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage errors
    }
  }, [currentProductId]);

  return viewedIds;
}
