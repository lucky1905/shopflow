import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, TrendingUp } from 'lucide-react';
import { invoicePath, ROUTES } from '@/constants';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionCard } from '@/components/common/SectionCard';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/common/Badge';
import { formatCurrency, formatDate, formatNumber } from '@/utils/format';
import {
  ChannelMixChart,
  InvoicePreviewModal,
  RevenueTrendChart,
  SalesHeader,
  SalesStatsGrid,
  TopProductsChart,
} from '../components';
import {
  useChannelSplit,
  useInvoiceDetail,
  useRecentInvoices,
  useSalesDashboard,
  useSalesTrend,
  useTopProducts,
} from '../api';
import { INVOICE_STATUS_META, PAYMENT_STATUS_META, RECENT_INVOICES_LIMIT } from '../constants';
import type { InvoiceSummary } from '../types';

/** Sales dashboard: KPIs, revenue trend, channel mix, top products, recent invoices. */
export function SalesDashboardPage() {
  const navigate = useNavigate();
  const stats = useSalesDashboard();
  const trend = useSalesTrend('30d');
  const channels = useChannelSplit('30d');
  const topProducts = useTopProducts('30d');
  const recent = useRecentInvoices(RECENT_INVOICES_LIMIT);

  const [previewId, setPreviewId] = useState<string | null>(null);
  const preview = useInvoiceDetail(previewId);

  const columns: DataTableColumn<InvoiceSummary>[] = [
    {
      key: 'invoiceNumber',
      header: 'Invoice',
      render: (row) => (
        <span className="font-semibold text-primary">{row.invoiceNumber}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (row) => <span className="whitespace-nowrap">{formatDate(row.createdAt)}</span>,
    },
    { key: 'customerName', header: 'Customer', hideOnMobile: true },
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
      render: (row) => (
        <span className="font-semibold tabular-nums">{formatCurrency(row.total)}</span>
      ),
    },
  ];

  return (
    <PageContainer maxWidth="full">
      <SalesHeader
        title="Sales dashboard"
        description="Revenue, orders and refunds across every sales channel."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(ROUTES.SALES_HISTORY)}
            leftIcon={<TrendingUp className="h-3.5 w-3.5" />}
          >
            Full history
          </Button>
        }
      />

      <SalesStatsGrid stats={stats.data} isLoading={stats.isLoading} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RevenueTrendChart
            data={trend.data ?? []}
            isLoading={trend.isLoading}
            error={trend.error instanceof Error ? trend.error.message : null}
            onRetry={() => void trend.refetch()}
          />
        </div>
        <ChannelMixChart
          data={channels.data ?? []}
          isLoading={channels.isLoading}
          error={channels.error instanceof Error ? channels.error.message : null}
          onRetry={() => void channels.refetch()}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <TopProductsChart
          data={topProducts.data ?? []}
          isLoading={topProducts.isLoading}
          error={topProducts.error instanceof Error ? topProducts.error.message : null}
          onRetry={() => void topProducts.refetch()}
        />

        <SectionCard
          title="Recent invoices"
          description="Newest completed and in-flight invoices"
          noPadding
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.SALES_HISTORY)}>
              View all
            </Button>
          }
        >
          <DataTable
            columns={columns}
            data={recent.data ?? []}
            rowKey="id"
            loading={recent.isLoading}
            error={recent.error instanceof Error ? recent.error.message : null}
            emptyTitle="No invoices yet"
            emptyDescription="Completed checkouts and issued invoices will appear here."
            onRowClick={(row) => navigate(invoicePath(row.id))}
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
          <p className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
            {formatNumber(recent.data?.length ?? 0)} of the last {RECENT_INVOICES_LIMIT} invoices ·
            refunds pending: {stats.data?.pendingRefunds ?? 0}
          </p>
        </SectionCard>
      </div>

      <InvoicePreviewModal
        open={previewId !== null && preview.data !== undefined}
        onClose={() => setPreviewId(null)}
        invoice={preview.data ?? null}
      />
    </PageContainer>
  );
}

export default SalesDashboardPage;