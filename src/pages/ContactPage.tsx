import React from 'react';
import { Instagram, Mail, MessageCircle, ArrowLeft } from 'lucide-react';
import type { StoreConfig } from '../types';

interface ContactPageProps {
  config?: StoreConfig;
  locale: string;
  onBack: () => void;
}

export function ContactPage({ config, onBack }: ContactPageProps) {
  const phone = config?.support_phone?.replace(/\D/g, '') ?? '';
  const email = config?.contact_email ?? '';

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {/* Header */}
      <div className="px-6 md:px-12 pt-8 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm uppercase tracking-widest font-bold text-neutral-400 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <span className="text-xs uppercase tracking-[0.3em] text-black/40 mb-4 block">
          Fale conosco
        </span>
        <h1 className="font-serif text-5xl md:text-6xl mb-6 leading-tight">
          Entre em <em>Contato</em>
        </h1>
        <p className="text-black/60 font-light leading-relaxed max-w-md mx-auto mb-16">
          Estamos aqui para ajudar. Escolha o canal de atendimento de sua preferência.
        </p>

        <div className="flex flex-col gap-4 w-full max-w-sm">
          {/* Instagram */}
          <a
            href="https://www.instagram.com/auricapri.oficial"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 px-6 py-5 bg-paper/60 border border-black/10 rounded-2xl hover:bg-paper hover:border-black/20 transition-all group"
          >
            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center flex-shrink-0">
              <Instagram className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-xs uppercase tracking-widest text-black/40 font-bold">Instagram</p>
              <p className="text-sm font-semibold">@auricapri.oficial</p>
            </div>
          </a>

          {/* WhatsApp */}
          {phone && (
            <a
              href={`https://wa.me/${phone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 px-6 py-5 bg-paper/60 border border-black/10 rounded-2xl hover:bg-paper hover:border-black/20 transition-all group"
            >
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-xs uppercase tracking-widest text-black/40 font-bold">WhatsApp</p>
                <p className="text-sm font-semibold">{config?.support_phone}</p>
              </div>
            </a>
          )}

          {/* Email */}
          {email && (
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-4 px-6 py-5 bg-paper/60 border border-black/10 rounded-2xl hover:bg-paper hover:border-black/20 transition-all group"
            >
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-xs uppercase tracking-widest text-black/40 font-bold">E-mail</p>
                <p className="text-sm font-semibold">{email}</p>
              </div>
            </a>
          )}
        </div>

        <p className="mt-12 text-xs text-black/30 uppercase tracking-widest">
          Atendimento de segunda a sexta, 9h–18h
        </p>
      </div>
    </div>
  );
}
