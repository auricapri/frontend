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
      {/* Logo com animação skeleton pulse */}
      <div className={`${sizeClasses[size]} relative`}>
        <style>
          {`
            @keyframes skeleton-pulse {
              0%, 100% {
                opacity: 1;
              }
              50% {
                opacity: 0.4;
              }
            }

            @keyframes shimmer {
              0% {
                transform: translateX(-100%);
              }
              100% {
                transform: translateX(100%);
              }
            }

            .skeleton-pulse {
              animation: skeleton-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }

            .shimmer {
              animation: shimmer 2s linear infinite;
            }
          `}
        </style>

        <svg
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full skeleton-pulse"
        >
          <defs>
            <linearGradient id="shimmer-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(0,0,0,0)" />
              <stop offset="50%" stopColor="rgba(0,0,0,0.1)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </linearGradient>
          </defs>

          {/* Logo "A" */}
          <text
            x="50"
            y="55"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-neutral-900"
            style={{
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
              fontSize: '48px',
              fontWeight: '300',
              letterSpacing: '0.1em'
            }}
          >
            A
          </text>

          {/* Shimmer overlay effect */}
          <rect
            x="-100"
            y="0"
            width="100"
            height="100"
            fill="url(#shimmer-gradient)"
            className="shimmer"
          />
        </svg>
      </div>

      {message && (
        <p className="mt-8 text-xs text-neutral-500 font-light tracking-[0.15em] uppercase skeleton-pulse">
          {message}
        </p>
      )}
    </div>
  );
};
