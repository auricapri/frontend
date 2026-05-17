import React, { useState } from 'react';
import { supabase } from '../../utils/supabase';
import { Locale } from '../../i18n';
import { Shield, AlertCircle, X } from 'lucide-react';

interface AdminMfaChallengeProps {
  onComplete: () => void;
  onCancel: () => void;
  t: (key: string) => string;
  locale: Locale;
  subtitle?: string;
}

const AdminMfaChallenge: React.FC<AdminMfaChallengeProps> = ({ onComplete, onCancel, t: _t, locale: _locale, subtitle }) => {
  const [verifyCode, setVerifyCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!verifyCode.trim()) {
      setError('Por favor, insira o código de verificação');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();

      if (factorsError) throw factorsError;

      const totpFactor = factorsData.totp.find((f) => f.status === 'verified');
      const phoneFactor = factorsData.phone.find((f) => f.status === 'verified');

      const factor = totpFactor || phoneFactor;

      if (!factor) {
        throw new Error('Nenhum fator MFA encontrado');
      }

      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: factor.id,
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: factor.id,
        challengeId: challengeData.id,
        code: verifyCode,
      });

      if (verifyError) throw verifyError;

      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        await supabase.auth.setSession(sessionData.session);
      }

      onComplete();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Código inválido. Tente novamente.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-paper rounded-3xl shadow-xl p-8 md:p-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-black font-serif uppercase tracking-tighter">Verificação MFA</h2>
                <p className="text-xs text-neutral-400 uppercase tracking-widest">{subtitle || 'Código de Autenticação'}</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800 font-medium">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <p className="text-sm text-neutral-700 mb-4">
                Insira o código de 6 dígitos do seu aplicativo autenticador:
              </p>
              <input
                type="text"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-4 bg-neutral-50 border border-neutral-200 rounded-xl text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-black transition-all"
                autoFocus
              />
            </div>

            <button
              onClick={handleVerify}
              disabled={isLoading || verifyCode.length !== 6}
              className="w-full py-4 bg-black text-white rounded-xl font-black uppercase tracking-widest hover:bg-neutral-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verificando...' : 'Verificar e Entrar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMfaChallenge;
