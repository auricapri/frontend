import { useEffect, useCallback } from 'react';
import { notificationService } from '../services/notification.service';

/**
 * Hook to replace showToast functionality
 * Sends push notifications instead of showing toasts
 */
export const useNotifications = (userId?: string) => {
  useEffect(() => {
    // Setup listeners only - don't request permission automatically
    // Permission should be requested on user interaction (e.g., button click)
    const cleanup = notificationService.setupListeners((notification) => {
      // Handle notification received
      console.log('Notification received:', notification);
    });

    return () => {
      cleanup();
    };
  }, [userId]);

  /**
   * Show notification (replaces showToast)
   */
  const showNotification = useCallback(
    async (message: string, type: 'info' | 'error' = 'info') => {
      await notificationService.sendNotification(message, type);
    },
    []
  );

  return {
    showNotification,
  };
};

