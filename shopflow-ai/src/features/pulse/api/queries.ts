import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { AI_REFRESH_INTERVAL_MS } from '@/features/ai/constants';
import { getPulseDashboard } from './dashboard.service';

/** Live dashboard payload backing the Pulse command centre. */
export function usePulseDashboard() {
  return useQuery({
    queryKey: [...queryKeys.analytics.all, 'dashboard', 'pulse'] as const,
    queryFn: getPulseDashboard,
    refetchInterval: AI_REFRESH_INTERVAL_MS,
    // The dashboard keeps the previous figures visible while re-fetching.
    placeholderData: (previous) => previous,
  });
}
