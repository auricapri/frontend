import { useState, useCallback, useEffect, useRef } from 'react';
import { productsApi } from '../api/instances';
import { Product } from '../types';

const SESSION_KEY = 'familia_coupon_code';

export function useFamiliaCoupon() {
  const [activeFamiliaCoupon, setActiveFamiliaCoupon] = useState<string | null>(null);
  const [familiaProducts, setFamiliaProducts] = useState<Product[] | null>(null);
  const [familiaLoading, setFamiliaLoading] = useState(false);
  const [familiaError, setFamiliaError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const activateFamilia = useCallback(async (code: string) => {
    if (!code.trim()) return;
    setFamiliaLoading(true);
    setFamiliaError(null);
    try {
      const products = await productsApi.getAllFamilia();
      if (!isMountedRef.current) return;
      setActiveFamiliaCoupon(code.trim().toUpperCase());
      setFamiliaProducts(products);
      sessionStorage.setItem(SESSION_KEY, code.trim().toUpperCase());
    } catch (err) {
      if (!isMountedRef.current) return;
      const message = err instanceof Error ? err.message : 'Cupom inválido ou acesso não autorizado';
      setFamiliaError(message);
    } finally {
      if (isMountedRef.current) setFamiliaLoading(false);
    }
  }, []);

  const deactivateFamilia = useCallback(() => {
    setActiveFamiliaCoupon(null);
    setFamiliaProducts(null);
    setFamiliaError(null);
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  // Restaurar sessão salva ao montar
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      activateFamilia(saved);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    activeFamiliaCoupon,
    familiaProducts,
    familiaLoading,
    familiaError,
    activateFamilia,
    deactivateFamilia,
    isFamiliaActive: activeFamiliaCoupon !== null,
  };
}
