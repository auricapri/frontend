/// Affiliate Tab Component
/// Shows influencer program status, coupon code, and terms acceptance modal

import React, { useState, useEffect } from 'react';
import { Ticket, Copy, Check, AlertCircle, ExternalLink, ChevronRight } from 'lucide-react';
import { UserProfile } from '../../../../types';
import { Locale } from '../../../../i18n';
import { apiClient } from '../../../../api/client';

interface AffiliateTabProps {
  user: UserProfile;
  locale: Locale;
}

interface InfluencerData {
  id: string;
  status: 'pending_acceptance' | 'active' | 'paused' | 'terminated';
  tier: 'affiliate' | 'affiliate_plus' | 'affiliate_premium';
  coupon_code: string | null;
  terms_accepted_at: string | null;
  coupon: {
    code: string;
    discount_type: string;
    discount_value: number;
  } | null;
}

const TIER_COMMISSION: Record<string, string> = {
  affiliate: '10%',
  affiliate_plus: '12%',
  affiliate_premium: '15%',
};

const TIER_LABELS: Record<string, string> = {
  affiliate: 'Afiliado',
  affiliate_plus: 'Afiliado Plus',
  affiliate_premium: 'Afiliado Premium',
};

export const AffiliateTab: React.FC<AffiliateTabProps> = ({ user, locale: _locale }) => {
  const [influencer, setInfluencer] = useState<InfluencerData | null | undefined>(undefined);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    apiClient.get<InfluencerData | null>('/influencer/me')
      .then(data => {
        setInfluencer(data);
        if (data?.status === 'pending_acceptance') {
          setShowTermsModal(true);
        }
      })
      .catch(() => setInfluencer(null));
  }, []);

  const handleCopyCode = async () => {
    const code = influencer?.coupon_code;
    if (!code) return;
    const { generateReferralLink } = await import('../../../../utils/affiliate');
    const referralLink = generateReferralLink(code);
    navigator.clipboard.writeText(referralLink);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleAcceptTerms = async () => {
    if (!termsChecked) return;
    setIsAccepting(true);
    try {
      const updated = await apiClient.post<InfluencerData>('/influencer/terms/accept', {});
      setInfluencer(updated);
      setShowTermsModal(false);
    } catch (err: any) {
      alert(err.message || 'Erro ao aceitar termos');
    } finally {
      setIsAccepting(false);
    }
  };

  // Loading state
  if (influencer === undefined) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-700 rounded-full animate-spin" />
      </div>
    );
  }

  // Not enrolled
  if (influencer === null) {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="p-6 border border-neutral-200 rounded-2xl text-center space-y-4">
          <Ticket className="w-10 h-10 text-neutral-300 mx-auto" />
          <div>
            <h3 className="text-sm font-black font-serif uppercase tracking-tight">Programa de Afiliados</h3>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed max-w-xs mx-auto">
              Você ainda não faz parte do programa. Envie um e-mail para{' '}
              <strong>parceria@auricapri.com.br</strong> para se candidatar.
            </p>
          </div>
          <a
            href="mailto:parceria@auricapri.com.br?subject=Quero%20ser%20afiliado%20Auricapri"
            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-neutral-800 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Candidatar-se
          </a>
        </div>
      </div>
    );
  }

  // Terminated
  if (influencer.status === 'terminated') {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-2xl text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-neutral-400 mx-auto" />
          <p className="text-sm font-bold text-neutral-600">Participação encerrada</p>
          <p className="text-xs text-neutral-400">Sua participação no programa foi encerrada. Entre em contato: parceria@auricapri.com.br</p>
        </div>
      </div>
    );
  }

  const couponCode = influencer.coupon_code;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Main Card */}
      <div className="bg-neutral-900 text-white rounded-2xl p-4 md:p-6 text-center space-y-4 shadow-xl relative overflow-hidden">
        <div className="absolute top-2 right-2 opacity-10">
          <Ticket className="w-12 h-12 md:w-16 md:h-16 rotate-12" />
        </div>

        <div className="relative z-10 space-y-1">
          <h3 className="text-lg md:text-xl font-black font-serif uppercase italic tracking-tighter leading-none">
            Auricapri Muse
          </h3>
          <p className="text-[10px] text-white/50 uppercase tracking-widest font-black">
            {TIER_LABELS[influencer.tier]} · {TIER_COMMISSION[influencer.tier]} comissão
          </p>
        </div>

        {influencer.status === 'pending_acceptance' && (
          <div className="relative z-10">
            <button
              onClick={() => setShowTermsModal(true)}
              className="flex items-center gap-2 mx-auto px-4 py-2 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-400 transition-colors"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Aceitar os termos
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {influencer.status === 'paused' && (
          <div className="relative z-10 text-[10px] text-amber-400 uppercase tracking-widest font-black">
            Conta pausada — entre em contato
          </div>
        )}

        {couponCode && influencer.status === 'active' && (
          <div className="relative z-10 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
              Seu Cupom
            </span>
            <div className="bg-paper/5 border border-white/10 p-3 md:p-4 rounded-xl flex items-center justify-between gap-3 group hover:border-white/40 transition-all">
              <code className="text-sm md:text-base font-mono font-bold uppercase tracking-wider truncate">
                {couponCode}
              </code>
              <button
                onClick={handleCopyCode}
                className="p-2 md:p-3 bg-paper text-black rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg flex-shrink-0"
                title="Copiar link de indicação"
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-white/30 font-medium">
              {copiedCode ? 'Link copiado!' : 'Clique para copiar o link de indicação'}
            </p>
          </div>
        )}

        {!couponCode && influencer.status === 'active' && (
          <div className="relative z-10 text-[10px] text-white/40 uppercase tracking-widest">
            Cupom em processamento — em breve
          </div>
        )}
      </div>

      {/* Info card */}
      <div className="p-4 bg-neutral-50 border border-neutral-100 rounded-xl">
        <p className="text-[10px] text-neutral-500 leading-relaxed">
          Dúvidas sobre comissões, pagamentos ou termos? Entre em contato:{' '}
          <a href="mailto:parceria@auricapri.com.br" className="font-bold hover:underline">
            parceria@auricapri.com.br
          </a>
        </p>
      </div>

      {/* Terms Acceptance Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-paper w-full max-w-lg rounded-[2rem] shadow-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mx-auto">
                <Ticket className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-black font-serif uppercase tracking-tight">Termos de Afiliado</h3>
              <p className="text-xs text-neutral-500">Leia e aceite os termos antes de começar a divulgar</p>
            </div>

            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 space-y-3 text-[11px] text-neutral-600 leading-relaxed max-h-64 overflow-y-auto">
              <p><strong>Comissões:</strong> 10% sobre o valor líquido de cada venda confirmada. Tier Afiliado Plus (12%) a partir de R$1.500/mês e Premium (15%) a partir de R$4.000/mês.</p>
              <p><strong>Rastreamento:</strong> 30 dias corridos a partir do clique no seu link. Você recebe um cupom exclusivo que seus seguidores usam para 5% de desconto.</p>
              <p><strong>Pagamentos:</strong> Mensais, até o dia 15 do mês seguinte. Mínimo R$50 por ciclo. Exclusivamente via PIX/TED para conta CNPJ.</p>
              <p><strong>Divulgação obrigatória (CONAR/CDC):</strong> Toda publicação com comissão deve ser identificada como publicidade (#publi ou "Parceria paga com"). Não identificar pode resultar em multa de até R$500.000.</p>
              <p><strong>Práticas proibidas:</strong> Autocompra, declarações falsas, uso não autorizado da marca.</p>
              <p><strong>Rescisão:</strong> Qualquer violação resulta em encerramento imediato. Prazo indeterminado, 30 dias de aviso para saída voluntária.</p>
              <p className="text-[10px] text-neutral-400">Política completa disponível em parceria@auricapri.com.br. Versão 1.0 — Fevereiro de 2026.</p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termsChecked}
                onChange={e => setTermsChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-black flex-shrink-0"
              />
              <span className="text-xs text-neutral-700 leading-relaxed">
                Li e concordo com os <strong>Termos do Programa de Afiliados Auricapri</strong>.
                Estou ciente das obrigações de divulgação (CONAR/CDC) e das regras de pagamento.
                Confirmo que possuo CNPJ ativo para emissão de nota fiscal.
              </span>
            </label>

            <div className="flex gap-3">
              <button
                onClick={() => setShowTermsModal(false)}
                className="flex-1 py-3 border border-neutral-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:bg-neutral-50 transition-colors"
              >
                Depois
              </button>
              <button
                onClick={handleAcceptTerms}
                disabled={!termsChecked || isAccepting}
                className="flex-2 flex-grow py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAccepting ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Confirmando...</>
                ) : (
                  <><Check className="w-4 h-4" />Aceitar e participar</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
