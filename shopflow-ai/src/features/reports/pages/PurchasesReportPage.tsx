import { Badge } from '@/components/common/Badge';
import { SectionCard } from '@/components/common/SectionCard';
import { PageContainer } from '@/components/layout/PageContainer';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { formatCurrency, formatDate, formatNumber } from '@/utils/format';
import {
  PurchaseCategoryChart,
  ReportExportActions,
  ReportsFilterBar,
  ReportsHeader,
} from '../components';
import { usePurchaseReport } from '../api';
import { useReportsFiltersStore } from '../hooks';
import { exportToCSV } from '../utils';
import type { PurchaseReportRow } from '../types';

export function PurchasesReportPage() {
  const filters = useReportsFiltersStore();
  const purchases = usePurchaseReport(filters);

  const poColumns: DataTableColumn<PurchaseReportRow>[] = [
    {
      key: 'poNumber',
      header: 'PO #',
      render: (row) => <span className="font-semibold text-primary">{row.poNumber}</span>,
    },
    {
      key: 'date',
      header: 'Date',
      render: (row) => <span>{formatDate(row.date)}</span>,
    },
    { key: 'supplierName', header: 'Supplier' },
    {
      key: 'itemCount',
      header: 'Items',
      align: 'right',
      render: (row) => <span>{formatNumber(row.itemCount)}</span>,
    },
    {
      key: 'total',
      header: 'Total Spend',
      align: 'right',
      render: (row) => <span className="font-bold tabular-nums">{formatCurrency(row.total)}</span>,
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      render: (row) => (
        <Badge
          variant={
            row.paymentStatus === 'paid'
              ? 'success'
              : row.paymentStatus === 'partial'
                ? 'warning'
                : 'danger'
          }
          size="sm"
        >
          {row.paymentStatus.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'deliveryStatus',
      header: 'Delivery',
      render: (row) => (
        <Badge
          variant={
            row.deliveryStatus === 'received'
              ? 'success'
              : row.deliveryStatus === 'in_transit'
                ? 'info'
                : 'secondary'
          }
          size="sm"
        >
          {row.deliveryStatus.replace('_', ' ').toUpperCase()}
        </Badge>
      ),
    },
  ];

  const handleExportCsv = () => {
    if (!purchases.data?.orders) return;
    exportToCSV('purchases-order-report', purchases.data.orders, [
      { key: 'poNumber', header: 'PO Number' },
      { key: 'date', header: 'Date' },
      { key: 'supplierName', header: 'Supplier' },
      { key: 'itemCount', header: 'Item Count' },
      { key: 'subtotal', header: 'Subtotal ($)', format: (v) => formatCurrency(v as number) },
      { key: 'tax', header: 'Tax ($)', format: (v) => formatCurrency(v as number) },
      { key: 'total', header: 'Total ($)', format: (v) => formatCurrency(v as number) },
      { key: 'paymentStatus', header: 'Payment Status' },
      { key: 'deliveryStatus', header: 'Delivery Status' },
    ]);
  };

  return (
    <PageContainer maxWidth="full">
      <ReportsHeader
        title="Procurement & Purchases Report"
        description="Supplier expenditures, purchase order statuses, payment dues and department spend distribution."
        actions={
          <ReportExportActions
            reportTitle="Purchases Spend Report"
            onExportCsv={handleExportCsv}
          />
        }
      />

      <ReportsFilterBar
        showSearch
        searchPlaceholder="Search by PO # or supplier..."
        showChannelFilter={false}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 mb-6">
        <div className="xl:col-span-1">
          <PurchaseCategoryChart
            data={purchases.data?.categorySpend ?? []}
            isLoading={purchases.isLoading}
            error={purchases.error instanceof Error ? purchases.error.message : null}
            onRetry={() => void purchases.refetch()}
          />
        </div>
        <div className="xl:col-span-2">
          <SectionCard title="Purchase Orders Ledger" description="All recent purchases and fulfillment states." noPadding>
            <DataTable
              columns={poColumns}
              data={purchases.data?.orders ?? []}
              rowKey="id"
              loading={purchases.isLoading}
              error={purchases.error instanceof Error ? purchases.error.message : null}
              emptyTitle="No purchase order records match criteria"
            />
          </SectionCard>
        </div>
      </div>
    </PageContainer>
  );
}

export default PurchasesReportPage;
