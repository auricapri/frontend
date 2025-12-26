import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, Check, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { Locale } from '../i18n';

interface ResetPasswordPageProps {
  locale: Locale;
  onNavigate: (view: 'home' | 'product' | 'collection' | 'admin' | 'checkout' | 'receipt' | 'about', target?: string) => void;
  t: (key: string) => any;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ locale, onNavigate, t }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);

  useEffect(() => {
    // Check if we have a valid session/token from the hash
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          // Try to get session from URL hash
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const type = hashParams.get('type');
          
          if (type === 'recovery' && accessToken) {
            // Session will be set automatically by Supabase
            // Wait a bit for it to process
            setTimeout(() => setIsValidatingToken(false), 1000);
          } else {
            setError('Link de recuperação inválido ou expirado.');
            setIsValidatingToken(false);
          }
        } else {
          setIsValidatingToken(false);
        }
      } catch (err) {
        setError('Erro ao validar o link de recuperação.');
        setIsValidatingToken(false);
      }
    };

    checkSession();
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
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        onNavigate('home');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao redefinir a senha. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidatingToken) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center space-y-6 animate-in fade-in duration-500">
          <Loader2 className="w-12 h-12 animate-spin text-neutral-400 mx-auto" />
          <p className="text-sm text-neutral-500 font-medium">Validando link de recuperação...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-light uppercase tracking-widest">Senha Redefinida</h2>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Sua senha foi redefinida com sucesso! Você será redirecionado para a página inicial.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-24">
      <div className="max-w-md w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-light uppercase tracking-widest">Nova Senha</h1>
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
            <label className="text-[9px] uppercase font-bold text-neutral-400 tracking-widest">Nova Senha</label>
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
            <label className="text-[9px] uppercase font-bold text-neutral-400 tracking-widest">Confirmar Senha</label>
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

