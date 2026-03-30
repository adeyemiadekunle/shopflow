'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Initialize the query client inside state so it is only created once per component lifecycle
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false, // Default: don't auto-refetch when window refocuses
            retry: 1, // Default: only retry failing requests once
            staleTime: 1000 * 60 * 5, // Default: consider data fresh for 5 minutes
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Devtools will only be included in development bundles by default */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
