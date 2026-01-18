import { useState, useEffect, useCallback, useMemo } from 'react';
import { hotspotsApi } from '../api/hotspots.api';
import { ProductImageHotspot } from '../types';

interface UseImageHotspotsOptions {
  enabled?: boolean;
}

interface UseImageHotspotsReturn {
  hotspots: ProductImageHotspot[];
  hotspotsByImage: Record<string, ProductImageHotspot[]>;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to load and manage product image hotspots
 * Groups hotspots by image URL for easy access
 */
export function useImageHotspots(
  productId: string | undefined,
  options: UseImageHotspotsOptions = {}
): UseImageHotspotsReturn {
  const { enabled = true } = options;

  const [hotspots, setHotspots] = useState<ProductImageHotspot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchHotspots = useCallback(async () => {
    if (!productId || !enabled) {
      setHotspots([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await hotspotsApi.getByProductId(productId);
      setHotspots(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load hotspots'));
      setHotspots([]);
    } finally {
      setIsLoading(false);
    }
  }, [productId, enabled]);

  useEffect(() => {
    fetchHotspots();
  }, [fetchHotspots]);

  // Group hotspots by image URL
  const hotspotsByImage = useMemo(() => {
    return hotspots.reduce((acc, hotspot) => {
      const key = hotspot.image_url;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(hotspot);
      return acc;
    }, {} as Record<string, ProductImageHotspot[]>);
  }, [hotspots]);

  return {
    hotspots,
    hotspotsByImage,
    isLoading,
    error,
    refetch: fetchHotspots
  };
}

/**
 * Hook for admin to load all hotspots (including inactive)
 */
export function useAdminImageHotspots(productId: string | undefined): UseImageHotspotsReturn {
  const [hotspots, setHotspots] = useState<ProductImageHotspot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchHotspots = useCallback(async () => {
    if (!productId) {
      setHotspots([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await hotspotsApi.getAllByProductIdAdmin(productId);
      setHotspots(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load hotspots'));
      setHotspots([]);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchHotspots();
  }, [fetchHotspots]);

  // Group hotspots by image URL
  const hotspotsByImage = useMemo(() => {
    return hotspots.reduce((acc, hotspot) => {
      const key = hotspot.image_url;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(hotspot);
      return acc;
    }, {} as Record<string, ProductImageHotspot[]>);
  }, [hotspots]);

  return {
    hotspots,
    hotspotsByImage,
    isLoading,
    error,
    refetch: fetchHotspots
  };
}
