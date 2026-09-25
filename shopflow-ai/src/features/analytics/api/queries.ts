import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { ANALYTICS_REFRESH_INTERVAL_MS } from '../constants';
import { analyticsService } from './analytics.service';
import type { AnalyticsFilters } from '../types';

/** One request backs the whole dashboard; cards filter client-side. */
export function useAnalyticsDashboard(filters: AnalyticsFilters) {
  return useQuery({
    queryKey: queryKeys.analytics.dashboard({ ...filters }),
    queryFn: () => analyticsService.getDashboard(filters),
    refetchInterval: ANALYTICS_REFRESH_INTERVAL_MS,
  });
}
