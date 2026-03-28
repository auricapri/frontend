import { useState, useCallback, useEffect, useRef } from 'react';
import { productsApi } from '../api/instances';
import { Product } from '../types';

const SESSION_KEY = 'familia_coupon_code';

/**
 * @param userId - passa o userId do currentUser quando disponível.
 *                 O restauro automático do sessionStorage só ocorre
 *                 quando o userId está confirmado (evita erro 401 de
 *                 race condition entre Supabase auth init e mount do hook).
 */
export function useFamiliaCoupon(userId?: string | null) {
  const [activeFamiliaCoupon, setActiveFamiliaCoupon] = useState<string | null>(null);
  const [familiaProducts, setFamiliaProducts] = useState<Product[] | null>(null);
  const [familiaLoading, setFamiliaLoading] = useState(false);
  const [familiaError, setFamiliaError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const restoredRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const activateFamilia = useCallback(async (code: string) => {
    if (!code.trim()) return;

    // Check auth before hitting the backend (avoids "Missing or invalid authorization header")
    const { supabase } = await import('../utils/supabase');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      if (isMountedRef.current) {
        setFamiliaError('Faça login para acessar os preços exclusivos.');
      }
      return;
    }

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

  // Restaurar sessão salva — mas apenas quando o userId estiver confirmado.
  // Sem userId, Supabase ainda não inicializou a sessão e o getAuthToken()
  // retorna null, causando "Missing or invalid authorization header".
  useEffect(() => {
    if (!userId || restoredRef.current) return;
    restoredRef.current = true;
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      activateFamilia(saved);
    }
  }, [userId, activateFamilia]);

  // Se o usuário fez logout, desativar o familia e limpar sessionStorage
  useEffect(() => {
    if (userId === null && activeFamiliaCoupon) {
      deactivateFamilia();
      restoredRef.current = false;
    }
  }, [userId, activeFamiliaCoupon, deactivateFamilia]);

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
