import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { salesService } from './sales.service';
import type {
  SalesDateRange,
  SalesFilters,
  SalesReturnFilters,
} from '../types';

/* -------------------------------------------------------------------------- */
/*  Query hooks — invoices                                                    */
/* -------------------------------------------------------------------------- */

export function useInvoices(filters: SalesFilters) {
  return useQuery({
    queryKey: queryKeys.sales.invoices(filters as unknown as Record<string, unknown>),
    queryFn: () => salesService.invoices.list(filters),
    placeholderData: (previous) => previous,
  });
}

export function useInvoiceDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.sales.invoice(id ?? 'none'),
    queryFn: () => salesService.invoices.get(id as string),
    enabled: id !== null && id !== '',
  });
}

export function useRecentInvoices(limit: number) {
  return useQuery({
    queryKey: [...queryKeys.sales.all, 'recent', limit] as const,
    queryFn: () => salesService.invoices.recent(limit),
  });
}

/* -------------------------------------------------------------------------- */
/*  Query hooks — returns                                                     */
/* -------------------------------------------------------------------------- */

export function useSalesReturns(filters: SalesReturnFilters) {
  return useQuery({
    queryKey: queryKeys.sales.returns(filters as unknown as Record<string, unknown>),
    queryFn: () => salesService.returns.list(filters),
    placeholderData: (previous) => previous,
  });
}

/* -------------------------------------------------------------------------- */
/*  Query hooks — analytics                                                   */
/* -------------------------------------------------------------------------- */

export function useSalesDashboard() {
  return useQuery({
    queryKey: queryKeys.sales.dashboard(),
    queryFn: () => salesService.analytics.dashboard(),
  });
}

export function useSalesTrend(range: SalesDateRange) {
  return useQuery({
    queryKey: queryKeys.sales.trend(range),
    queryFn: () => salesService.analytics.trend(range),
  });
}

export function useTopProducts(range: SalesDateRange) {
  return useQuery({
    queryKey: queryKeys.sales.topProducts(range),
    queryFn: () => salesService.analytics.topProducts(range),
  });
}

export function useChannelSplit(range: SalesDateRange) {
  return useQuery({
    queryKey: queryKeys.sales.channels(range),
    queryFn: () => salesService.analytics.channels(range),
  });
}

/* -------------------------------------------------------------------------- */
/*  Mutations                                                                 */
/* -------------------------------------------------------------------------- */

function useInvalidateSales() {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: queryKeys.sales.all });
}

/** Processes a pending refund and refreshes invoices, returns and stats. */
export function useProcessRefund() {
  const invalidate = useInvalidateSales();
  return useMutation({
    mutationFn: (id: string) => salesService.returns.process(id),
    onSuccess: invalidate,
  });
}