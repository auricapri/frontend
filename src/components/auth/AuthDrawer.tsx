
import React, { useState, useEffect, Suspense } from 'react';
import { X, Loader2, Mail, ArrowLeft, Check } from 'lucide-react';
import { UserProfile as UserType, StoreConfig } from '../../types';
import { Locale } from '../../i18n';
import { supabase } from '../../utils/supabase';
import { LoadingFallback } from '../ui/LoadingFallback';
import { STORE_CLOSING_TITLE, STORE_CLOSING_AUTH_MESSAGE } from '../../constants/storeClosing';

const UserProfileView = React.lazy(() => import('./UserProfileView'));

interface AuthDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
  onLogin: (user: UserType) => void;
  onLogout: () => void;
  t: (key: string) => any;
  locale: Locale;
  storeConfig?: StoreConfig;
}

const AuthDrawer: React.FC<AuthDrawerProps> = ({ isOpen, onClose, user, onLogin, onLogout, t, locale, storeConfig }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Add bottom padding when virtual keyboard appears so content scrolls correctly (iOS Safari fix)
  useEffect(() => {
    if (!isOpen) return;
    const vv = window.visualViewport;
    if (!vv) return;

    const handleResize = () => {
      const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardHeight(kb);
      const focused = document.activeElement as HTMLElement;
      if (focused && focused.tagName === 'INPUT') {
        setTimeout(() => focused.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
      }
    };

    vv.addEventListener('resize', handleResize);
    return () => {
      vv.removeEventListener('resize', handleResize);
      setKeyboardHeight(0);
    };
  }, [isOpen]);

  const getAuthErrorMessage = (message: string): string => {
    if (message.includes('Invalid login credentials') || message.includes('invalid_credentials')) return 'Email ou senha incorretos.';
    if (message.includes('Email not confirmed')) return 'Confirme seu email antes de fazer login.';
    if (message.includes('User already registered') || message.includes('already been registered')) return 'Este email já está cadastrado. Faça login.';
    if (message.includes('Password should be at least') || message.includes('weak_password')) return 'Senha muito fraca. Use pelo menos 6 caracteres.';
    if (message.includes('Unable to validate email') || message.includes('invalid_email')) return 'Email inválido.';
    if (message.includes('rate limit') || message.includes('over_email_send_rate_limit')) return 'Muitas tentativas. Tente novamente em alguns minutos.';
    if (message.includes('network') || message.includes('fetch')) return 'Erro de conexão. Verifique sua internet.';
    if (message.includes('disabled')) return 'Esta conta foi desativada. Entre em contato.';
    return 'Ocorreu um erro. Tente novamente.';
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : (err as any)?.message || 'Ocorreu um erro.';
      setAuthError(getAuthErrorMessage(message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setAuthError('Por favor, insira seu email.');
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setPasswordResetSent(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ocorreu um erro.';
      setAuthError(getAuthErrorMessage(message));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" onClick={onClose} />

      <div role="dialog" aria-modal="true" className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-paper z-[70] shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 text-neutral-900" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-between p-8 border-b border-gray-100 bg-paper">
          <h2 className="text-xl font-light font-serif tracking-widest uppercase text-neutral-900">
            {user
              ? t('auth.myAccount')
              : forgotPasswordMode
                ? 'Recuperar Senha'
                : t('auth.signIn')
            }
          </h2>
          <button onClick={onClose} aria-label="Close drawer" className="p-2 hover:bg-gray-100 rounded-full text-neutral-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden bg-paper">
           {user ? (
             <div className="h-full flex flex-col">
                <Suspense fallback={<LoadingFallback size="sm" message="Carregando perfil..." />}>
                  <UserProfileView
                    user={user}
                    t={t}
                    locale={locale}
                    onUpdate={onLogin}
                    onLogout={() => { onLogout(); onClose(); }}
                    storeConfig={storeConfig}
                  />
                </Suspense>
             </div>
           ) : forgotPasswordMode ? (
             /* FORGOT PASSWORD MODE */
             <div className="p-8 bg-paper h-full space-y-8 overflow-y-auto no-scrollbar" style={{ paddingBottom: keyboardHeight > 0 ? `${keyboardHeight + 32}px` : undefined }}>
                {passwordResetSent ? (
                  /* SUCCESS MESSAGE */
                  <div className="flex flex-col items-center justify-center min-h-[400px] space-y-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
                      <Check className="w-10 h-10 text-green-500" />
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-2xl font-light font-serif uppercase tracking-widest">Email Enviado</h3>
                      <p className="text-sm text-neutral-500 max-w-sm leading-relaxed">
                        Enviamos um link de recuperação de senha para <strong className="text-neutral-900">{email}</strong>. 
                        Verifique sua caixa de entrada e siga as instruções.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setForgotPasswordMode(false);
                        setPasswordResetSent(false);
                        setEmail('');
                      }}
                      className="flex items-center gap-3 px-8 py-4 bg-black text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-neutral-800 transition-all active:scale-95"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Voltar ao Login</span>
                    </button>
                  </div>
                ) : (
                  /* FORGOT PASSWORD FORM */
                  <>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setForgotPasswordMode(false);
                          setEmail('');
                        }}
                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-black transition-colors mb-4"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>Voltar</span>
                      </button>
                      <h3 className="text-xl font-light font-serif uppercase tracking-widest mb-2">Recuperar Senha</h3>
                      <p className="text-sm text-neutral-500 leading-relaxed">
                        Digite seu email e enviaremos um link para redefinir sua senha.
                      </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleForgotPassword}>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-widest">E-mail</label>
                        <input 
                          type="email" 
                          className="w-full px-6 py-4 bg-neutral-50 rounded-2xl border border-neutral-200 text-neutral-900 text-sm focus:border-neutral-900 outline-none placeholder:text-neutral-300" 
                          value={email} 
                          onChange={e => setEmail(e.target.value)} 
                          placeholder="voce@exemplo.com" 
                          required 
                        />
                      </div>
                      
                      <button 
                        type="submit" 
                        disabled={isLoading} 
                        className="w-full bg-black text-white py-5 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] hover:bg-neutral-800 transition-all flex items-center justify-center gap-3 shadow-lg disabled:opacity-50"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Enviando...</span>
                          </>
                        ) : (
                          <>
                            <Mail className="w-5 h-5" />
                            <span>Enviar Link de Recuperação</span>
                          </>
                        )}
                      </button>
                    </form>
                  </>
                )}
             </div>
           ) : (
             <div className="px-6 pt-5 pb-6 bg-paper h-full overflow-y-auto no-scrollbar" style={{ paddingBottom: keyboardHeight > 0 ? `${keyboardHeight + 24}px` : undefined }}>

                {/* Form: email/senha primeiro para aparecer imediatamente na tela */}
                <form className="space-y-4" onSubmit={handleAuth}>
                   <div className="space-y-1.5">
                     <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-widest">{t('auth.email')}</label>
                     <input type="email" className="w-full px-4 py-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 text-neutral-900 text-sm focus:border-neutral-900 outline-none placeholder:text-neutral-300" value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@exemplo.com" required onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 300)} />
                   </div>
                   <div className="space-y-1.5">
                     <div className="flex items-center justify-between">
                       <label className="text-[10px] uppercase font-bold text-neutral-400 tracking-widest">{t('auth.password')}</label>
                       <button
                         type="button"
                         onClick={() => setForgotPasswordMode(true)}
                         className="text-[10px] font-bold text-neutral-400 hover:text-black transition-colors underline"
                       >
                         Esqueceu a senha?
                       </button>
                     </div>
                     <input type="password" className="w-full px-4 py-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 text-neutral-900 text-sm focus:border-neutral-900 outline-none" value={password} onChange={e => setPassword(e.target.value)} required onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 300)} />
                   </div>

                   {authError && (
                     <p style={{ color: '#c00', fontSize: '13px', marginTop: '8px', textAlign: 'center' }}>
                       {authError}
                     </p>
                   )}
                   <button type="submit" disabled={isLoading} className="w-full bg-neutral-900 text-white py-4 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center shadow-lg disabled:opacity-50">
                     {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>{t('auth.login')}</span>}
                   </button>
                </form>

                <div className="mt-6 p-5 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-900">
                    {STORE_CLOSING_TITLE}
                  </p>
                  <p className="text-xs text-neutral-500 leading-relaxed normal-case">
                    {STORE_CLOSING_AUTH_MESSAGE}
                  </p>
                </div>

             </div>
           )}
        </div>
      </div>
    </>
  );
};

export default AuthDrawer;
