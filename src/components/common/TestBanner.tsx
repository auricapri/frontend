import React from 'react';

export const TestBanner: React.FC = () => {
  return (
    <div className="fixed top-0 left-0 w-full h-12 bg-red-600 text-white z-[100] flex items-center justify-center px-4">
      <p className="text-xs md:text-sm font-black uppercase tracking-widest">
        PROJETO EM TESTE - SERÁ LIBERADO EM BREVE
      </p>
    </div>
  );
};

