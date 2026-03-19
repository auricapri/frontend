/**
 * useAddressState - Manages all address-related state including CEP lookup, saved addresses
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { UsersApi } from '../../../api/users.api';
import { maskCep, maskCPF, normalizeCepDigits, validateCPF } from '../../../utils/masks';
import type { AddressData, SavedAddress, UseAddressStateParams, UseAddressStateReturn } from './types';

export function useAddressState(params: UseAddressStateParams): UseAddressStateReturn {
  const { currentUser, shipping } = params;

  const usersApi = useMemo(() => new UsersApi(), []);

  // CEP state
  const [cep, setCep] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [hasUserEditedCep, setHasUserEditedCep] = useState(false);

  // Address form
  const [address, setAddress] = useState<AddressData | null>(null);
  const [num, setNum] = useState('');
  const [complement, setComplement] = useState('');

  // Contact info
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpfInternal] = useState(currentUser?.cpf || '');
  const [cpfError, setCpfError] = useState<string | null>(null);

  // Wrapper for setCpf that validates
  const setCpf = useCallback((value: string) => {
    setCpfInternal(value);
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) {
      setCpfError(null);
    } else if (digits.length < 11) {
      setCpfError('CPF deve ter 11 dígitos');
    } else if (!validateCPF(digits)) {
      setCpfError('CPF inválido');
    } else {
      setCpfError(null);
    }
  }, []);

  // Saved addresses
  const [userAddresses, setUserAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // Flags
  const [addressLoaded, setAddressLoaded] = useState(false);
  const [isManualAddress, setIsManualAddress] = useState(false);

  // Ref for debounce
  const cepDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update CPF when currentUser changes (e.g., after login or profile update)
  useEffect(() => {
    if (currentUser?.cpf) {
      // Apply mask so field shows formatted CPF (e.g. 000.000.000-00)
      setCpfInternal(maskCPF(currentUser.cpf));
      setCpfError(null);
    }
  }, [currentUser?.cpf]);

  // Pre-fill recipient name from user profile
  useEffect(() => {
    if (currentUser?.full_name && !recipientName) {
      setRecipientName(currentUser.full_name);
    }
  }, [currentUser?.full_name]);

  // Update phone when currentUser changes
  useEffect(() => {
    if (currentUser?.phone && !phone) {
      setPhone(currentUser.phone);
    }
  }, [currentUser?.phone, phone]);

  // Load saved addresses when user is logged in
  useEffect(() => {
    if (currentUser?.id) {
      setLoadingAddresses(true);
      usersApi.getAddresses()
        .then((addresses) => {
          setUserAddresses(addresses || []);
        })
        .catch((err) => {
          // API may not be available yet - fail silently
          console.warn('Could not load addresses (API may not exist yet):', err.message);
          setUserAddresses([]);
        })
        .finally(() => {
          setLoadingAddresses(false);
        });
    }
  }, [currentUser?.id, usersApi]);

  // Handle selecting a saved address
  const handleSelectSavedAddress = useCallback((addressId: string) => {
    if (!addressId) {
      // New address - reset fields
      setSelectedAddressId(null);
      setAddress(null);
      setCep('');
      setNum('');
      setComplement('');
      setAddressLoaded(false);
      setHasUserEditedCep(true);
      shipping.resetShipping();
      return;
    }

    const selected = userAddresses.find(a => a.id === addressId);
    if (selected) {
      setSelectedAddressId(addressId);
      setHasUserEditedCep(true);

      // Extract number from street_address if present
      let extractedNum = '';
      let logradouro = selected.street_address || selected.line1 || '';

      if (logradouro) {
        const commaIndex = logradouro.lastIndexOf(',');
        if (commaIndex > 0) {
          const numPart = logradouro.substring(commaIndex + 1).trim();
          if (numPart && !isNaN(Number(numPart.replace(/\D/g, '')))) {
            extractedNum = numPart.replace(/\D/g, '');
            logradouro = logradouro.substring(0, commaIndex).trim();
          }
        }
      }

      const cepValue = selected.postal_code || '';
      const cleanedCep = cepValue.replace(/\D/g, '');
      const formattedCep = cleanedCep.length === 8
        ? cleanedCep.substring(0, 5) + '-' + cleanedCep.substring(5, 8)
        : cepValue;

      setAddress({
        logradouro: logradouro,
        bairro: selected.neighborhood || selected.line2 || '',
        localidade: selected.city || '',
        uf: selected.state_province || selected.state || '',
        cep: formattedCep,
      });
      setCep(formattedCep);
      if (extractedNum) setNum(extractedNum);
      setAddressLoaded(true);

      if (cleanedCep.length === 8) {
        shipping.calculateLogistics(cleanedCep);
      }
    }
  }, [userAddresses, shipping]);

  // Load WhatsApp prefill data on mount (if no logged-in user with default address)
  useEffect(() => {
    if (address || addressLoaded || hasUserEditedCep) return;
    if (currentUser?.default_address) return; // user's own address takes priority

    try {
      const raw = localStorage.getItem('auricapri_checkout_prefill');
      if (!raw) return;
      const entry = JSON.parse(raw);
      const prefill = entry?.data || entry; // handles both TTL-wrapped and plain
      if (!prefill?.address) return;

      const a = prefill.address;
      const cepValue = (a.postal_code || '').replace(/\D/g, '');
      const formattedCep = cepValue.length === 8
        ? cepValue.substring(0, 5) + '-' + cepValue.substring(5, 8)
        : a.postal_code || '';

      setAddress({
        logradouro: a.street || '',
        bairro: a.neighborhood || '',
        localidade: a.city || '',
        uf: a.state || '',
        cep: formattedCep,
      });
      if (a.number) setNum(a.number);
      if (a.complement) setComplement(a.complement);
      if (formattedCep) setCep(formattedCep);
      setAddressLoaded(true);

      // Pre-fill customer info
      if (prefill.customer) {
        if (prefill.customer.name && !recipientName) setRecipientName(prefill.customer.name);
        if (prefill.customer.phone && !phone) setPhone(prefill.customer.phone);
      }

      // Calculate shipping
      if (cepValue.length === 8) {
        setTimeout(() => shipping.calculateLogistics(cepValue), 100);
      }

      // Clean up prefill after use
      localStorage.removeItem('auricapri_checkout_prefill');
    } catch {
      // Ignore parse errors
    }
  }, [address, addressLoaded, hasUserEditedCep, currentUser?.default_address, shipping]);

  // Load default address on mount
  useEffect(() => {
    if (currentUser?.default_address && !address && !addressLoaded && !hasUserEditedCep) {
      const def = currentUser.default_address;

      let logradouro = '';
      let bairro = '';

      // Use neighborhood field directly if available (new structured data)
      if (def.neighborhood) {
        bairro = def.neighborhood;
        logradouro = def.street_address || def.line1 || '';

        // Extract number from logradouro if present
        if (logradouro) {
          const commaIndex = logradouro.lastIndexOf(',');
          if (commaIndex > 0) {
            const numPart = logradouro.substring(commaIndex + 1).trim();
            if (numPart && !isNaN(Number(numPart.replace(/\D/g, '')))) {
              setNum(numPart.replace(/\D/g, ''));
              logradouro = logradouro.substring(0, commaIndex).trim();
            }
          }
        }
      } else if (def.street_address) {
        // Legacy: parse bairro from street_address (format: "Rua X, Num - Bairro")
        const streetAddr = def.street_address;
        const parts = streetAddr.split(' - ');

        if (parts.length > 0) {
          const firstPart = parts[0];
          const commaIndex = firstPart.lastIndexOf(',');
          if (commaIndex > 0) {
            logradouro = firstPart.substring(0, commaIndex).trim();
            const numPart = firstPart.substring(commaIndex + 1).trim();
            if (numPart && !isNaN(Number(numPart.replace(/\D/g, '')))) {
              setNum(numPart.replace(/\D/g, ''));
            }
          } else {
            logradouro = firstPart.trim();
          }
        }

        if (parts.length > 1) {
          bairro = parts[1].trim();
        }
      } else if (def.line1) {
        logradouro = def.line1.trim();
        bairro = def.line2?.trim() || '';
      }

      if (!logradouro || logradouro.trim() === '') {
        logradouro = def.line1?.trim() || def.street_address?.split(',')[0]?.trim() || '';
      }

      const cepValue = def.postal_code || '';
      const cleanedCep = cepValue ? cepValue.replace(/\D/g, '') : '';
      const formattedCep = cleanedCep.length === 8
        ? cleanedCep.substring(0, 5) + '-' + cleanedCep.substring(5, 8)
        : cepValue;

      const newAddress: AddressData = {
        logradouro: logradouro,
        bairro: bairro,
        localidade: def.city || '',
        uf: def.state_province || def.state || '',
        cep: formattedCep || '',
      };

      setAddress(newAddress);
      setAddressLoaded(true);

      // Also set selectedAddressId if this is the default address
      if (def.id) {
        setSelectedAddressId(def.id);
      }

      if (cleanedCep && cleanedCep.length === 8) {
        setCep(formattedCep);
        setTimeout(() => {
          shipping.calculateLogistics(cleanedCep);
        }, 100);
      }
    }
  }, [address, addressLoaded, currentUser?.default_address, hasUserEditedCep, shipping]);

  // Effect to lookup ViaCEP when CEP is programmatically set but address is incomplete
  useEffect(() => {
    const cleanedCep = cep.replace(/\D/g, '');

    // Conditions to trigger lookup:
    // 1. CEP is complete (8 digits)
    // 2. Address is incomplete (no logradouro OR no bairro)
    // 3. Not already loading
    // 4. Address was loaded (meaning it came from saved data, not user typing)
    const addressIncomplete = !address?.logradouro?.trim() || !address?.bairro?.trim();

    if (
      cleanedCep.length === 8 &&
      addressIncomplete &&
      !loadingCep &&
      addressLoaded
    ) {
      const controller = new AbortController();
      setLoadingCep(true);

      fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`, { signal: controller.signal })
        .then(res => res.json())
        .then(data => {
          if (data.erro) {
            setCepError('CEP não encontrado');
            return;
          }

          // Update address with ViaCEP data
          setAddress({
            logradouro: data.logradouro || '',
            bairro: data.bairro || '',
            localidade: data.localidade || '',
            uf: data.uf || '',
            cep: cep,
          });
          setCepError(null);

          // Calculate shipping
          shipping.calculateLogistics(cleanedCep);
        })
        .catch(err => {
          if (err?.name === 'AbortError') return;
          setCepError('Erro ao consultar CEP');
        })
        .finally(() => {
          setLoadingCep(false);
        });

      return () => controller.abort();
    }
  }, [cep, address?.logradouro, address?.bairro, loadingCep, addressLoaded, shipping]);

  // Handle CEP change with debounce and ViaCEP lookup
  const handleCepChange = useCallback((val: string) => {
    setHasUserEditedCep(true);
    const cleaned = normalizeCepDigits(val);
    const formatted = cleaned ? maskCep(cleaned) : '';
    setCep(formatted);
    setCepError(null);

    // Clear previous debounce
    if (cepDebounceRef.current) {
      clearTimeout(cepDebounceRef.current);
      cepDebounceRef.current = null;
    }

    // Only clear address if CEP is completely empty AND no address selected
    if (cleaned.length === 0) {
      if (!selectedAddressId && !address) {
        setAddress(null);
        setIsManualAddress(false);
        shipping.resetShipping();
      }
      return;
    }

    // Don't clear existing address while user types - wait for complete CEP
    if (cleaned.length < 8) {
      return;
    }

    // Complete CEP: debounce 500ms before lookup with 3s timeout
    if (cleaned.length === 8) {
      setLoadingCep(true);
      cepDebounceRef.current = setTimeout(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

        try {
          const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`, {
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (!res.ok) throw new Error('CEP lookup failed');
          const data = await res.json();
          if (data.erro) throw new Error('CEP not found');
          // If bairro is empty, leave it empty for user to fill
          setAddress({
            ...data,
            bairro: data.bairro?.trim() || ''
          });
          setIsManualAddress(false);
          shipping.calculateLogistics(cleaned);
        } catch (err: any) {
          clearTimeout(timeoutId);
          // Check if it was a timeout
          if (err?.name === 'AbortError') {
            setCepError('Tempo esgotado. Preencha manualmente.');
            setIsManualAddress(true);
            setAddress({
              logradouro: '',
              bairro: '',
              localidade: '',
              uf: '',
              cep: formatted,
            });
            setLoadingCep(false);
            return;
          }

          // Try fallback API with timeout
          const controller2 = new AbortController();
          const timeoutId2 = setTimeout(() => controller2.abort(), 3000);
          try {
            const resFallback = await fetch(`https://cep.awesomeapi.com.br/json/${cleaned}`, {
              signal: controller2.signal
            });
            clearTimeout(timeoutId2);
            if (!resFallback.ok) throw new Error('Fallback failed');
            const dataFallback = await resFallback.json();
            // If bairro is empty, leave it empty for user to fill
            setAddress({
              logradouro: dataFallback.address || '',
              bairro: dataFallback.district || dataFallback.address_name || '',
              localidade: dataFallback.city || '',
              uf: dataFallback.state || '',
            });
            setIsManualAddress(false);
            shipping.calculateLogistics(cleaned);
          } catch (err2: any) {
            clearTimeout(timeoutId2);
            // Fallback to manual entry
            setCepError(err2?.name === 'AbortError' ? 'Tempo esgotado. Preencha manualmente.' : 'CEP não encontrado. Preencha manualmente.');
            setIsManualAddress(true);
            setAddress({
              logradouro: '',
              bairro: '',
              localidade: '',
              uf: '',
              cep: formatted,
            });
          }
        } finally {
          setLoadingCep(false);
        }
      }, 500);
    }
  }, [selectedAddressId, address, shipping]);

  return {
    // CEP state
    cep,
    setCep,
    loadingCep,
    cepError,
    handleCepChange,

    // Address form
    address,
    setAddress,
    num,
    setNum,
    complement,
    setComplement,

    // Contact info
    recipientName,
    setRecipientName,
    phone,
    setPhone,
    cpf,
    setCpf,
    cpfError,

    // Saved addresses
    userAddresses,
    selectedAddressId,
    loadingAddresses,
    handleSelectSavedAddress,

    // Flags
    addressLoaded,
    setAddressLoaded,
    isManualAddress,
    setIsManualAddress,
    hasUserEditedCep,
  };
}
