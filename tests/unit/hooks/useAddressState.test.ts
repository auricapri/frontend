/**
 * Unit tests for useAddressState hook
 *
 * Strategy: test pure logic (CPF validation, CEP masking) directly from utils,
 * and test the hook's state reactions using renderHook + mocks.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Mock external dependencies that useAddressState imports
// ---------------------------------------------------------------------------

// Mock UsersApi so no real HTTP calls happen
vi.mock('../../../src/api/users.api', () => ({
  UsersApi: vi.fn().mockImplementation(() => ({
    getAddresses: vi.fn().mockResolvedValue([]),
  })),
}));

// Mock shipping object passed as param
const shippingMock = {
  calculateLogistics: vi.fn(),
  calculateLogisticsImmediate: vi.fn(),
  resetShipping: vi.fn(),
  selectedShippingOption: null,
  setSelectedShippingOption: vi.fn(),
  bestInternalShipping: null,
  calculatingShipping: false,
  shippingDisplay: null,
  shippingOptions: [],
  expressOption: null,
  selectedVarejoShipping: 'free' as const,
  setSelectedVarejoShipping: vi.fn(),
  selectedVarejoCarrierOption: null,
  setVarejoCarrierOption: vi.fn(),
};

// ---------------------------------------------------------------------------
// Pure utility tests (no hooks needed)
// ---------------------------------------------------------------------------

import { validateCPF, maskCPF, maskCreditCard, maskCep, normalizeCepDigits } from '../../../src/utils/masks';

describe('validateCPF', () => {
  it('accepts a known valid CPF: 529.982.247-25', () => {
    expect(validateCPF('52998224725')).toBe(true);
  });

  it('accepts valid CPF with formatting stripped: 529.982.247-25', () => {
    expect(validateCPF('529.982.247-25')).toBe(true);
  });

  it('rejects all-same-digit CPFs: 111.111.111-11', () => {
    expect(validateCPF('11111111111')).toBe(false);
  });

  it('rejects 000.000.000-00', () => {
    expect(validateCPF('00000000000')).toBe(false);
  });

  it('rejects CPF shorter than 11 digits', () => {
    expect(validateCPF('1234567')).toBe(false);
  });

  it('rejects CPF with wrong check digits', () => {
    // Flip last digit of a valid CPF
    expect(validateCPF('52998224726')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(validateCPF('')).toBe(false);
  });
});

describe('maskCPF', () => {
  it('formats 11 digits as XXX.XXX.XXX-XX', () => {
    expect(maskCPF('52998224725')).toBe('529.982.247-25');
  });

  it('handles empty string', () => {
    expect(maskCPF('')).toBe('');
  });

  it('handles partial input without crashing', () => {
    expect(maskCPF('123')).toBe('123');
    expect(maskCPF('123456')).toBe('123.456');
  });
});

describe('maskCreditCard', () => {
  it('formats 16 digits as XXXX XXXX XXXX XXXX', () => {
    expect(maskCreditCard('4111111111111111')).toBe('4111 1111 1111 1111');
  });

  it('handles partial input', () => {
    expect(maskCreditCard('4111')).toBe('4111');
    expect(maskCreditCard('41111111')).toBe('4111 1111');
  });

  it('strips non-digits', () => {
    expect(maskCreditCard('4111-1111-1111-1111')).toBe('4111 1111 1111 1111');
  });
});

describe('normalizeCepDigits + maskCep', () => {
  it('normalizeCepDigits strips non-digits and limits to 8', () => {
    expect(normalizeCepDigits('01310-100')).toBe('01310100');
    expect(normalizeCepDigits('013101001234')).toBe('01310100');
  });

  it('maskCep formats 8 digits as XXXXX-XXX', () => {
    expect(maskCep('01310100')).toBe('01310-100');
    expect(maskCep('01310-100')).toBe('01310-100');
  });

  it('maskCep handles incomplete CEP without crashing', () => {
    expect(maskCep('0131')).toBe('0131');
    expect(maskCep('')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Hook tests — CEP-triggered fetch behavior
// ---------------------------------------------------------------------------

import { useAddressState } from '../../../src/components/checkout/hooks/useAddressState';

const makeParams = (overrides = {}) => ({
  currentUser: null,
  shipping: shippingMock,
  ...overrides,
});

describe('useAddressState — CEP lookup', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('initial state has empty CEP and no errors', () => {
    const { result } = renderHook(() => useAddressState(makeParams()));
    expect(result.current.cep).toBe('');
    expect(result.current.cepError).toBeNull();
    expect(result.current.address).toBeNull();
  });

  it('handleCepChange masks and stores CEP digits', () => {
    const { result } = renderHook(() => useAddressState(makeParams()));

    act(() => {
      result.current.handleCepChange('01310100');
    });

    // Formatted as XXXXX-XXX
    expect(result.current.cep).toBe('01310-100');
    expect(result.current.cepError).toBeNull();
  });

  it('handleCepChange with invalid short CEP does not trigger fetch', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { result } = renderHook(() => useAddressState(makeParams()));

    act(() => {
      result.current.handleCepChange('0131');
    });

    // Advance timers past debounce
    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('handleCepChange with 8-digit CEP triggers ViaCEP fetch after debounce', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        logradouro: 'Avenida Paulista',
        bairro: 'Bela Vista',
        localidade: 'São Paulo',
        uf: 'SP',
      }),
    } as Response);

    const { result } = renderHook(() => useAddressState(makeParams()));

    act(() => {
      result.current.handleCepChange('01310100');
    });

    // Run debounce timer
    await act(async () => {
      vi.advanceTimersByTime(600);
      // Allow microtasks to flush
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('01310100'),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it('handleCepChange with empty string resets state', () => {
    const { result } = renderHook(() => useAddressState(makeParams()));

    act(() => {
      result.current.handleCepChange('01310100');
    });

    act(() => {
      result.current.handleCepChange('');
    });

    expect(result.current.cep).toBe('');
  });
});

describe('useAddressState — CPF validation', () => {
  it('setCpf with empty string clears error', () => {
    const { result } = renderHook(() => useAddressState(makeParams()));

    act(() => {
      result.current.setCpf('');
    });

    expect(result.current.cpfError).toBeNull();
  });

  it('setCpf with partial digits (< 11) sets "CPF deve ter 11 dígitos"', () => {
    const { result } = renderHook(() => useAddressState(makeParams()));

    act(() => {
      result.current.setCpf('123.456');
    });

    expect(result.current.cpfError).toBe('CPF deve ter 11 dígitos');
  });

  it('setCpf with 11 invalid digits sets "CPF inválido"', () => {
    const { result } = renderHook(() => useAddressState(makeParams()));

    act(() => {
      result.current.setCpf('11111111111');
    });

    expect(result.current.cpfError).toBe('CPF inválido');
  });

  it('setCpf with valid CPF 529.982.247-25 clears error', () => {
    const { result } = renderHook(() => useAddressState(makeParams()));

    act(() => {
      result.current.setCpf('529.982.247-25');
    });

    expect(result.current.cpfError).toBeNull();
    expect(result.current.cpf).toBe('529.982.247-25');
  });
});

describe('useAddressState — updateAddressField', () => {
  it('setNum updates the number field independently', () => {
    const { result } = renderHook(() => useAddressState(makeParams()));

    act(() => {
      result.current.setNum('42');
    });

    expect(result.current.num).toBe('42');
    expect(result.current.complement).toBe('');
  });

  it('setComplement updates complement without affecting num', () => {
    const { result } = renderHook(() => useAddressState(makeParams()));

    act(() => {
      result.current.setNum('100');
      result.current.setComplement('Apto 3B');
    });

    expect(result.current.num).toBe('100');
    expect(result.current.complement).toBe('Apto 3B');
  });

  it('setPhone updates phone field', () => {
    const { result } = renderHook(() => useAddressState(makeParams()));

    act(() => {
      result.current.setPhone('(11) 91234-5678');
    });

    expect(result.current.phone).toBe('(11) 91234-5678');
  });
});
