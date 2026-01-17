import React, { useState } from 'react';
import { Wifi } from 'lucide-react';

interface CreditCardPreviewProps {
  cardNumber: string;
  cardName: string;
  cardExpiry: string;
  cardCvc: string;
  isFlipped?: boolean;
}

// Detecta a bandeira do cartão baseado no número
function getCardBrand(number: string): { brand: string; logo: React.ReactNode; color: string } {
  const cleanNumber = number.replace(/\s/g, '');

  // Visa: começa com 4
  if (/^4/.test(cleanNumber)) {
    return {
      brand: 'visa',
      color: 'from-blue-600 to-blue-800',
      logo: (
        <svg viewBox="0 0 48 48" className="w-16 h-10">
          <path fill="#fff" d="M18.5 32.5l2.3-14h3.7l-2.3 14h-3.7zm15.9-13.6c-.7-.3-1.9-.6-3.3-.6-3.6 0-6.2 1.9-6.2 4.7 0 2 1.8 3.2 3.2 3.9 1.4.7 1.9 1.1 1.9 1.8 0 1-.7 1.4-2.1 1.4-1.4 0-2.2-.2-3.4-.7l-.5-.2-.5 3.1c.8.4 2.4.7 4 .7 3.8 0 6.3-1.9 6.3-4.8 0-1.6-1-2.8-3-3.8-1.3-.6-2-1.1-2-1.7 0-.6.6-1.2 2-1.2 1.1 0 2 .2 2.6.5l.3.2.5-3.1zm9.3-.4h-2.8c-.9 0-1.5.3-1.9 1.1l-5.4 12.9h3.8l.8-2.1h4.6l.4 2.1h3.4l-2.9-14zm-4.4 9l1.5-4.1.4-1.1.3 1.1.9 4.1h-3.1zM15.4 18.5l-3.6 9.5-.4-1.9c-.7-2.3-2.8-4.8-5.2-6l3.3 12.4h3.9l5.8-14h-3.8z"/>
          <path fill="#F9A533" d="M8.4 18.5H2.7l-.1.4c4.6 1.2 7.6 4 8.9 7.4l-1.3-6.5c-.2-.9-.8-1.2-1.8-1.3z"/>
        </svg>
      )
    };
  }

  // Mastercard: começa com 51-55 ou 2221-2720
  if (/^5[1-5]/.test(cleanNumber) || /^2[2-7]/.test(cleanNumber)) {
    return {
      brand: 'mastercard',
      color: 'from-gray-800 to-gray-900',
      logo: (
        <svg viewBox="0 0 48 48" className="w-16 h-10">
          <circle cx="16" cy="24" r="10" fill="#EB001B"/>
          <circle cx="32" cy="24" r="10" fill="#F79E1B"/>
          <path fill="#FF5F00" d="M24 16.8c2.3 1.8 3.8 4.5 3.8 7.6s-1.5 5.8-3.8 7.6c-2.3-1.8-3.8-4.5-3.8-7.6s1.5-5.8 3.8-7.6z"/>
        </svg>
      )
    };
  }

  // Amex: começa com 34 ou 37
  if (/^3[47]/.test(cleanNumber)) {
    return {
      brand: 'amex',
      color: 'from-sky-500 to-sky-700',
      logo: (
        <svg viewBox="0 0 48 48" className="w-16 h-10">
          <rect fill="#016FD0" width="48" height="48" rx="4"/>
          <path fill="#fff" d="M12 24h4l1-2.5L18 24h4v-6l-2 4.5-2-4.5h-2v4l-2-4h-3l-2 4h2l.5-1h2l.5 1zm24-6h-6v6h6v-1h-4v-1h4v-1h-4v-1h4v-2zm-12 0l-3 6h2l.5-1h3l.5 1h2l-3-6h-2zm0 2l1 2h-2l1-2z"/>
        </svg>
      )
    };
  }

  // Elo: vários prefixos
  if (/^(4011|4312|4389|5041|5066|5067|509|6277|6362|6363|650|651|652|653|654|655|656|657|658|6516)/.test(cleanNumber)) {
    return {
      brand: 'elo',
      color: 'from-yellow-500 to-yellow-600',
      logo: (
        <div className="flex items-center gap-1">
          <span className="text-2xl font-black text-black">elo</span>
        </div>
      )
    };
  }

  // Hipercard: começa com 606282 ou 3841
  if (/^(606282|3841)/.test(cleanNumber)) {
    return {
      brand: 'hipercard',
      color: 'from-red-600 to-red-800',
      logo: (
        <div className="flex items-center">
          <span className="text-xl font-black text-white">HIPERCARD</span>
        </div>
      )
    };
  }

  // Default
  return {
    brand: 'default',
    color: 'from-neutral-700 to-neutral-900',
    logo: (
      <div className="w-12 h-8 bg-white/20 rounded" />
    )
  };
}

export function CreditCardPreview({
  cardNumber,
  cardName,
  cardExpiry,
  cardCvc,
  isFlipped = false
}: CreditCardPreviewProps) {
  const [flipped, setFlipped] = useState(isFlipped);
  const { brand, logo, color } = getCardBrand(cardNumber);

  // Formata o número para exibição
  const displayNumber = cardNumber || '•••• •••• •••• ••••';
  const displayName = cardName || 'SEU NOME AQUI';
  const displayExpiry = cardExpiry || 'MM/YY';

  return (
    <div
      className="perspective-1000 cursor-pointer mb-6"
      onClick={() => setFlipped(!flipped)}
    >
      <div
        className={`relative w-full max-w-[380px] mx-auto aspect-[1.586/1] transition-transform duration-700 transform-style-3d ${
          flipped ? 'rotate-y-180' : ''
        }`}
        style={{
          transformStyle: 'preserve-3d',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
      >
        {/* Frente do cartão */}
        <div
          className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${color} p-6 flex flex-col justify-between shadow-2xl backface-hidden`}
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Topo */}
          <div className="flex items-start justify-between">
            {/* Chip */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-9 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-lg flex items-center justify-center">
                <div className="w-8 h-6 border-2 border-yellow-600/30 rounded grid grid-cols-3 gap-px">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-yellow-600/20" />
                  ))}
                </div>
              </div>
              <Wifi className="w-6 h-6 text-white/60 rotate-90" />
            </div>
            {/* Logo da bandeira */}
            <div className="flex items-center">
              {logo}
            </div>
          </div>

          {/* Número do cartão */}
          <div className="space-y-4">
            <div className="text-xl md:text-2xl font-mono text-white tracking-[0.2em] drop-shadow-lg">
              {displayNumber}
            </div>

            {/* Nome e Validade */}
            <div className="flex items-end justify-between">
              <div>
                <span className="text-[8px] uppercase tracking-widest text-white/40 block mb-1">
                  Titular do Cartão
                </span>
                <span className="text-sm font-bold text-white uppercase tracking-wider">
                  {displayName}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[8px] uppercase tracking-widest text-white/40 block mb-1">
                  Validade
                </span>
                <span className="text-sm font-mono text-white tracking-wider">
                  {displayExpiry}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Verso do cartão */}
        <div
          className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${color} flex flex-col shadow-2xl`}
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          {/* Tarja magnética */}
          <div className="w-full h-14 bg-neutral-900 mt-6" />

          {/* Área de assinatura e CVV */}
          <div className="flex-1 p-6 flex flex-col justify-center">
            <div className="flex items-center gap-4">
              <div className="flex-1 h-10 bg-white/90 rounded flex items-center justify-end px-4">
                <span className="font-mono text-neutral-900 italic text-sm tracking-widest">
                  {displayName}
                </span>
              </div>
              <div className="w-16 h-10 bg-white rounded flex items-center justify-center">
                <span className="font-mono text-neutral-900 font-bold tracking-widest">
                  {cardCvc || '•••'}
                </span>
              </div>
            </div>
            <span className="text-[8px] text-white/40 mt-2 text-right uppercase tracking-widest">
              Código de Segurança (CVV)
            </span>
          </div>

          {/* Logo no verso */}
          <div className="absolute bottom-4 right-6">
            {logo}
          </div>
        </div>
      </div>

      {/* Indicador de clique */}
      <p className="text-center text-[9px] text-neutral-400 mt-3 uppercase tracking-widest">
        Clique no cartão para {flipped ? 'ver a frente' : 'ver o verso'}
      </p>
    </div>
  );
}
