import React, { useId } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  id,
  ...props
}) => {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={inputId} className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full p-5 bg-neutral-50 border ${
          error ? 'border-red-200 bg-red-50/20' : 'border-neutral-100'
        } rounded-2xl outline-none focus:bg-paper focus:border-black transition-all ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

