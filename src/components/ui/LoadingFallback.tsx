import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface LoadingFallbackProps {
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  message,
  className = '',
  size = 'md'
}) => {
  return (
    <div className={`flex flex-col items-center justify-center min-h-screen ${className}`}>
      <LoadingSpinner size={size} message={message} />
    </div>
  );
};
