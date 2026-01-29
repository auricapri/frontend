import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message
}) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  const containerSizeClasses = {
    sm: 'min-h-[150px]',
    md: 'min-h-[200px]',
    lg: 'min-h-[300px]'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${containerSizeClasses[size]} p-8`}>
      <style>
        {`
          @keyframes logo-pulse {
            0%, 100% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.5;
              transform: scale(0.95);
            }
          }
          .logo-pulse {
            animation: logo-pulse 1.5s ease-in-out infinite;
          }
        `}
      </style>

      <img
        src="/logo-auricapri.svg"
        alt="Carregando..."
        className={`${sizeClasses[size]} logo-pulse`}
      />

      {message && (
        <p className="mt-8 text-xs text-neutral-500 font-light tracking-[0.15em] uppercase">
          {message}
        </p>
      )}
    </div>
  );
};
