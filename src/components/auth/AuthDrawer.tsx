
import React, { useState } from 'react';
import { X, User, LogOut, /* Apple, */ Loader2, ShoppingBag, Mail, ArrowLeft, Check } from 'lucide-react';
import { UserProfile as UserType } from '../../types';
import { Locale } from '../../i18n';
import { supabase } from '../../utils/supabase';
import UserProfileView from './UserProfileView';

interface AuthDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
  onLogin: (user: UserType) => void;
  onLogout: () => void;
  t: (key: string) => any;
  locale: Locale;
}

const AuthDrawer: React.FC<AuthDrawerProps> = ({ isOpen, onClose, user, onLogin, onLogout, t, locale }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | null>(null); // 'apple' temporarily disabled
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (authMode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        // Profile will be fetched automatically by useAuth hook
        // Just close the drawer - the hook will update currentUser
        onClose();
      } else {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { data: { full_name: fullName } }
        });
        if (error) throw error;
        alert('Cadastro realizado! Verifique seu email para confirmar.');
        setAuthMode('login');
      }
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' /* | 'apple' temporarily disabled */) => {
    setSocialLoading(provider);
    try {
      // Get redirect URL from environment variable
      // In production, VITE_FRONTEND_URL must be set
      // Fallback to window.location.origin only in development
      const envRedirectUrl = import.meta.env.VITE_FRONTEND_URL;
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      
      // Prefer environment variable, but validate it's not localhost in production
      let redirectUrl = envRedirectUrl || currentOrigin;
      
      // Safety check: if we're in production (not localhost) and env var is not set, warn
      if (!envRedirectUrl && currentOrigin && !currentOrigin.includes('localhost')) {
        console.warn('VITE_FRONTEND_URL not set in production. Using current origin:', currentOrigin);
      }
      
      // Ensure we have a valid URL
      if (!redirectUrl) {
        throw new Error('Redirect URL não configurada. Configure VITE_FRONTEND_URL no arquivo .env');
      }
      
      console.log('OAuth redirect URL:', redirectUrl); // Debug log
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl
        }
      });
      if (error) throw error;
    } catch (err: any) {
      alert(`Erro no login social: ${err.message}`);
      setSocialLoading(null);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert('Por favor, insira seu email.');
      return;
    }

    setIsLoading(true);
    try {
      // Get redirect URL from environment variable
      const envRedirectUrl = import.meta.env.VITE_FRONTEND_URL;
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      const redirectUrl = envRedirectUrl || currentOrigin;
      
      if (!redirectUrl) {
        throw new Error('Redirect URL não configurada. Configure VITE_FRONTEND_URL no arquivo .env');
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${redirectUrl}/reset-password`,
      });

      if (error) throw error;
      
      setPasswordResetSent(true);
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" onClick={onClose} />

      <div className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-white z-[70] shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 text-neutral-900">
        <div className="flex items-center justify-between p-8 border-b border-gray-100 bg-white">
          <h2 className="text-xl font-light tracking-widest uppercase text-neutral-900">
            {user 
              ? t('auth.myAccount') 
              : forgotPasswordMode 
                ? 'Recuperar Senha' 
                : (authMode === 'login' ? t('auth.signIn') : t('auth.createAccount'))
            }
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-neutral-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden bg-white">
           {user ? (
             <div className="h-full flex flex-col">
                <UserProfileView 
                  user={user} 
                  t={t} 
                  locale={locale} 
                  onUpdate={onLogin}
                  onLogout={() => { onLogout(); onClose(); }}
                />
             </div>
           ) : forgotPasswordMode ? (
             /* FORGOT PASSWORD MODE */
             <div className="p-8 bg-white h-full space-y-8 overflow-y-auto no-scrollbar">
                {passwordResetSent ? (
                  /* SUCCESS MESSAGE */
                  <div className="flex flex-col items-center justify-center min-h-[400px] space-y-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
                      <Check className="w-10 h-10 text-green-500" />
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-2xl font-light uppercase tracking-widest">Email Enviado</h3>
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
                        className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-neutral-400 hover:text-black transition-colors mb-4"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>Voltar</span>
                      </button>
                      <h3 className="text-xl font-light uppercase tracking-widest mb-2">Recuperar Senha</h3>
                      <p className="text-sm text-neutral-500 leading-relaxed">
                        Digite seu email e enviaremos um link para redefinir sua senha.
                      </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleForgotPassword}>
                      <div className="space-y-2">
                        <label className="text-[9px] uppercase font-bold text-neutral-400 tracking-widest">E-mail</label>
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
             <div className="p-8 bg-white h-full space-y-8 overflow-y-auto no-scrollbar">
                
                {/* Checkout Context Indicator */}
                <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100 flex items-center gap-4">
                   <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center flex-none">
                      <ShoppingBag className="w-4 h-4" />
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600 leading-relaxed">
                      Identifique-se para garantir a segurança da sua transação Auricapri.
                   </p>
                </div>

                {/* Social Auth Buttons */}
                <div className="space-y-3">
                   <button 
                     onClick={() => handleSocialLogin('google')}
                     disabled={!!socialLoading}
                     className="w-full flex items-center justify-center gap-4 py-4 border border-neutral-100 rounded-2xl hover:border-neutral-900 transition-all active:scale-95 disabled:opacity-50"
                   >
                     {socialLoading === 'google' ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                       <svg className="w-4 h-4" viewBox="0 0 24 24">
                         <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                         <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                         <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                         <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                       </svg>
                     )}
                     <span className="text-[10px] font-black uppercase tracking-widest">Google Login</span>
                   </button>
                   
                   {/* Apple OAuth temporarily disabled
                   <button 
                     onClick={() => handleSocialLogin('apple')}
                     disabled={!!socialLoading}
                     className="w-full flex items-center justify-center gap-4 py-4 bg-neutral-50 rounded-2xl hover:bg-neutral-100 transition-all active:scale-95 disabled:opacity-50"
                   >
                     {socialLoading === 'apple' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Apple className="w-4 h-4 fill-current" />}
                     <span className="text-[10px] font-black uppercase tracking-widest">Apple Login</span>
                   </button>
                   */}
                </div>

                <div className="flex items-center gap-4 py-2">
                   <div className="h-[1px] flex-1 bg-neutral-100"></div>
                   <span className="text-[8px] font-black uppercase text-neutral-300 tracking-[0.4em]">OU</span>
                   <div className="h-[1px] flex-1 bg-neutral-100"></div>
                </div>

                <form className="space-y-6" onSubmit={handleAuth}>
                   {authMode === 'register' && (
                     <div className="space-y-2">
                        <label className="text-[9px] uppercase font-bold text-neutral-400 tracking-widest">Nome Completo</label>
                        <input className="w-full px-6 py-4 bg-neutral-50 rounded-2xl border border-neutral-200 text-neutral-900 text-sm focus:border-neutral-900 outline-none" value={fullName} onChange={e => setFullName(e.target.value)} required />
                     </div>
                   )}
                   <div className="space-y-2">
                     <label className="text-[9px] uppercase font-bold text-neutral-400 tracking-widest">{t('auth.email')}</label>
                     <input type="email" className="w-full px-6 py-4 bg-neutral-50 rounded-2xl border border-neutral-200 text-neutral-900 text-sm focus:border-neutral-900 outline-none placeholder:text-neutral-300" value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@exemplo.com" required />
                   </div>
                   <div className="space-y-2">
                     <div className="flex items-center justify-between">
                       <label className="text-[9px] uppercase font-bold text-neutral-400 tracking-widest">{t('auth.password')}</label>
                       {authMode === 'login' && (
                         <button
                           type="button"
                           onClick={() => setForgotPasswordMode(true)}
                           className="text-[9px] font-bold text-neutral-400 hover:text-black transition-colors underline"
                         >
                           Esqueceu a senha?
                         </button>
                       )}
                     </div>
                     <input type="password" className="w-full px-6 py-4 bg-neutral-50 rounded-2xl border border-neutral-200 text-neutral-900 text-sm focus:border-neutral-900 outline-none" value={password} onChange={e => setPassword(e.target.value)} required />
                   </div>
                   
                   <button type="submit" disabled={isLoading || !!socialLoading} className="w-full bg-neutral-900 text-white py-5 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center shadow-lg disabled:opacity-50">
                     {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>{authMode === 'login' ? t('auth.login') : t('auth.signup')}</span>}
                   </button>
                </form>
                
                <div className="text-center pt-2">
                  <p className="text-xs text-neutral-400">
                    {authMode === 'login' ? t('auth.noAccount') : t('auth.haveAccount')}
                    <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="font-bold text-neutral-900 underline ml-2 hover:text-black">
                      {authMode === 'login' ? t('auth.signup') : t('auth.login')}
                    </button>
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
