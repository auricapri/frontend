/// useAddresses Hook
/// Manages user addresses state and actions

import { useState, useCallback } from 'react';
import { SavedAddress, UserProfile } from '../../../../types';
import { AddressesState } from '../types';

interface UseAddressesParams {
  userId: string;
  onUpdate: (user: UserProfile) => void;
}

export const useAddresses = ({ userId, onUpdate }: UseAddressesParams) => {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [settingDefault, setSettingDefault] = useState<string | null>(null);
  const [deletingAddress, setDeletingAddress] = useState<string | null>(null);

  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    try {
      const { UsersApi } = await import('../../../../api/users.api');
      const usersApi = new UsersApi();
      const fetchedAddresses = await usersApi.getAddresses();
      setAddresses(fetchedAddresses);
    } catch (err: any) {
      console.error('Erro ao buscar endereços:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSetDefaultAddress = async (addressId: string) => {
    setSettingDefault(addressId);
    try {
      const { UsersApi } = await import('../../../../api/users.api');
      const usersApi = new UsersApi();
      await usersApi.setDefaultAddress(addressId);
      // Refresh addresses and user profile
      await fetchAddresses();
      // Update the user's default_address_id in parent
      const profile = await usersApi.getProfile(userId);
      if (profile) onUpdate(profile);
    } catch (err: any) {
      alert(`Erro ao definir endereço padrão: ${err.message}`);
    } finally {
      setSettingDefault(null);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Tem certeza que deseja excluir este endereço?')) return;
    setDeletingAddress(addressId);
    try {
      const { UsersApi } = await import('../../../../api/users.api');
      const usersApi = new UsersApi();
      await usersApi.deleteAddress(addressId);
      await fetchAddresses();
    } catch (err: any) {
      alert(`Erro ao excluir endereço: ${err.message}`);
    } finally {
      setDeletingAddress(null);
    }
  };

  const addressesState: AddressesState = {
    addresses,
    loading,
    settingDefault,
    deletingAddress,
  };

  return {
    addressesState,
    fetchAddresses,
    handleSetDefaultAddress,
    handleDeleteAddress,
  };
};
