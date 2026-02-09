/**
 * Reusable Order Column Component
 */
import React from 'react';
import type { OrderColumnProps } from './types';

export const OrderColumn: React.FC<OrderColumnProps> = ({
  title,
  icon,
  iconBgClass,
  count,
  children,
  opacity = false,
}) => {
  return (
    <div
      className={`flex-1 flex flex-col bg-white rounded-[2.5rem] border border-neutral-100 p-2 shadow-sm ${
        opacity ? 'opacity-80' : ''
      }`}
    >
      <header className="flex items-center justify-between mb-4 p-6 pb-2">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${iconBgClass}`}>{icon}</div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">
            {title}
          </h4>
        </div>
        <span className="text-[9px] font-bold text-neutral-300 uppercase">{count}</span>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 px-2 pb-2">
        {children}
      </div>
    </div>
  );
};
