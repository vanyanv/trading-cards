'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback, useRef } from 'react';
import { queryKeys } from '@/lib/query/queryKeys';
import { fetchCardDetail, fetchPackDetail } from '@/lib/query/fetchers';

export function usePrefetchCardOnHover() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const prefetchedRef = useRef(new Set<string>());

  return useCallback((cardId: string) => {
    if (prefetchedRef.current.has(cardId)) return;
    prefetchedRef.current.add(cardId);

    queryClient.prefetchQuery({
      queryKey: queryKeys.cards.detail(cardId),
      queryFn: () => fetchCardDetail(cardId),
      staleTime: 5 * 60 * 1000,
    });
    router.prefetch(`/card/${cardId}`);
  }, [queryClient, router]);
}

export function usePrefetchPackOnHover() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const prefetchedRef = useRef(new Set<string>());

  return useCallback((packId: string) => {
    if (prefetchedRef.current.has(packId)) return;
    prefetchedRef.current.add(packId);

    queryClient.prefetchQuery({
      queryKey: queryKeys.packDetail(packId),
      queryFn: () => fetchPackDetail(packId),
      staleTime: 5 * 60 * 1000,
    });
    router.prefetch(`/pack-opening/${packId}`);
  }, [queryClient, router]);
}
