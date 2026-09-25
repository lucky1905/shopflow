import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { posService } from './pos.service';
import type {
  CatalogSearch,
  CheckoutInput,
  HoldCartInput,
  PosCustomerInput,
  ReturnInput,
  SaleFilters,
} from '../types';

/* -------------------------------------------------------------------------- */
/*  Query hooks — catalog                                                     */
/* -------------------------------------------------------------------------- */

/** Debounced product search for the POS grid (barcode / SKU / name). */
export function useCatalogSearch(search: CatalogSearch) {
  return useQuery({
    queryKey: [...queryKeys.pos.all, 'products', search.query, search.categoryId ?? 'all'],
    queryFn: () => posService.catalog.search(search),
    placeholderData: (previous) => previous,
  });
}

export function usePosCatalogCategories() {
  return useQuery({
    queryKey: [...queryKeys.pos.all, 'categories'],
    queryFn: () => posService.catalog.categories(),
  });
}

/**
 * Exact code lookup used when the cashier hits Enter (barcode scanner or a
 * full SKU). Runs as a mutation so the add happens the moment Enter is pressed.
 */
export function useLookupProduct() {
  return useMutation({
    mutationFn: (code: string) => posService.catalog.lookup(code),
  });
}

/* -------------------------------------------------------------------------- */
/*  Query hooks — customers                                                   */
/* -------------------------------------------------------------------------- */

export function usePosCustomerList(search = '') {
  return useQuery({
    queryKey: [...queryKeys.pos.all, 'customers', search],
    queryFn: () => posService.customers.list(search),
  });
}

export function useCreatePosCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PosCustomerInput) => posService.customers.create(input),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.pos.all }),
  });
}

/* -------------------------------------------------------------------------- */
/*  Query hooks — sales, history & returns                                    */
/* -------------------------------------------------------------------------- */

export function useSalesHistory(filters: SaleFilters) {
  return useQuery({
    queryKey: [...queryKeys.pos.all, 'sales', filters.search, filters.page, filters.pageSize],
    queryFn: () => posService.sales.list(filters),
    placeholderData: (previous) => previous,
  });
}

export function useSaleDetail(id: string | null) {
  return useQuery({
    queryKey: [...queryKeys.pos.all, 'detail', id ?? 'none'],
    queryFn: () => posService.sales.get(id as string),
    enabled: id !== null && id !== '',
  });
}

/** Per-line returnable quantities for the return flow. */
export function useReturnableLines(saleId: string | null) {
  return useQuery({
    queryKey: [...queryKeys.pos.all, 'returnable', saleId ?? 'none'],
    queryFn: () => posService.returns.returnable(saleId as string),
    enabled: saleId !== null && saleId !== '',
  });
}

/* -------------------------------------------------------------------------- */
/*  Query hooks — held carts, recommendations, summary                        */
/* -------------------------------------------------------------------------- */

export function useHeldCarts() {
  return useQuery({
    queryKey: [...queryKeys.pos.all, 'holds'],
    queryFn: () => posService.holds.list(),
  });
}

/** AI / affinity suggestions for the current basket (popular when empty). */
export function usePosRecommendations(productIds: string[]) {
  const signature = [...productIds].sort().join(',');
  return useQuery({
    queryKey: [...queryKeys.pos.all, 'recommendations', signature],
    queryFn: () => posService.ai.recommendations(productIds),
  });
}

/** Today's till summary shown in the POS header. */
export function usePosSummary() {
  return useQuery({
    queryKey: [...queryKeys.pos.all, 'summary'],
    queryFn: () => posService.summary.get(),
  });
}

/* -------------------------------------------------------------------------- */
/*  Mutations — checkout, holds, returns                                      */
/* -------------------------------------------------------------------------- */

/** Checkout touches both POS history and inventory stock — invalidate both. */
function useInvalidatePosAndInventory() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.pos.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
  };
}

export function useCheckoutSale() {
  const invalidate = useInvalidatePosAndInventory();
  return useMutation({
    mutationFn: (input: CheckoutInput) => posService.sales.checkout(input),
    onSuccess: invalidate,
  });
}

export function useSaveHeldCart() {
  const invalidate = useInvalidatePosAndInventory();
  return useMutation({
    mutationFn: (input: HoldCartInput) => posService.holds.save(input),
    onSuccess: invalidate,
  });
}

export function useDeleteHeldCart() {
  const invalidate = useInvalidatePosAndInventory();
  return useMutation({
    mutationFn: (id: string) => posService.holds.remove(id),
    onSuccess: invalidate,
  });
}

export function useProcessReturn() {
  const invalidate = useInvalidatePosAndInventory();
  return useMutation({
    mutationFn: (input: ReturnInput) => posService.returns.create(input),
    onSuccess: invalidate,
  });
}