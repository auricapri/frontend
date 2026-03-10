/// useAddresses Hook
/// Manages user addresses state and actions

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SavedAddress, UserProfile } from '../../../../types';
import { AddressesState } from '../types';

interface UseAddressesParams {
  userId: string;
  onUpdate: (user: UserProfile) => void;
  enabled?: boolean;
}

export const useAddresses = ({ userId, onUpdate, enabled = false }: UseAddressesParams) => {
  const queryClient = useQueryClient();
  const [settingDefault, setSettingDefault] = useState<string | null>(null);
  const [deletingAddress, setDeletingAddress] = useState<string | null>(null);

  const { data: addresses = [], isLoading: loading, refetch: fetchAddresses } = useQuery<SavedAddress[]>({
    queryKey: ['user-addresses', userId],
    queryFn: async () => {
      const { UsersApi } = await import('../../../../api/users.api');
      const usersApi = new UsersApi();
      return usersApi.getAddresses();
    },
    enabled,
    staleTime: 2 * 60 * 1000,
  });

  const handleSetDefaultAddress = async (addressId: string) => {
    setSettingDefault(addressId);
    try {
      const { UsersApi } = await import('../../../../api/users.api');
      const usersApi = new UsersApi();
      await usersApi.setDefaultAddress(addressId);
      await queryClient.invalidateQueries({ queryKey: ['user-addresses', userId] });
      const profile = await usersApi.getProfile(userId);
      if (profile) onUpdate(profile);
    } catch (err: unknown) {
      alert(`Erro ao definir endereço padrão: ${(err as Error).message}`);
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
      await queryClient.invalidateQueries({ queryKey: ['user-addresses', userId] });
    } catch (err: unknown) {
      alert(`Erro ao excluir endereço: ${(err as Error).message}`);
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
