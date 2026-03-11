import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Lock, Eye, EyeOff, Check, Loader2, ArrowLeft } from 'lucide-react';
import { Locale } from '../i18n';
import { supabase } from '../utils/supabase';

interface ResetPasswordPageProps {
  locale: Locale;
  onNavigate: (view: 'home' | 'product' | 'collection' | 'checkout' | 'receipt' | 'about', target?: string) => void;
  t: (key: string) => any;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ locale: _locale, onNavigate, t: _t }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);

  useEffect(() => {
    // Supabase sends recovery links that include the session in the URL fragment.
    // detectSessionInUrl: true in supabase.ts parses it and fires PASSWORD_RECOVERY event.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setIsValidatingToken(false);
      }
    });

    // Also check existing session (handles page reload after recovery link click)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsValidatingToken(false);
      } else {
        // No session found — check if we have recovery tokens in URL
        const hash = window.location.hash;
        if (!hash.includes('access_token') && !hash.includes('type=recovery')) {
          setError('Link de recuperação inválido ou expirado.');
          setIsValidatingToken(false);
        }
        // If hash has tokens, wait for onAuthStateChange to fire
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      // Sign out so user logs in fresh with new password
      await supabase.auth.signOut();
      setTimeout(() => onNavigate('home'), 3000);
    } catch (err: any) {
      if (err.message?.includes('expired') || err.message?.includes('invalid')) {
        setError('Link de recuperação expirado. Solicite um novo link.');
      } else {
        setError('Erro ao redefinir a senha. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidatingToken) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-6">
        <div className="text-center space-y-6 animate-in fade-in duration-500">
          <Loader2 className="w-12 h-12 animate-spin text-neutral-400 mx-auto" />
          <p className="text-sm text-neutral-500 font-medium">Validando link de recuperação...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <div className="space-y-4">
            <h2 className="font-serif text-2xl font-light uppercase tracking-widest">Senha Redefinida</h2>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Sua senha foi redefinida com sucesso! Você será redirecionado para a página inicial.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6 py-24">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="max-w-md w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-serif text-3xl font-light uppercase tracking-widest">Nova Senha</h1>
          <p className="text-sm text-neutral-500 leading-relaxed">
            Digite sua nova senha abaixo. Certifique-se de que ela tenha pelo menos 6 caracteres.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600 animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        {/* Form */}
        <form className="space-y-6" onSubmit={handleResetPassword}>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-widest">Nova Senha</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="w-full px-6 py-4 bg-neutral-50 rounded-2xl border border-neutral-200 text-neutral-900 text-sm focus:border-neutral-900 outline-none pr-14" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="Mínimo 6 caracteres"
                required 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-widest">Confirmar Senha</label>
            <div className="relative">
              <input 
                type={showConfirmPassword ? 'text' : 'password'} 
                className="w-full px-6 py-4 bg-neutral-50 rounded-2xl border border-neutral-200 text-neutral-900 text-sm focus:border-neutral-900 outline-none pr-14" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                placeholder="Digite a senha novamente"
                required 
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading || !password || !confirmPassword} 
            className="w-full bg-black text-white py-5 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] hover:bg-neutral-800 transition-all flex items-center justify-center gap-3 shadow-lg disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Redefinindo...</span>
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                <span>Redefinir Senha</span>
              </>
            )}
          </button>
        </form>

        {/* Back to Home */}
        <div className="text-center">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 text-sm text-neutral-400 hover:text-black transition-colors mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao início</span>
          </button>
        </div>
      </div>
    </div>
  );
};
