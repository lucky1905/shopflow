import { Badge } from '@/components/common/Badge';
import { SectionCard } from '@/components/common/SectionCard';
import { PageContainer } from '@/components/layout/PageContainer';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { formatCurrency, formatDate, formatNumber } from '@/utils/format';
import {
  CustomerSegmentsChart,
  ReportExportActions,
  ReportsFilterBar,
  ReportsHeader,
} from '../components';
import { useCustomerReport } from '../api';
import { useReportsFiltersStore } from '../hooks';
import { exportToCSV } from '../utils';
import type { CustomerPerformanceRow } from '../types';

export function CustomerReportPage() {
  const filters = useReportsFiltersStore();
  const customerData = useCustomerReport(filters);

  const columns: DataTableColumn<CustomerPerformanceRow>[] = [
    {
      key: 'name',
      header: 'Customer',
      render: (row) => (
        <div>
          <p className="font-semibold text-foreground">{row.name}</p>
          <p className="text-xs text-muted-foreground">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'customerSegment',
      header: 'Segment',
      render: (row) => {
        const variant =
          row.customerSegment === 'vip'
            ? 'success'
            : row.customerSegment === 'regular'
              ? 'info'
              : row.customerSegment === 'new'
                ? 'warning'
                : 'secondary';
        return <Badge variant={variant} size="sm">{row.customerSegment.toUpperCase()}</Badge>;
      },
    },
    {
      key: 'ordersCount',
      header: 'Orders',
      align: 'right',
      render: (row) => <span>{formatNumber(row.ordersCount)}</span>,
    },
    {
      key: 'totalSpend',
      header: 'Total Spend',
      align: 'right',
      render: (row) => <span className="font-bold tabular-nums">{formatCurrency(row.totalSpend)}</span>,
    },
    {
      key: 'averageOrderValue',
      header: 'AOV',
      align: 'right',
      render: (row) => <span className="tabular-nums">{formatCurrency(row.averageOrderValue)}</span>,
    },
    {
      key: 'lastOrderDate',
      header: 'Last Order',
      render: (row) => <span>{formatDate(row.lastOrderDate)}</span>,
    },
  ];

  const handleExportCsv = () => {
    if (!customerData.data?.customers) return;
    exportToCSV('customer-analytics-report', customerData.data.customers, [
      { key: 'name', header: 'Customer' },
      { key: 'email', header: 'Email' },
      { key: 'customerSegment', header: 'Segment' },
      { key: 'ordersCount', header: 'Total Orders' },
      { key: 'totalSpend', header: 'Total Spend ($)', format: (v) => formatCurrency(v as number) },
      { key: 'averageOrderValue', header: 'AOV ($)', format: (v) => formatCurrency(v as number) },
      { key: 'lastOrderDate', header: 'Last Order' },
    ]);
  };

  return (
    <PageContainer maxWidth="full">
      <ReportsHeader
        title="Customer Analytics & Retention"
        description="Buyer segment distribution, high-value patron identification and repeat order analytics."
        actions={
          <ReportExportActions
            reportTitle="Customer Performance Report"
            onExportCsv={handleExportCsv}
          />
        }
      />

      <ReportsFilterBar
        showSearch
        searchPlaceholder="Filter customers by name or email..."
        showChannelFilter={false}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 mb-6">
        <div className="xl:col-span-1">
          <CustomerSegmentsChart
            data={customerData.data?.segments ?? []}
            isLoading={customerData.isLoading}
            error={customerData.error instanceof Error ? customerData.error.message : null}
            onRetry={() => void customerData.refetch()}
          />
        </div>
        <div className="xl:col-span-2">
          <SectionCard title="High Value Shoppers" description="Ranked ranking of top accounts and purchasing volume." noPadding>
            <DataTable
              columns={columns}
              data={customerData.data?.customers ?? []}
              rowKey="customerId"
              loading={customerData.isLoading}
              error={customerData.error instanceof Error ? customerData.error.message : null}
              emptyTitle="No customer records match filter"
            />
          </SectionCard>
        </div>
      </div>
    </PageContainer>
  );
}

export default CustomerReportPage;
