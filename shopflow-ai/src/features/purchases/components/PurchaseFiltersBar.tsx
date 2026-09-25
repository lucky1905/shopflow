import { FilterBar } from '@/components/common/FilterBar';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DEFAULT_PURCHASE_FILTERS, PURCHASE_STATUS_OPTIONS, SUPPLIER_PAYMENT_STATUS_OPTIONS } from '../constants';
import { usePurchaseSuppliers } from '../api';
import { usePurchaseFiltersStore } from '../hooks';
import type { PurchaseOrderFilters } from '../types';

function activeCount(filters: PurchaseOrderFilters): number {
  let count = 0;
  if (filters.status !== DEFAULT_PURCHASE_FILTERS.status) count += 1;
  if (filters.supplierId !== 'all') count += 1;
  if (filters.paymentStatus !== 'all') count += 1;
  if (filters.dateFrom || filters.dateTo) count += 1;
  return count;
}

/**
 * Advanced filter panel for purchase-order tables: lifecycle status, supplier,
 * payment state and date bounds. State lives in the persisted Zustand store.
 */
export function PurchaseFiltersBar() {
  const filters = usePurchaseFiltersStore();
  const patch = usePurchaseFiltersStore((state) => state.patch);
  const reset = usePurchaseFiltersStore((state) => state.reset);
  const suppliers = usePurchaseSuppliers();

  const supplierOptions = [
    { value: 'all', label: 'All suppliers' },
    ...(suppliers.data ?? []).map((supplier) => ({
      value: supplier.id,
      label: supplier.name,
    })),
  ];

  return (
    <FilterBar activeCount={activeCount(filters)} onReset={reset} label="Advanced filters">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          aria-label="Order status"
          value={filters.status}
          onChange={(event) =>
            patch({ status: event.target.value as PurchaseOrderFilters['status'], page: 1 })
          }
          options={PURCHASE_STATUS_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          className="h-9 text-sm"
        />
        <Select
          aria-label="Supplier"
          value={filters.supplierId}
          onChange={(event) => patch({ supplierId: event.target.value, page: 1 })}
          options={supplierOptions}
          className="h-9 text-sm"
        />
        <Select
          aria-label="Payment status"
          value={filters.paymentStatus}
          onChange={(event) =>
            patch({
              paymentStatus: event.target.value as PurchaseOrderFilters['paymentStatus'],
              page: 1,
            })
          }
          options={SUPPLIER_PAYMENT_STATUS_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          className="h-9 text-sm"
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="date"
            aria-label="From date"
            value={filters.dateFrom}
            onChange={(event) => patch({ dateFrom: event.target.value, page: 1 })}
            className="h-9 text-sm"
          />
          <Input
            type="date"
            aria-label="To date"
            value={filters.dateTo}
            onChange={(event) => patch({ dateTo: event.target.value, page: 1 })}
            className="h-9 text-sm"
          />
        </div>
      </div>
    </FilterBar>
  );
}

export default PurchaseFiltersBar;