import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { purchasesService } from './purchases.service';
import type { GrnFilters, PaymentFilters, PurchaseOrderFilters, PurchaseTrendRange } from '../types';

/* -------------------------------------------------------------------------- */
/*  Query hooks — purchase orders                                             */
/* -------------------------------------------------------------------------- */

export function usePurchaseOrders(filters: PurchaseOrderFilters) {
  return useQuery({
    queryKey: queryKeys.purchases.orders(filters as unknown as Record<string, unknown>),
    queryFn: () => purchasesService.orders.list(filters),
    placeholderData: (previous) => previous,
  });
}

export function usePurchaseOrderDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.purchases.order(id ?? 'none'),
    queryFn: () => purchasesService.orders.get(id as string),
    enabled: id !== null && id !== '',
  });
}

/** Open orders awaiting delivery — sorted by expected date. */
export function usePendingDeliveries() {
  return useQuery({
    queryKey: queryKeys.purchases.deliveries(),
    queryFn: () => purchasesService.orders.deliveries(),
  });
}

export function usePurchaseSuppliers() {
  return useQuery({
    queryKey: queryKeys.purchases.suppliers(),
    queryFn: () => purchasesService.suppliers.list(),
  });
}

/* -------------------------------------------------------------------------- */
/*  Query hooks — GRNs & payments                                             */
/* -------------------------------------------------------------------------- */

export function useGrns(filters: GrnFilters) {
  return useQuery({
    queryKey: queryKeys.purchases.grns(filters as unknown as Record<string, unknown>),
    queryFn: () => purchasesService.grns.list(filters),
    placeholderData: (previous) => previous,
  });
}

export function useSupplierPayments(filters: PaymentFilters) {
  return useQuery({
    queryKey: queryKeys.purchases.payments(filters as unknown as Record<string, unknown>),
    queryFn: () => purchasesService.payments.list(filters),
    placeholderData: (previous) => previous,
  });
}

/* -------------------------------------------------------------------------- */
/*  Query hooks — analytics                                                   */
/* -------------------------------------------------------------------------- */

export function usePurchasesDashboard() {
  return useQuery({
    queryKey: queryKeys.purchases.dashboard(),
    queryFn: () => purchasesService.analytics.dashboard(),
  });
}

export function useSpendTrend(range: PurchaseTrendRange) {
  return useQuery({
    queryKey: queryKeys.purchases.trend(range),
    queryFn: () => purchasesService.analytics.trend(range),
  });
}

export function useSupplierSpend() {
  return useQuery({
    queryKey: [...queryKeys.purchases.all, 'supplier-spend'] as const,
    queryFn: () => purchasesService.analytics.supplierSpend(),
  });
}

export function usePurchaseStatusSplit() {
  return useQuery({
    queryKey: [...queryKeys.purchases.all, 'status-split'] as const,
    queryFn: () => purchasesService.analytics.statusSplit(),
  });
}

/* -------------------------------------------------------------------------- */
/*  Mutations                                                                 */
/* -------------------------------------------------------------------------- */

function useInvalidatePurchases() {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: queryKeys.purchases.all });
}

export function useSendPurchaseOrder() {
  const invalidate = useInvalidatePurchases();
  return useMutation({
    mutationFn: (id: string) => purchasesService.orders.send(id),
    onSuccess: invalidate,
  });
}

export function useMarkOrderInTransit() {
  const invalidate = useInvalidatePurchases();
  return useMutation({
    mutationFn: (id: string) => purchasesService.orders.markInTransit(id),
    onSuccess: invalidate,
  });
}

export function useCreateGrn() {
  const invalidate = useInvalidatePurchases();
  return useMutation({
    mutationFn: purchasesService.grns.create,
    onSuccess: invalidate,
  });
}

export function useRecordSupplierPayment() {
  const invalidate = useInvalidatePurchases();
  return useMutation({
    mutationFn: purchasesService.payments.record,
    onSuccess: invalidate,
  });
}