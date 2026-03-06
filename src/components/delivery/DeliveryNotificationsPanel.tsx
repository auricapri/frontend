import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, RefreshCw } from 'lucide-react';
import { notificationsApi } from '../../api/instances';
import { type Notification } from '../../api/notifications.api';
import { supabase } from '../../utils/supabase';

// Throttle helper — used only for the real-time subscription callback
function useThrottle<T extends (...args: any[]) => any>(fn: T, delay: number): T {
  const lastRun = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastRun = now - lastRun.current;

    if (timeSinceLastRun >= delay) {
      lastRun.current = now;
      return fn(...args);
    } else {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        lastRun.current = Date.now();
        fn(...args);
      }, delay - timeSinceLastRun);
    }
  }, [fn, delay]) as T;
}

export function DeliveryNotificationsPanel() {
  const [userId, setUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: items = [], isLoading, error, refetch } = useQuery<Notification[]>({
    queryKey: ['delivery', 'notifications'],
    queryFn: () => notificationsApi.getAll(false),
    staleTime: 30 * 1000,
  });

  const throttledRefetch = useThrottle(refetch, 2000);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);

  // Real-time Supabase subscription — triggers a throttled refetch on changes
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`delivery-notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => throttledRefetch()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [throttledRefetch, userId]);

  const markRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      queryClient.setQueryData<Notification[]>(['delivery', 'notifications'], (prev) =>
        (prev ?? []).map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {
      return;
    }
  };

  const markAll = async () => {
    try {
      await notificationsApi.markAllAsRead();
      queryClient.setQueryData<Notification[]>(['delivery', 'notifications'], (prev) =>
        (prev ?? []).map((n) => ({ ...n, is_read: true }))
      );
    } catch {
      return;
    }
  };

  const unreadCount = items.filter((n) => !n.is_read).length;

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
      <div className="p-5 border-b border-neutral-100 flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Notificações</div>
          <div className="text-sm text-neutral-700 mt-1">{unreadCount ? `${unreadCount} não lidas` : 'Tudo lido'}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="p-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 active:scale-[0.99] transition-all"
            aria-label="Atualizar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={markAll}
            className="px-4 py-3 rounded-xl bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 active:scale-[0.99] transition-all"
          >
            Marcar tudo
          </button>
        </div>
      </div>

      {error ? (
        <div className="p-5 text-sm text-red-700">{(error as Error).message || 'Falha ao carregar notificações'}</div>
      ) : null}

      {isLoading ? (
        <div className="p-8 text-center text-sm text-neutral-500">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center">
          <Bell className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <div className="text-sm font-medium text-neutral-600">Sem notificações</div>
        </div>
      ) : (
        <div className="max-h-[calc(100vh-260px)] overflow-auto">
          {items.map((n) => (
            <div key={n.id} className="p-5 border-b border-neutral-50">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className={
                    `text-sm font-black uppercase tracking-tight truncate ` +
                    (n.is_read ? 'text-neutral-700' : 'text-black')
                  }>
                    {typeof n.title === 'string' ? n.title : (n.title?.pt || n.title?.en || 'Notificação')}
                  </div>
                  {n.content ? (
                    <div className="text-xs text-neutral-600 mt-1">
                      {typeof n.content === 'string' ? n.content : (n.content?.pt || n.content?.en || '')}
                    </div>
                  ) : null}
                  <div className="text-[10px] text-neutral-400 mt-2">{new Date(n.created_at).toLocaleString('pt-BR')}</div>
                </div>
                {!n.is_read ? (
                  <button
                    type="button"
                    onClick={() => markRead(n.id)}
                    className="px-3 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 active:scale-[0.99] transition-all text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Lida
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
