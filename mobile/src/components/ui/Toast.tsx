/**
 * Toast Component - React Native
 * Note: This component is kept for compatibility but notifications
 * should use push notifications via useNotifications hook instead
 */

import React from 'react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
  type?: 'info' | 'error';
}

const Toast: React.FC<ToastProps> = ({ message, isVisible, onClose, duration = 4000, type = 'info' }) => {
  // In mobile, toasts are replaced by push notifications
  // This component is kept for API compatibility but does nothing
  return null;
};

export default Toast;

