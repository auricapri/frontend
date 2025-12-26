import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-[8px] font-black uppercase tracking-widest text-neutral-400">
          {label}
        </label>
      )}
      <input
        className={`w-full p-5 bg-neutral-50 border ${
          error ? 'border-red-200 bg-red-50/20' : 'border-neutral-100'
        } rounded-2xl outline-none focus:bg-white focus:border-black transition-all ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
};

