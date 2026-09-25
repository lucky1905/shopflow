import { useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { SectionCard } from '@/components/common/SectionCard';
import { PageContainer } from '@/components/layout/PageContainer';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { formatCurrency, formatDate, formatNumber } from '@/utils/format';
import {
  ReportExportActions,
  ReportsFilterBar,
  ReportsHeader,
} from '../components';
import { useSalesReport } from '../api';
import { useReportsFiltersStore } from '../hooks';
import { exportToCSV } from '../utils';
import type { SalesReportRow, TopSellingItemRow } from '../types';

export function SalesReportsPage() {
  const filters = useReportsFiltersStore();
  const sales = useSalesReport(filters);
  const [activeTab, setActiveTab] = useState<'orders' | 'topProducts'>('orders');

  const orderColumns: DataTableColumn<SalesReportRow>[] = [
    {
      key: 'orderNumber',
      header: 'Order #',
      render: (row) => <span className="font-semibold text-primary">{row.orderNumber}</span>,
    },
    {
      key: 'date',
      header: 'Date',
      render: (row) => <span>{formatDate(row.date)}</span>,
    },
    { key: 'customerName', header: 'Customer' },
    {
      key: 'channel',
      header: 'Channel',
      render: (row) => (
        <Badge variant="outline" size="sm">
          {row.channel.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'itemCount',
      header: 'Items',
      align: 'right',
      render: (row) => <span>{formatNumber(row.itemCount)}</span>,
    },
    {
      key: 'subtotal',
      header: 'Subtotal',
      align: 'right',
      render: (row) => <span>{formatCurrency(row.subtotal)}</span>,
    },
    {
      key: 'tax',
      header: 'Tax',
      align: 'right',
      render: (row) => <span>{formatCurrency(row.tax)}</span>,
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (row) => <span className="font-bold tabular-nums">{formatCurrency(row.total)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge
          variant={row.status === 'completed' ? 'success' : 'danger'}
          size="sm"
        >
          {row.status}
        </Badge>
      ),
    },
  ];

  const productColumns: DataTableColumn<TopSellingItemRow>[] = [
    {
      key: 'productName',
      header: 'Product',
      render: (row) => (
        <div>
          <p className="font-semibold text-foreground">{row.productName}</p>
          <p className="text-xs text-muted-foreground">SKU: {row.sku}</p>
        </div>
      ),
    },
    { key: 'category', header: 'Category' },
    {
      key: 'unitsSold',
      header: 'Units',
      align: 'right',
      render: (row) => <span className="font-semibold">{formatNumber(row.unitsSold)}</span>,
    },
    {
      key: 'revenue',
      header: 'Revenue',
      align: 'right',
      render: (row) => <span className="font-semibold tabular-nums">{formatCurrency(row.revenue)}</span>,
    },
    {
      key: 'profit',
      header: 'Gross Profit',
      align: 'right',
      render: (row) => <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(row.profit)}</span>,
    },
    {
      key: 'marginPct',
      header: 'Margin %',
      align: 'right',
      render: (row) => <span className="tabular-nums">{row.marginPct}%</span>,
    },
  ];

  const handleExportCsv = () => {
    if (activeTab === 'orders' && sales.data?.orders) {
      exportToCSV('sales-orders-report', sales.data.orders, [
        { key: 'orderNumber', header: 'Order #' },
        { key: 'date', header: 'Date' },
        { key: 'customerName', header: 'Customer' },
        { key: 'channel', header: 'Channel' },
        { key: 'itemCount', header: 'Items' },
        { key: 'subtotal', header: 'Subtotal ($)', format: (v) => formatCurrency(v as number) },
        { key: 'tax', header: 'Tax ($)', format: (v) => formatCurrency(v as number) },
        { key: 'total', header: 'Total ($)', format: (v) => formatCurrency(v as number) },
        { key: 'paymentMethod', header: 'Payment Method' },
        { key: 'status', header: 'Status' },
      ]);
    } else if (sales.data?.topProducts) {
      exportToCSV('top-products-performance', sales.data.topProducts, [
        { key: 'productName', header: 'Product' },
        { key: 'sku', header: 'SKU' },
        { key: 'category', header: 'Category' },
        { key: 'unitsSold', header: 'Units' },
        { key: 'revenue', header: 'Revenue ($)', format: (v) => formatCurrency(v as number) },
        { key: 'cost', header: 'Cost ($)', format: (v) => formatCurrency(v as number) },
        { key: 'profit', header: 'Profit ($)', format: (v) => formatCurrency(v as number) },
        { key: 'marginPct', header: 'Margin %' },
      ]);
    }
  };

  return (
    <PageContainer maxWidth="full">
      <ReportsHeader
        title="Sales & Orders Report"
        description="Line item ledger, invoice transactions, item profitability and return audits."
        actions={
          <ReportExportActions
            reportTitle="Sales & Product Performance Report"
            onExportCsv={handleExportCsv}
          />
        }
      />

      <ReportsFilterBar
        showChannelFilter
        showCategoryFilter
        showSearch
        searchPlaceholder="Filter by order # or customer..."
      />

      <div className="flex items-center gap-2 mb-4 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === 'orders'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Order Transactions ({sales.data?.orders?.length ?? 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('topProducts')}
          className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === 'topProducts'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Product Profitability & Volume
        </button>
      </div>

      {activeTab === 'orders' ? (
        <SectionCard title="Completed Sales Orders" description="Ledger of closed and refunded sales transactions." noPadding>
          <DataTable
            columns={orderColumns}
            data={sales.data?.orders ?? []}
            rowKey="id"
            loading={sales.isLoading}
            error={sales.error instanceof Error ? sales.error.message : null}
            emptyTitle="No orders match your criteria"
            emptyDescription="Try selecting a wider date range or clearing channel filters."
          />
        </SectionCard>
      ) : (
        <SectionCard title="Product Sales Performance" description="Units moved, revenue earned, and gross margin per catalog item." noPadding>
          <DataTable
            columns={productColumns}
            data={sales.data?.topProducts ?? []}
            rowKey="productId"
            loading={sales.isLoading}
            error={sales.error instanceof Error ? sales.error.message : null}
            emptyTitle="No product performance data"
          />
        </SectionCard>
      )}
    </PageContainer>
  );
}

export default SalesReportsPage;

