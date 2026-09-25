import { useCallback, useMemo, useState } from 'react';
import { useDebouncedValue } from '@/hooks';
import { DEFAULT_PRODUCT_FILTERS, type ProductSortValue } from '../constants';
import type { ProductFilters, ProductSortField, ProductStatus, SortDirection, StockStatus } from '../types';
import type { ProductsTableFilterState } from '../components/ProductsTable';

/**
 * Table filter state for the product tables.
 *
 * Keeps the *immediate* input values (`ui`) separate from the *query-ready*
 * filter object (`filters`) so typing in the search box never blocks rendering
 * while still producing a stable TanStack Query cache key.
 */
export interface UseProductFiltersReturn {
  /** Immediate control values bound to the table inputs. */
  ui: ProductsTableFilterState & { page: number; pageSize: number };
  /** Debounced, service-layer ready payload. */
  filters: ProductFilters;
  /** True when anything other than the sort order deviates from defaults. */
  isFiltered: boolean;
  patch: (patch: Partial<ProductsTableFilterState>) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  clear: () => void;
}

const SORT_DELIMITER = ':';

export function useProductFilters(
  initial?: Partial<ProductsTableFilterState>,
): UseProductFiltersReturn {
  const [ui, setUi] = useState({
    search: initial?.search ?? '',
    status: initial?.status ?? ('all' as ProductStatus | 'all'),
    stockStatus: initial?.stockStatus ?? ('all' as StockStatus | 'all'),
    categoryId: initial?.categoryId ?? '',
    supplierId: initial?.supplierId ?? '',
    sortValue: initial?.sortValue ?? `${DEFAULT_PRODUCT_FILTERS.sortBy}:${DEFAULT_PRODUCT_FILTERS.sortDirection}` as ProductSortValue,
    page: DEFAULT_PRODUCT_FILTERS.page,
    pageSize: DEFAULT_PRODUCT_FILTERS.pageSize,
  });

  const debouncedSearch = useDebouncedValue(ui.search, 300);

  const patch = useCallback((next: Partial<ProductsTableFilterState>) => {
    setUi((previous) => ({ ...previous, ...next, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setUi((previous) => ({ ...previous, page }));
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    setUi((previous) => ({ ...previous, pageSize, page: 1 }));
  }, []);

  const clear = useCallback(() => {
    setUi((previous) => ({
      ...previous,
      search: '',
      status: 'all',
      stockStatus: 'all',
      categoryId: '',
      supplierId: '',
      page: 1,
    }));
  }, []);

  const filters = useMemo<ProductFilters>(() => {
    const [sortBy, sortDirection] = ui.sortValue.split(SORT_DELIMITER) as [
      ProductSortField,
      SortDirection,
    ];
    return {
      search: debouncedSearch.trim(),
      categoryIds: ui.categoryId ? [ui.categoryId] : [],
      supplierIds: ui.supplierId ? [ui.supplierId] : [],
      status: ui.status,
      stockStatus: ui.stockStatus,
      page: ui.page,
      pageSize: ui.pageSize,
      sortBy,
      sortDirection,
    };
  }, [
    debouncedSearch,
    ui.categoryId,
    ui.supplierId,
    ui.status,
    ui.stockStatus,
    ui.page,
    ui.pageSize,
    ui.sortValue,
  ]);

  const isFiltered =
    ui.categoryId !== '' ||
    ui.supplierId !== '' ||
    ui.status !== 'all' ||
    ui.stockStatus !== 'all' ||
    ui.search.trim() !== '';

  return { ui, filters, isFiltered, patch, setPage, setPageSize, clear };
}

export default useProductFilters;
