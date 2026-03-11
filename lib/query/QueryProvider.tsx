'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useRef } from 'react';
import { makeQueryClient } from './queryClient';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const clientRef = useRef(makeQueryClient());
  return (
    <QueryClientProvider client={clientRef.current}>
      {children}
    </QueryClientProvider>
  );
}
