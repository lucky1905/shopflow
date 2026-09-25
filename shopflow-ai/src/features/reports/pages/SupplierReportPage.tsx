import { Badge } from '@/components/common/Badge';
import { SectionCard } from '@/components/common/SectionCard';
import { PageContainer } from '@/components/layout/PageContainer';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/format';
import {
  ReportExportActions,
  ReportsFilterBar,
  ReportsHeader,
} from '../components';
import { useSupplierReport } from '../api';
import { useReportsFiltersStore } from '../hooks';
import { exportToCSV } from '../utils';
import type { SupplierPerformanceRow } from '../types';

export function SupplierReportPage() {
  const filters = useReportsFiltersStore();
  const suppliers = useSupplierReport(filters);
  const supplierList = suppliers.data?.suppliers ?? [];

  const columns: DataTableColumn<SupplierPerformanceRow>[] = [
    {
      key: 'name',
      header: 'Supplier',
      render: (row) => (
        <div>
          <p className="font-semibold text-foreground">{row.name}</p>
          <p className="text-xs text-muted-foreground">{row.contactPerson}</p>
        </div>
      ),
    },
    {
      key: 'totalSpend',
      header: 'Total Spend',
      align: 'right',
      render: (row) => <span className="font-bold tabular-nums">{formatCurrency(row.totalSpend)}</span>,
    },
    {
      key: 'ordersCount',
      header: 'Orders',
      align: 'right',
      render: (row) => <span>{formatNumber(row.ordersCount)}</span>,
    },
    {
      key: 'onTimeDeliveryRatePct',
      header: 'On-Time Rate',
      align: 'right',
      render: (row) => (
        <span
          className={`font-semibold tabular-nums ${
            row.onTimeDeliveryRatePct >= 95
              ? 'text-emerald-600 dark:text-emerald-400'
              : row.onTimeDeliveryRatePct >= 85
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-rose-600 dark:text-rose-400'
          }`}
        >
          {formatPercent(row.onTimeDeliveryRatePct)}
        </span>
      ),
    },
    {
      key: 'qualityCompliancePct',
      header: 'Quality %',
      align: 'right',
      render: (row) => <span className="tabular-nums text-muted-foreground">{formatPercent(row.qualityCompliancePct)}</span>,
    },
    {
      key: 'rating',
      header: 'Vendor Score',
      align: 'center',
      render: (row) => (
        <Badge
          variant={row.rating >= 4.5 ? 'success' : row.rating >= 4.0 ? 'info' : 'warning'}
          size="sm"
        >
          {row.rating} / 5.0
        </Badge>
      ),
    },
  ];

  const handleExportCsv = () => {
    if (!supplierList.length) return;
    exportToCSV('supplier-performance-report', supplierList, [
      { key: 'name', header: 'Supplier' },
      { key: 'contactPerson', header: 'Contact Person' },
      { key: 'totalSpend', header: 'Spend ($)', format: (v) => formatCurrency(v as number) },
      { key: 'ordersCount', header: 'Purchase Orders' },
      { key: 'onTimeDeliveryRatePct', header: 'On-Time Delivery %', format: (v) => `${v}%` },
      { key: 'qualityCompliancePct', header: 'Quality %', format: (v) => `${v}%` },
      { key: 'rating', header: 'Score' },
    ]);
  };

  return (
    <PageContainer maxWidth="full">
      <ReportsHeader
        title="Supplier & Vendor Scorecard"
        description="Fulfillment accuracy, lead time compliance, defect rates and spend distribution by vendor."
        actions={
          <ReportExportActions
            reportTitle="Supplier Performance Ledger"
            onExportCsv={handleExportCsv}
          />
        }
      />

      <ReportsFilterBar
        showCategoryFilter={false}
        showSearch
        searchPlaceholder="Filter vendors by name..."
        showChannelFilter={false}
      />

      <SectionCard title="Vendor Performance Ledger" description="Supplier delivery metrics and financial totals." noPadding>
        <DataTable
          columns={columns}
          data={supplierList}
          rowKey="supplierId"
          loading={suppliers.isLoading}
          error={suppliers.error instanceof Error ? suppliers.error.message : null}
          emptyTitle="No suppliers found"
        />
      </SectionCard>
    </PageContainer>
  );
}

export default SupplierReportPage;
