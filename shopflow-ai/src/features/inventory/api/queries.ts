import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { inventoryService } from './inventory.service';
import { DEFAULT_PRODUCT_FILTERS } from '../constants';
import type {
  BulkStockAdjustmentInput,
  CategoryInput,
  CategoryUpdateInput,
  Product,
  ProductFilters,
  ProductInput,
  ProductUpdateInput,
  StockAdjustmentInput,
  SupplierInput,
  SupplierUpdateInput,
} from '../types';

/* -------------------------------------------------------------------------- */
/*  Query hooks — products                                                    */
/* -------------------------------------------------------------------------- */

/** Paginated product list. The `filters` object is the query key. */
export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: queryKeys.inventory.list(filters as unknown as Record<string, unknown>),
    queryFn: () => inventoryService.products.list(filters),
    placeholderData: (previous) => previous,
  });
}

/** Product + its stock history (drawer detail). */
export function useProductDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.inventory.detail(id ?? 'none'),
    queryFn: () => inventoryService.products.get(id as string),
    enabled: id !== null && id !== '',
  });
}

/* -------------------------------------------------------------------------- */
/*  Query hooks — categories / suppliers / summary                            */
/* -------------------------------------------------------------------------- */

export function useCategories() {
  return useQuery({
    queryKey: [...queryKeys.inventory.all, 'categories'],
    queryFn: () => inventoryService.categories.list(),
  });
}

export function useSuppliers() {
  return useQuery({
    queryKey: [...queryKeys.inventory.all, 'suppliers'],
    queryFn: () => inventoryService.suppliers.list(),
  });
}

/** Analytics: stats, low-stock queue, recent movements, category mix. */
export function useInventorySummary() {
  return useQuery({
    queryKey: [...queryKeys.inventory.all, 'summary'],
    queryFn: () => inventoryService.analytics.summary(),
  });
}

/** Barcode / SKU lookup used by POS-style scanners and the drawer search. */
export function useCodeLookup(code: string | null) {
  return useQuery({
    queryKey: [...queryKeys.inventory.all, 'lookup', code],
    queryFn: () => inventoryService.products.findByCode(code as string),
    enabled: code !== null && code.trim().length >= 4,
  });
}

/* -------------------------------------------------------------------------- */
/*  Mutations — shared invalidation                                           */
/*  Every success invalidates the whole inventory tree so tables, cards,      */
/*  badges and the summary stay consistent without manual wiring.             */
/* -------------------------------------------------------------------------- */

function useInvalidateInventory() {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
}

export function useCreateProduct() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: (input: ProductInput) => inventoryService.products.create(input),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateProduct() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProductUpdateInput }) =>
      inventoryService.products.update(id, input),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteProduct() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: (id: string) => inventoryService.products.remove(id),
    onSuccess: () => invalidate(),
  });
}

export function useAdjustStock() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: (input: StockAdjustmentInput) => inventoryService.products.adjustStock(input),
    onSuccess: () => invalidate(),
  });
}

/* -------------------------------------------------------------------------- */
/*  Mutations — bulk                                                          */
/* -------------------------------------------------------------------------- */

export function useBulkAdjustStock() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: (input: BulkStockAdjustmentInput) =>
      inventoryService.products.bulkAdjustStock(input),
    onSuccess: () => invalidate(),
  });
}

export function useBulkUpdateStatus() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: ({ productIds, status }: { productIds: string[]; status: Product['status'] }) =>
      inventoryService.products.bulkUpdateStatus(productIds, status),
    onSuccess: () => invalidate(),
  });
}

export function useBulkDeleteProducts() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: (productIds: string[]) => inventoryService.products.bulkDelete(productIds),
    onSuccess: () => invalidate(),
  });
}

/* -------------------------------------------------------------------------- */
/*  Mutations — categories & suppliers                                        */
/* -------------------------------------------------------------------------- */

export function useCreateCategory() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: (input: CategoryInput) => inventoryService.categories.create(input),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateCategory() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CategoryUpdateInput }) =>
      inventoryService.categories.update(id, input),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteCategory() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: (id: string) => inventoryService.categories.remove(id),
    onSuccess: () => invalidate(),
  });
}

export function useCreateSupplier() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: (input: SupplierInput) => inventoryService.suppliers.create(input),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateSupplier() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SupplierUpdateInput }) =>
      inventoryService.suppliers.update(id, input),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteSupplier() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: (id: string) => inventoryService.suppliers.remove(id),
    onSuccess: () => invalidate(),
  });
}

export { DEFAULT_PRODUCT_FILTERS };
