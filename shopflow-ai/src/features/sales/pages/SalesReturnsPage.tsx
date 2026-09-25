import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, RotateCcw } from 'lucide-react';
import { invoicePath } from '@/constants';
import { useDebouncedValue, useToast } from '@/hooks';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionCard } from '@/components/common/SectionCard';
import { FilterBar } from '@/components/common/FilterBar';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/common/Badge';
import { Select } from '@/components/ui/Select';
import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';
import { SalesHeader } from '../components';
import { useProcessRefund, useSalesReturns } from '../api';
import { REFUND_STATUS_OPTIONS } from '../constants';
import { useSalesReturnFiltersStore } from '../hooks';
import type { RefundStatus, SalesReturnRecord } from '../types';

function statusBadge(status: RefundStatus) {
  return status === 'processed'
    ? { label: 'Processed', variant: 'success' as const }
    : { label: 'Pending refund', variant: 'warning' as const };
}

/** Returns & refunds: review RMA records and process pending refunds. */
export function SalesReturnsPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const filters = useSalesReturnFiltersStore();
  const patch = useSalesReturnFiltersStore((state) => state.patch);
  const reset = useSalesReturnFiltersStore((state) => state.reset);
  const debouncedSearch = useDebouncedValue(filters.search, 250);

  const query = useSalesReturns({ ...filters, search: debouncedSearch });
  const processRefund = useProcessRefund();
  const [target, setTarget] = useState<SalesReturnRecord | null>(null);

  const activeCount = (filters.status !== 'all' ? 1 : 0) + (filters.search ? 1 : 0);

  const confirmRefund = (): void => {
    if (!target) return;
    processRefund.mutate(target.id, {
      onSuccess: (record) => {
        toast.success(`${record.returnNumber} refunded ${formatCurrency(record.refundTotal)}.`);
        setTarget(null);
      },
      onError: (error) => toast.fromError(error),
    });
  };

  const columns: DataTableColumn<SalesReturnRecord>[] = [
    {
      key: 'returnNumber',
      header: 'Return',
      render: (row) => <span className="font-semibold text-primary">{row.returnNumber}</span>,
    },
    {
      key: 'invoiceNumber',
      header: 'Invoice',
      render: (row) => (
        <button
          type="button"
          className="underline-offset-2 hover:underline"
          onClick={(event) => {
            event.stopPropagation();
            navigate(invoicePath(row.invoiceId));
          }}
        >
          {row.invoiceNumber}
        </button>
      ),
    },
    { key: 'customerName', header: 'Customer', hideOnMobile: true },
    {
      key: 'createdAt',
      header: 'Requested',
      render: (row) => (
        <span className="whitespace-nowrap text-muted-foreground">{formatDate(row.createdAt)}</span>
      ),
    },
    {
      key: 'refundTotal',
      header: 'Refund',
      align: 'right',
      render: (row) => (
        <span className="font-semibold tabular-nums">{formatCurrency(row.refundTotal)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const meta = statusBadge(row.status);
        return (
          <Badge variant={meta.variant} size="sm">
            {meta.label}
          </Badge>
        );
      },
    },
  ];

  return (
    <PageContainer maxWidth="full">
      <SalesHeader
        title="Returns & refunds"
        description="Review return records, print RMAs and process pending refunds."
      />

      <FilterBar activeCount={activeCount} onReset={reset} label="Filters">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Select
            aria-label="Refund status"
            value={filters.status}
            onChange={(event) =>
              patch({ status: event.target.value as RefundStatus | 'all', page: 1 })
            }
            options={REFUND_STATUS_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            className="h-9 text-sm"
          />
        </div>
      </FilterBar>

      <SectionCard
        title="Return records"
        description="Start new returns from the POS terminal or an invoice."
        noPadding
      >
        <DataTable
          columns={columns}
          data={query.data?.items ?? []}
          rowKey="id"
          loading={query.isLoading}
          error={query.error instanceof Error ? query.error.message : null}
          emptyTitle="No returns found"
          emptyDescription="Return records created at the POS or from invoices will appear here."
          onRowClick={(row) => navigate(invoicePath(row.invoiceId))}
          search={{
            value: filters.search,
            onChange: (value) => patch({ search: value, page: 1 }),
            placeholder: 'RMA #, invoice # or customer…',
          }}
          pagination={{
            page: filters.page,
            pageSize: filters.pageSize,
            total: query.data?.total ?? 0,
            onPageChange: (page) => patch({ page }),
            onPageSizeChange: (pageSize) => patch({ pageSize, page: 1 }),
          }}
          rowActions={(row) => (
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label={`View invoice ${row.invoiceNumber}`}
                onClick={(event) => {
                  event.stopPropagation();
                  navigate(invoicePath(row.invoiceId));
                }}
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7"
                disabled={row.status === 'processed'}
                leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                onClick={(event) => {
                  event.stopPropagation();
                  setTarget(row);
                }}
              >
                Refund
              </Button>
            </div>
          )}
        />
      </SectionCard>

      <ConfirmationDialog
        open={target !== null}
        onClose={() => setTarget(null)}
        onConfirm={confirmRefund}
        tone="warning"
        title="Process this refund?"
        description={
          target
            ? `${target.returnNumber} · ${formatCurrency(target.refundTotal)} via ${target.refundMethod.replace('_', ' ')} — requested ${formatDateTime(target.createdAt)}.`
            : ''
        }
        confirmLabel="Process refund"
        isLoading={processRefund.isPending}
      />
    </PageContainer>
  );
}

export default SalesReturnsPage;
