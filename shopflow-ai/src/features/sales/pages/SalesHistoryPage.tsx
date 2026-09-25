import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Eye } from 'lucide-react';
import { invoicePath } from '@/constants';
import { useDebouncedValue, useToast } from '@/hooks';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionCard } from '@/components/common/SectionCard';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/common/Badge';
import { formatCurrency, formatDate, formatNumber } from '@/utils/format';
import { InvoicePreviewModal, SalesFiltersBar, SalesHeader } from '../components';
import { useInvoiceDetail, useInvoices } from '../api';
import { INVOICE_STATUS_META, PAYMENT_STATUS_META, SALES_CHANNEL_META } from '../constants';
import { useSalesFiltersStore } from '../hooks';
import type { InvoiceSummary } from '../types';

/** Advanced-filtered, paginated invoice list with preview + details actions. */
export function SalesHistoryPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const filters = useSalesFiltersStore();
  const patch = useSalesFiltersStore((state) => state.patch);
  const debouncedSearch = useDebouncedValue(filters.search, 250);

  const query = useInvoices({ ...filters, search: debouncedSearch });
  const [previewId, setPreviewId] = useState<string | null>(null);
  const preview = useInvoiceDetail(previewId);

  const columns: DataTableColumn<InvoiceSummary>[] = [
    {
      key: 'invoiceNumber',
      header: 'Invoice',
      sortable: true,
      render: (row) => <span className="font-semibold text-primary">{row.invoiceNumber}</span>,
    },
    {
      key: 'createdAt',
      header: 'Date',
      sortable: true,
      render: (row) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
    {
      key: 'customerName',
      header: 'Customer',
      sortable: true,
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{row.customerName}</p>
          <p className="text-xs text-muted-foreground">{row.itemCount} items</p>
        </div>
      ),
    },
    {
      key: 'channel',
      header: 'Channel',
      hideOnMobile: true,
      render: (row) => (
        <span
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: SALES_CHANNEL_META[row.channel].color }}
          />
          {SALES_CHANNEL_META[row.channel].label}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={INVOICE_STATUS_META[row.status].badge} size="sm">
          {INVOICE_STATUS_META[row.status].label}
        </Badge>
      ),
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      hideOnMobile: true,
      render: (row) => (
        <Badge variant={PAYMENT_STATUS_META[row.paymentStatus].badge} size="sm">
          {PAYMENT_STATUS_META[row.paymentStatus].label}
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
      <SalesHeader
        title="Sales history"
        description="Every invoice with advanced filters, search and pagination."
      />

      <SalesFiltersBar />

      <SectionCard
        title="Invoices"
        description={`${formatNumber(query.data?.total ?? 0)} invoices match the current filters`}
        noPadding
      >
        <DataTable
          columns={columns}
          data={query.data?.items ?? []}
          rowKey="id"
          loading={query.isLoading}
          loadingRows={8}
          error={query.error instanceof Error ? query.error.message : null}
          emptyTitle="No invoices found"
          emptyDescription="Try widening the date range or clearing the filters."
          sortable
          stickyHeader
          onRowClick={(row) => navigate(invoicePath(row.id))}
          search={{
            value: filters.search,
            onChange: (value) => patch({ search: value, page: 1 }),
            placeholder: 'Invoice #, customer or amount…',
          }}
          toolbarActions={
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="h-3.5 w-3.5" />}
              onClick={() => toast.info('CSV export is mocked in Phase 4.')}
            >
              Export CSV
            </Button>
          }
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
              size="icon"
              className="h-7 w-7"
              aria-label={`Preview ${row.invoiceNumber}`}
              onClick={(event) => {
                event.stopPropagation();
                setPreviewId(row.id);
              }}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
          )}
        />
      </SectionCard>

      <InvoicePreviewModal
        open={previewId !== null && preview.data !== undefined}
        onClose={() => setPreviewId(null)}
        invoice={preview.data ?? null}
      />
    </PageContainer>
  );
}

export default SalesHistoryPage;