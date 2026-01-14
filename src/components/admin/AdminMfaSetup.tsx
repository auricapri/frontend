import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { Locale } from '../../i18n';
import { X, Shield, AlertCircle } from 'lucide-react';

interface AdminMfaSetupProps {
  onComplete: () => void;
  onCancel: () => void;
  t: (key: string) => any;
  locale: Locale;
  subtitle?: string;
  friendlyName?: string;
}

const AdminMfaSetup: React.FC<AdminMfaSetupProps> = ({ onComplete, onCancel, t: _t, locale: _locale, subtitle, friendlyName }) => {
  const [factorId, setFactorId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'enroll' | 'verify'>('enroll');

  useEffect(() => {
    const enrollFactor = async () => {
      try {
        const { data, error: enrollError } = await supabase.auth.mfa.enroll({
          factorType: 'totp',
          friendlyName: friendlyName || 'Admin Authenticator',
        });

        if (enrollError) throw enrollError;

        setFactorId(data.id);
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
      } catch (err: any) {
        setError(err.message || 'Erro ao configurar MFA');
      }
    };

    enrollFactor();
  }, []);

  const handleVerify = async () => {
    if (!verifyCode.trim()) {
      setError('Por favor, insira o código de verificação');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verifyCode,
      });

      if (verifyError) throw verifyError;

      onComplete();
    } catch (err: any) {
      setError(err.message || 'Código inválido. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter">Configurar MFA</h2>
                <p className="text-xs text-neutral-400 uppercase tracking-widest">{subtitle || 'Obrigatório para Admin'}</p>
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

          {step === 'enroll' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-900 font-medium mb-2">
                  Escaneie o QR code com seu aplicativo autenticador:
                </p>
                <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                  <li>Google Authenticator</li>
                  <li>Microsoft Authenticator</li>
                  <li>1Password</li>
                  <li>Authy</li>
                </ul>
              </div>

              {qrCode && (
                <div className="flex flex-col items-center space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-neutral-200">
                    <img
                      src={qrCode}
                      alt="QR Code"
                      className="w-48 h-48"
                    />
                  </div>

                  <div className="w-full">
                    <p className="text-xs font-bold uppercase tracking-widest text-neutral-600 mb-2 text-center">
                      Ou insira manualmente:
                    </p>
                    <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                      <code className="text-sm font-mono text-center block break-all">
                        {secret}
                      </code>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep('verify')}
                className="w-full py-4 bg-black text-white rounded-xl font-black uppercase tracking-widest hover:bg-neutral-800 transition-all"
              >
                Já escaneei, continuar
              </button>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-6">
              <div>
                <p className="text-sm text-neutral-700 mb-4">
                  Insira o código de 6 dígitos do seu aplicativo autenticador para verificar:
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

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('enroll')}
                  className="flex-1 py-3 bg-neutral-100 text-neutral-700 rounded-xl font-bold uppercase tracking-widest hover:bg-neutral-200 transition-all"
                >
                  Voltar
                </button>
                <button
                  onClick={handleVerify}
                  disabled={isLoading || verifyCode.length !== 6}
                  className="flex-1 py-3 bg-black text-white rounded-xl font-black uppercase tracking-widest hover:bg-neutral-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Verificando...' : 'Verificar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMfaSetup;
