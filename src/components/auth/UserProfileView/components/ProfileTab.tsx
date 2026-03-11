/// Profile Tab Component
/// Profile form and logout section

import React, { useState } from 'react';
import { Phone, Loader2, LogOut, Trash2 } from 'lucide-react';
import { UserProfile } from '../../../../types';
import { Locale } from '../../../../i18n';
import { supabase } from '../../../../utils/supabase';
import { maskPhone, maskCPF } from '../../../../utils/masks';
import { ProfileFormState } from '../types';
import { LoyaltyCard } from './LoyaltyCard';

interface ProfileTabProps {
  user: UserProfile;
  locale: Locale;
  t: (key: string) => any;
  formState: ProfileFormState;
  onFullNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onCpfChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onLogout?: () => void;
  onDeleteAccount?: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  user,
  locale,
  t,
  formState,
  onFullNameChange,
  onPhoneChange,
  onCpfChange,
  onSubmit,
  onLogout,
  onDeleteAccount,
}) => {
  const { fullName, phone, cpf, isUpdating } = formState;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout?.();
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      onDeleteAccount?.();
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Loyalty Card */}
      <LoyaltyCard user={user} locale={locale} />

      {/* Profile Form */}
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-4">
            {t('admin.customer')}
          </label>
          <input
            className="w-full p-6 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-black outline-none focus:bg-white focus:border-black transition-all"
            value={fullName}
            onChange={e => onFullNameChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-4">
            {t('auth.phone')}
          </label>
          <div className="relative">
            <input
              className="w-full p-6 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-black outline-none focus:bg-white focus:border-black transition-all pl-14"
              placeholder="+55 11 99999-9999"
              value={phone}
              onChange={e => onPhoneChange(maskPhone(e.target.value))}
            />
            <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 px-4">
            CPF <span className="text-neutral-300">(opcional para nota fiscal)</span>
          </label>
          <input
            className="w-full p-6 bg-neutral-50 border border-neutral-100 rounded-2xl text-sm font-mono outline-none focus:bg-white focus:border-black transition-all"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={e => onCpfChange(maskCPF(e.target.value))}
            maxLength={14}
          />
        </div>

        <button
          type="submit"
          disabled={isUpdating}
          className="w-full py-6 bg-black text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] shadow-xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
        >
          {isUpdating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <span>{t('auth.save')}</span>
          )}
        </button>
      </form>

      {/* Logout Button */}
      {onLogout && (
        <button
          onClick={handleLogout}
          className="w-full mt-6 py-6 bg-red-50 text-red-500 border border-red-100 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] shadow-sm hover:bg-red-100 hover:border-red-200 transition-all flex items-center justify-center gap-4 active:scale-95"
        >
          <LogOut className="w-5 h-5" />
          <span>{t('auth.logout')}</span>
        </button>
      )}

      {/* Delete Account */}
      {onDeleteAccount && (
        <div className="mt-4">
          {showDeleteConfirm ? (
            <div className="p-6 bg-red-50 border border-red-200 rounded-2xl space-y-4 animate-in fade-in duration-300">
              <p className="text-sm text-red-700 font-medium text-center">
                Tem certeza? Todos os seus dados serao excluidos permanentemente.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 py-4 bg-paper text-neutral-600 border border-neutral-200 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-neutral-50 transition-all active:scale-95 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="flex-1 py-4 bg-red-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-lg hover:bg-red-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Excluir Permanentemente</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-5 bg-paper text-red-400 border border-red-100 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.4em] hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              <span>Excluir Conta</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
