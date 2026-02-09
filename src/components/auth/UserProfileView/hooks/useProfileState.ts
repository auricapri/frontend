/// useProfileState Hook
/// Manages profile form state and update logic

import { useState, useEffect } from 'react';
import { UserProfile } from '../../../../types';
import { Locale } from '../../../../i18n';
import { ProfileFormState, GetLocFn } from '../types';

export const getPhonePrefix = (locale: Locale): string => {
  switch (locale) {
    case 'pt': return '+55 ';
    case 'en': return '+1 ';
    case 'es': return '+34 ';
    case 'fr': return '+33 ';
    default: return '';
  }
};

export const createGetLoc = (locale: Locale): GetLocFn => {
  return (obj: any): string => {
    if (!obj) return "";
    if (typeof obj === 'string') return obj;
    return obj[locale] || obj['pt'] || obj['en'] || Object.values(obj)[0] || "";
  };
};

interface UseProfileStateParams {
  user: UserProfile;
  locale: Locale;
  onUpdate: (user: UserProfile) => void;
}

export const useProfileState = ({ user, locale, onUpdate }: UseProfileStateParams) => {
  const [fullName, setFullName] = useState(user.full_name);
  const [phone, setPhone] = useState(user.phone || getPhonePrefix(locale));
  const [cpf, setCpf] = useState(user.cpf || '');
  const [isUpdating, setIsUpdating] = useState(false);

  // Update phone prefix when locale changes
  useEffect(() => {
    if (!user.phone) {
      const currentVal = phone.trim();
      const prefixes = ['+55', '+1', '+34', '+33'];
      if (currentVal === '' || prefixes.includes(currentVal)) {
        setPhone(getPhonePrefix(locale));
      }
    }
  }, [locale, user.phone]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const { UsersApi } = await import('../../../../api/users.api');
      const usersApi = new UsersApi();
      const updatedProfile = await usersApi.updateProfile({
        full_name: fullName,
        phone,
        cpf
      });

      onUpdate(updatedProfile);
      alert('Perfil atualizado com sucesso.');
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    formState: { fullName, phone, cpf, isUpdating } as ProfileFormState,
    setFullName,
    setPhone,
    setCpf,
    handleUpdateProfile,
  };
};
