import { useMutation, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { AI_REFRESH_INTERVAL_MS } from '../constants';
import { aiService } from './ai.service';
import type { CopilotContext } from '../types';

/**
 * The AI workspace reads a single dashboard payload so switching between
 * views (overview / forecast / customers / products / profit) is instant.
 */
export function useAIDashboard() {
  return useQuery({
    queryKey: queryKeys.ai.insights(),
    queryFn: () => aiService.getDashboard(),
    refetchInterval: AI_REFRESH_INTERVAL_MS,
  });
}

/** Forecast sliced to the selected horizon (7D / 30D / 90D). */
export function useDemandForecast(range: import('../types').ForecastRange) {
  return useQuery({
    queryKey: [...queryKeys.ai.all, 'forecast', range] as const,
    queryFn: () => aiService.getForecast(range),
  });
}

export function useBusinessAlerts() {
  return useQuery({
    queryKey: [...queryKeys.ai.all, 'alerts'] as const,
    queryFn: () => aiService.getAlerts(),
  });
}

/** Mutation powering the copilot chat bubble. */
export function useCopilotChat() {
  return useMutation({
    mutationFn: (context: CopilotContext) => aiService.askCopilot(context),
  });
}
