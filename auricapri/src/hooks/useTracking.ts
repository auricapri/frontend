import { useCallback } from 'react';
import { trackingService } from '../services/tracking.service';

export function useTracking() {
  const trackEvent = useCallback(async (event: Parameters<typeof trackingService.trackEvent>[0]) => {
    await trackingService.trackEvent(event);
  }, []);

  return { trackEvent };
}

