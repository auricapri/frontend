
import React, { useState, useEffect, Suspense } from 'react';
import { X, Loader2, Mail, ArrowLeft, Check } from 'lucide-react';
import { UserProfile as UserType } from '../../types';
import { Locale } from '../../i18n';
import { auth, googleProvider, appleProvider } from '../../utils/firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, updateProfile as updateFirebaseProfile } from 'firebase/auth';
import { LoadingFallback } from '../ui/LoadingFallback';

const UserProfileView = React.lazy(() => import('./UserProfileView'));

interface AuthDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
  onLogin: (user: UserType) => void;
  onLogout: () => void;
  t: (key: string) => any;
  locale: Locale;
  storeConfig?: any;
}

const AuthDrawer: React.FC<AuthDrawerProps> = ({ isOpen, onClose, user, onLogin, onLogout, t, locale, storeConfig }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

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

  // Read referral code from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref') || params.get('aff') || params.get('affiliate_id');
    if (ref) {
      setReferralCode(ref.toUpperCase());
      // If we have a referral code, automatically show register mode
      setAuthMode('register');
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoading(true);

    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged in useAuth handles profile fetch and state update
        onClose();
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        if (fullName) {
          await updateFirebaseProfile(result.user, { displayName: fullName });
        }
        // onAuthStateChanged handles profile creation (with referred_by_code via POST /api/auth/profile)
        onClose();
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setAuthError(`Erro: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setSocialLoading(provider);
    try {
      const firebaseProvider = provider === 'google' ? googleProvider : appleProvider;
      await signInWithPopup(auth, firebaseProvider);
      // onAuthStateChanged in useAuth handles profile creation and state update
      onClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      // Ignore user-cancelled popup errors
      if (!errorMessage.includes('popup-closed-by-user') && !errorMessage.includes('cancelled-popup-request')) {
        setAuthError(`Erro no login social: ${errorMessage}`);
      }
      setSocialLoading(null);
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
      await sendPasswordResetEmail(auth, email);
      setPasswordResetSent(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setAuthError(`Erro: ${errorMessage}`);
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
          <button onClick={onClose} aria-label="Close drawer" className="p-2 hover:bg-gray-100 rounded-full text-neutral-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden bg-white">
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
             <div className="p-8 bg-white h-full space-y-8 overflow-y-auto no-scrollbar" style={{ paddingBottom: keyboardHeight > 0 ? `${keyboardHeight + 32}px` : undefined }}>
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
             <div className="px-6 pt-5 pb-6 bg-white h-full overflow-y-auto no-scrollbar" style={{ paddingBottom: keyboardHeight > 0 ? `${keyboardHeight + 24}px` : undefined }}>

                {/* Form: email/senha primeiro para aparecer imediatamente na tela */}
                <form className="space-y-4" onSubmit={handleAuth}>
                   {authMode === 'register' && (
                     <>
                       <div className="space-y-1.5">
                          <label className="text-[9px] uppercase font-bold text-neutral-400 tracking-widest">Nome Completo</label>
                          <input className="w-full px-4 py-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 text-neutral-900 text-sm focus:border-neutral-900 outline-none" value={fullName} onChange={e => setFullName(e.target.value)} required onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 300)} />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[9px] uppercase font-bold text-neutral-400 tracking-widest">
                            Código de Indicação <span className="text-neutral-300 normal-case">(opcional)</span>
                          </label>
                          <input
                            className="w-full px-4 py-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 text-neutral-900 text-sm focus:border-neutral-900 outline-none placeholder:text-neutral-300"
                            value={referralCode}
                            onChange={e => setReferralCode(e.target.value.toUpperCase())}
                            placeholder="Ex: AUR-MARIA-AB12"
                            onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 300)}
                          />
                       </div>
                     </>
                   )}
                   <div className="space-y-1.5">
                     <label className="text-[9px] uppercase font-bold text-neutral-400 tracking-widest">{t('auth.email')}</label>
                     <input type="email" className="w-full px-4 py-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 text-neutral-900 text-sm focus:border-neutral-900 outline-none placeholder:text-neutral-300" value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@exemplo.com" required onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 300)} />
                   </div>
                   <div className="space-y-1.5">
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
                     <input type="password" className="w-full px-4 py-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 text-neutral-900 text-sm focus:border-neutral-900 outline-none" value={password} onChange={e => setPassword(e.target.value)} required onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 300)} />
                   </div>

                   {authMode === 'register' && (
                     <label className="flex items-start gap-3 cursor-pointer group pt-1">
                       <input
                         type="checkbox"
                         checked={acceptedTerms}
                         onChange={e => setAcceptedTerms(e.target.checked)}
                         className="mt-0.5 w-4 h-4 rounded border-neutral-300 text-black focus:ring-black accent-black"
                       />
                       <span className="text-[10px] text-neutral-500 leading-relaxed">
                         Li e aceito a{' '}
                         <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline text-neutral-900 font-bold">
                           Politica de Privacidade
                         </a>{' '}
                         e os{' '}
                         <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline text-neutral-900 font-bold">
                           Termos de Uso
                         </a>
                         . Autorizo o tratamento dos meus dados pessoais conforme a LGPD.
                       </span>
                     </label>
                   )}

                   {authError && (
                     <p style={{ color: '#c00', fontSize: '13px', marginTop: '8px', textAlign: 'center' }}>
                       {authError}
                     </p>
                   )}
                   <button type="submit" disabled={isLoading || !!socialLoading || (authMode === 'register' && !acceptedTerms)} className="w-full bg-neutral-900 text-white py-4 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center shadow-lg disabled:opacity-50">
                     {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>{authMode === 'login' ? t('auth.login') : t('auth.signup')}</span>}
                   </button>
                </form>

                <div className="text-center py-4">
                  <p className="text-xs text-neutral-400">
                    {authMode === 'login' ? t('auth.noAccount') : t('auth.haveAccount')}
                    <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="font-bold text-neutral-900 underline ml-2 hover:text-black">
                      {authMode === 'login' ? t('auth.signup') : t('auth.login')}
                    </button>
                  </p>
                </div>

                <div className="flex items-center gap-4">
                   <div className="h-[1px] flex-1 bg-neutral-100"></div>
                   <span className="text-[8px] font-black uppercase text-neutral-300 tracking-[0.4em]">OU</span>
                   <div className="h-[1px] flex-1 bg-neutral-100"></div>
                </div>

                {/* Social Auth Buttons — abaixo do formulário */}
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                   <button
                     onClick={() => handleSocialLogin('google')}
                     disabled={!!socialLoading}
                     className="flex-1 flex items-center justify-center gap-3 py-3.5 border border-neutral-100 rounded-2xl hover:border-neutral-900 transition-all active:scale-95 disabled:opacity-50"
                   >
                     {socialLoading === 'google' ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                       <svg className="w-4 h-4" viewBox="0 0 24 24">
                         <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                         <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                         <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                         <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                       </svg>
                     )}
                     <span className="text-[10px] font-black uppercase tracking-widest">Google</span>
                   </button>

                   <button
                     onClick={() => handleSocialLogin('apple')}
                     disabled={!!socialLoading}
                     className="flex-1 flex items-center justify-center gap-3 py-3.5 border border-neutral-100 rounded-2xl hover:border-neutral-900 transition-all active:scale-95 disabled:opacity-50"
                   >
                     {socialLoading === 'apple' ? (
                       <Loader2 className="w-4 h-4 animate-spin" />
                     ) : (
                       <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                         <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
                       </svg>
                     )}
                     <span className="text-[10px] font-black uppercase tracking-widest">Apple</span>
                   </button>
                </div>
             </div>
           )}
        </div>
      </div>
    </>
  );
};

export default AuthDrawer;
