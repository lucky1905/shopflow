import { useState } from 'react';
import { useDebouncedValue } from '@/hooks';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionCard } from '@/components/common/SectionCard';
import { FilterBar } from '@/components/common/FilterBar';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Badge } from '@/components/common/Badge';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/utils/format';
import { PurchasesHeader, RecordPaymentModal } from '../components';
import { usePurchaseSuppliers, useSupplierPayments } from '../api';
import { SUPPLIER_PAYMENT_STATUS_META, SUPPLIER_PAYMENT_STATUS_OPTIONS } from '../constants';
import { usePaymentFiltersStore } from '../hooks';
import type { SupplierPaymentRow, SupplierPaymentStatus } from '../types';

/** Supplier payment status: balances, due dates and payment recording. */
export function SupplierPaymentsPage() {
  const filters = usePaymentFiltersStore();
  const patch = usePaymentFiltersStore((state) => state.patch);
  const reset = usePaymentFiltersStore((state) => state.reset);
  const debouncedSearch = useDebouncedValue(filters.search, 250);

  const query = useSupplierPayments({ ...filters, search: debouncedSearch });
  const suppliers = usePurchaseSuppliers();
  const [target, setTarget] = useState<SupplierPaymentRow | null>(null);

  const activeCount =
    (filters.status !== 'all' ? 1 : 0) + (filters.supplierId !== 'all' ? 1 : 0);

  const columns: DataTableColumn<SupplierPaymentRow>[] = [
    {
      key: 'poNumber',
      header: 'Order',
      render: (row) => <span className="font-semibold text-primary">{row.poNumber}</span>,
    },
    { key: 'supplierName', header: 'Supplier', sortable: true },
    {
      key: 'dueDate',
      header: 'Due',
      render: (row) => <span className="whitespace-nowrap">{formatDate(row.dueDate)}</span>,
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      sortable: true,
      render: (row) => <span className="tabular-nums">{formatCurrency(row.total)}</span>,
    },
    {
      key: 'paidAmount',
      header: 'Paid',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="tabular-nums text-emerald-600 dark:text-emerald-400">
          {formatCurrency(row.paidAmount)}
        </span>
      ),
    },
    {
      key: 'dueAmount',
      header: 'Due amount',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-semibold tabular-nums">
          {formatCurrency(row.dueAmount)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={SUPPLIER_PAYMENT_STATUS_META[row.status].badge} size="sm">
          {SUPPLIER_PAYMENT_STATUS_META[row.status].label}
        </Badge>
      ),
    },
  ];

  return (
    <PageContainer maxWidth="full">
      <PurchasesHeader
        title="Supplier payments"
        description="Track what you owe, what is overdue and record settlements."
      />

      <FilterBar activeCount={activeCount} onReset={reset} label="Filters">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Select
            aria-label="Payment status"
            value={filters.status}
            onChange={(event) =>
              patch({ status: event.target.value as SupplierPaymentStatus | 'all', page: 1 })
            }
            options={SUPPLIER_PAYMENT_STATUS_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            className="h-9 text-sm"
          />
          <Select
            aria-label="Supplier"
            value={filters.supplierId}
            onChange={(event) => patch({ supplierId: event.target.value, page: 1 })}
            options={[
              { value: 'all', label: 'All suppliers' },
              ...(suppliers.data ?? []).map((supplier) => ({
                value: supplier.id,
                label: supplier.name,
              })),
            ]}
            className="h-9 text-sm"
          />
        </div>
      </FilterBar>

      <SectionCard title="Bills" description="Open and settled supplier balances" noPadding>
        <DataTable
          columns={columns}
          data={query.data?.items ?? []}
          rowKey="poId"
          loading={query.isLoading}
          error={query.error instanceof Error ? query.error.message : null}
          emptyTitle="No supplier bills found"
          emptyDescription="Invoiced purchase orders will appear here."
          sortable
          search={{
            value: filters.search,
            onChange: (value) => patch({ search: value, page: 1 }),
            placeholder: 'PO # or supplier…',
          }}
          pagination={{
            page: filters.page,
            pageSize: filters.pageSize,
            total: query.data?.total ?? 0,
            onPageChange: (page) => patch({ page }),
            onPageSizeChange: (pageSize) => patch({ pageSize, page: 1 }),
          }}
          rowActions={(row) => (
            <Button
              variant="ghost"
              size="sm"
              className="h-7"
              disabled={row.dueAmount <= 0}
              onClick={(event) => {
                event.stopPropagation();
                setTarget(row);
              }}
            >
              Record payment
            </Button>
          )}
        />
      </SectionCard>

      <RecordPaymentModal open={target !== null} onClose={() => setTarget(null)} row={target} />
    </PageContainer>
  );
}

export default SupplierPaymentsPage;
