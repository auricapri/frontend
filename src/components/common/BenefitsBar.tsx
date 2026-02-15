import React, { useState, useEffect } from 'react';

const messages = [
  'FRETE GRATIS ACIMA DE R$299',
  'TROCA GRATIS EM ATE 30 DIAS',
  'PARCELE EM ATE 6X SEM JUROS'
];

export function BenefitsBar() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-8 bg-black flex items-center justify-center z-50 relative">
      <p className="text-white text-[9px] uppercase tracking-wider font-medium transition-opacity duration-500">
        {messages[currentIndex]}
      </p>
    </div>
  );
}
