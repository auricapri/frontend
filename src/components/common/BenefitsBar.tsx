import React from 'react';

const MESSAGE = 'FRETE GRÁTIS ACIMA DE R$299  ·  TROCA GRÁTIS EM ATÉ 30 DIAS  ·  PARCELE EM ATÉ 6X SEM JUROS  ·  ';

export function BenefitsBar() {
  return (
    <div className="fixed top-0 left-0 w-full h-8 bg-black z-[51] overflow-hidden flex items-center">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      <div
        className="whitespace-nowrap flex items-center"
        style={{ animation: 'marquee 25s linear infinite' }}
      >
        <span className="text-white text-[10px] uppercase tracking-wider font-medium px-4">
          {MESSAGE}
        </span>
        <span className="text-white text-[10px] uppercase tracking-wider font-medium px-4">
          {MESSAGE}
        </span>
      </div>
    </div>
  );
}
