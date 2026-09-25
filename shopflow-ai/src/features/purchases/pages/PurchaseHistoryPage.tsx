import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { purchaseOrderPath } from '@/constants';
import { useDebouncedValue, useToast } from '@/hooks';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionCard } from '@/components/common/SectionCard';
import { FilterBar } from '@/components/common/FilterBar';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/common/Badge';
import { Select } from '@/components/ui/Select';
import { formatCurrency, formatDate } from '@/utils/format';
import { PurchasesHeader } from '../components';
import { usePurchaseOrders } from '../api';
import { PURCHASE_STATUS_META } from '../constants';
import type { PurchaseOrder, PurchaseOrderStatus } from '../types';

type HistoryStatus = PurchaseOrderStatus | 'all';

/**
 * Purchase history: received and cancelled orders with date bounds and search.
 * Uses page-local filters so it never interferes with the live orders table.
 */
export function PurchaseHistoryPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<HistoryStatus>('received');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const debouncedSearch = useDebouncedValue(search, 250);
  const query = usePurchaseOrders({
    search: debouncedSearch,
    status,
    supplierId: 'all',
    paymentStatus: 'all',
    dateFrom,
    dateTo,
    page,
    pageSize,
  });

  const activeCount =
    (status !== 'received' ? 1 : 0) + (dateFrom || dateTo ? 1 : 0) + (search ? 1 : 0);

  const reset = (): void => {
    setSearch('');
    setStatus('received');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const columns: DataTableColumn<PurchaseOrder>[] = [
    {
      key: 'poNumber',
      header: 'Order',
      render: (row) => <span className="font-semibold text-primary">{row.poNumber}</span>,
    },
    { key: 'supplierName', header: 'Supplier', sortable: true },
    {
      key: 'createdAt',
      header: 'Ordered',
      sortable: true,
      render: (row) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={PURCHASE_STATUS_META[row.status].badge} size="sm">
          {PURCHASE_STATUS_META[row.status].label}
        </Badge>
      ),
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      hideOnMobile: true,
      render: (row) => (
        <Badge variant={row.paymentStatus === 'paid' ? 'success' : 'warning'} size="sm">
          {row.paymentStatus}
        </Badge>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      sortable: true,
      render: (row) => (
        <span className="font-semibold tabular-nums">{formatCurrency(row.total)}</span>
      ),
    },
  ];

  return (
    <PageContainer maxWidth="full">
      <PurchasesHeader
        title="Purchase history"
        description="Completed and cancelled purchase orders, fully searchable."
      />

      <FilterBar activeCount={activeCount} onReset={reset} label="Filters">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            aria-label="Status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as HistoryStatus);
              setPage(1);
            }}
            options={[
              { value: 'received', label: 'Received' },
              { value: 'cancelled', label: 'Cancelled' },
              { value: 'all', label: 'All statuses' },
            ]}
            className="h-9 text-sm"
          />
          <input
            type="date"
            aria-label="From date"
            value={dateFrom}
            onChange={(event) => {
              setDateFrom(event.target.value);
              setPage(1);
            }}
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="date"
            aria-label="To date"
            value={dateTo}
            onChange={(event) => {
              setDateTo(event.target.value);
              setPage(1);
            }}
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </FilterBar>

      <SectionCard title="Completed orders" description="Received and cancelled POs" noPadding>
        <DataTable
          columns={columns}
          data={query.data?.items ?? []}
          rowKey="id"
          loading={query.isLoading}
          error={query.error instanceof Error ? query.error.message : null}
          emptyTitle="No history yet"
          emptyDescription="Completed and cancelled purchase orders will appear here."
          sortable
          onRowClick={(row) => navigate(purchaseOrderPath(row.id))}
          search={{
            value: search,
            onChange: (value) => {
              setSearch(value);
              setPage(1);
            },
            placeholder: 'PO # or supplier…',
          }}
          toolbarActions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info('PDF archive export is mocked in Phase 4.')}
            >
              Export archive
            </Button>
          }
          pagination={{
            page,
            pageSize,
            total: query.data?.total ?? 0,
            onPageChange: setPage,
            onPageSizeChange: (size) => {
              setPageSize(size);
              setPage(1);
            },
          }}
        />
      </SectionCard>
    </PageContainer>
  );
}

export default PurchaseHistoryPage;
