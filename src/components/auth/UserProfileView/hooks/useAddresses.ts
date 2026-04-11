/// useAddresses Hook
/// Manages user addresses state and actions

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SavedAddress, UserProfile } from '../../../../types';
import { AddressesState } from '../types';

export interface NewAddressData {
  street_address: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state_province: string;
  postal_code: string;
  recipient_name?: string;
  set_as_primary?: boolean;
}

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

  const handleCreateAddress = useCallback(async (data: NewAddressData): Promise<boolean> => {
    try {
      const { UsersApi } = await import('../../../../api/users.api');
      const usersApi = new UsersApi();
      const setAsPrimary = data.set_as_primary || addresses.length === 0;
      const newAddress = await usersApi.createAddress({
        line1: `${data.street_address}${data.number ? `, ${data.number}` : ''}`,
        line2: data.complement || undefined,
        neighborhood: data.neighborhood || undefined,
        city: data.city,
        state: data.state_province,
        postal_code: data.postal_code,
        country: 'BR',
        is_default: setAsPrimary,
      });
      // If marking as primary explicitly, ensure all others are unset via the dedicated endpoint
      if (setAsPrimary && newAddress?.id && addresses.length > 0) {
        await usersApi.setDefaultAddress(newAddress.id);
      }
      await queryClient.invalidateQueries({ queryKey: ['user-addresses', userId] });
      return true;
    } catch (err: unknown) {
      alert(`Erro ao salvar endereço: ${(err as Error).message}`);
      return false;
    }
  }, [addresses.length, queryClient, userId]);

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
    handleCreateAddress,
  };
};
