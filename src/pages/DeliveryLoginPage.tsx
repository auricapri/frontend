import React, { useState } from 'react';
import { supabase } from '../utils/supabase';
import { UsersApi } from '../api/users.api';
import { Locale } from '../i18n';

interface DeliveryLoginPageProps {
  onLoginSuccess: () => void;
  t: (key: string) => any;
  locale: Locale;
}

export const DeliveryLoginPage: React.FC<DeliveryLoginPageProps> = ({ onLoginSuccess, t, locale }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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

      const isDelivery = (profile as any).role === 'delivery' || (profile as any).is_delivery === true;

      if (!isDelivery) {
        await supabase.auth.signOut();
        throw new Error('Acesso negado. Apenas usuários de entrega podem acessar.');
      }

      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

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
