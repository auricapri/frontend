/**
 * Toolbar Button Component
 */
import React from 'react';
import type { ToolbarButtonProps } from './types';

export const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  onClick,
  isActive = false,
  disabled = false,
  children,
  title,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 rounded-lg transition-all ${
      isActive
        ? 'bg-black text-white shadow-sm'
        : disabled
        ? 'bg-neutral-50 text-neutral-300 cursor-not-allowed'
        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
    }`}
  >
    {children}
  </button>
);

export const ToolbarDivider: React.FC = () => (
  <div className="w-px h-6 bg-neutral-200 mx-1" />
);
