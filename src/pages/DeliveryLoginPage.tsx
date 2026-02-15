import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import { UsersApi } from '../api/users.api';
import { Locale } from '../i18n';
import AdminMfaSetup from '../components/delivery/MfaSetup';
import AdminMfaChallenge from '../components/delivery/MfaChallenge';

interface DeliveryLoginPageProps {
  onLoginSuccess: () => void;
  t: (key: string) => any;
  locale: Locale;
}

type LoginStep = 'login' | 'mfa-setup' | 'mfa-challenge';

export const DeliveryLoginPage: React.FC<DeliveryLoginPageProps> = ({ onLoginSuccess, t: _t, locale: _locale }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<LoginStep>('login');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (!data.user || !data.session) {
        throw new Error('Login failed');
      }

      const usersApi = new UsersApi();
      const profile = await usersApi.getProfile(data.user.id);

      if (!profile) {
        throw new Error('Profile not found');
      }

      const role = (profile as any).role;
      const isDelivery = role === 'delivery' || (profile as any).is_delivery === true;
      const isAdmin = role === 'admin' || (profile as any).is_admin === true;

      if (!isDelivery && !isAdmin) {
        await supabase.auth.signOut();
        throw new Error('Acesso negado. Apenas usuários de entrega ou administradores podem acessar.');
      }

      const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalError) throw aalError;

      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) throw factorsError;

      const hasVerifiedFactors = factorsData.totp.some((f: any) => f.status === 'verified') ||
        factorsData.phone.some((f: any) => f.status === 'verified');

      if (!hasVerifiedFactors) {
        setStep('mfa-setup');
      } else if (aalData?.currentLevel === 'aal1' && aalData?.nextLevel === 'aal2') {
        setStep('mfa-challenge');
      } else if (aalData?.currentLevel === 'aal2') {
        onLoginSuccess();
      } else {
        setStep('mfa-setup');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaSetupComplete = async () => {
    const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalError) {
      setError(aalError.message);
      return;
    }

    if (aalData?.currentLevel === 'aal2') {
      onLoginSuccess();
    } else {
      setStep('mfa-challenge');
    }
  };

  const handleMfaChallengeComplete = () => {
    onLoginSuccess();
  };

  if (step === 'mfa-setup') {
    return (
      <AdminMfaSetup
        onComplete={handleMfaSetupComplete}
        onCancel={() => {
          supabase.auth.signOut();
          setStep('login');
        }}
        t={_t}
        locale={_locale}
        subtitle="Obrigatório para entregadores"
        friendlyName="Delivery Authenticator"
      />
    );
  }

  if (step === 'mfa-challenge') {
    return (
      <AdminMfaChallenge
        onComplete={handleMfaChallengeComplete}
        onCancel={() => {
          supabase.auth.signOut();
          setStep('login');
        }}
        t={_t}
        locale={_locale}
        subtitle="Código do autenticador"
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">AURICAPRI</h1>
            <p className="text-sm font-bold uppercase tracking-widest text-neutral-400">Delivery Login</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-neutral-600 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all"
                placeholder="delivery@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-neutral-600 mb-2">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-black text-white rounded-xl font-black uppercase tracking-widest hover:bg-neutral-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
