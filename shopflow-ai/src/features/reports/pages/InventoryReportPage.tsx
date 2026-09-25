import { Badge } from '@/components/common/Badge';
import { SectionCard } from '@/components/common/SectionCard';
import { StatCard } from '@/components/ui/StatCard';
import { PageContainer } from '@/components/layout/PageContainer';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { formatCurrency, formatNumber } from '@/utils/format';
import {
  InventoryMovementChart,
  ReportExportActions,
  ReportsFilterBar,
  ReportsHeader,
} from '../components';
import { useInventoryReport } from '../api';
import { useReportsFiltersStore } from '../hooks';
import { exportToCSV } from '../utils';
import type { InventoryValuationRow } from '../types';
import { DollarSign, Layers, AlertCircle, RefreshCw } from 'lucide-react';

export function InventoryReportPage() {
  const filters = useReportsFiltersStore();
  const inventory = useInventoryReport(filters);

  const valuationRows = inventory.data?.valuation ?? [];
  const movementRows = inventory.data?.movements ?? [];

  const totalCostValuation = valuationRows.reduce((acc, r) => acc + r.totalCostValue, 0);
  const totalRetailValuation = valuationRows.reduce((acc, r) => acc + r.totalRetailValue, 0);
  const lowStockCount = valuationRows.filter((r) => r.status === 'low_stock').length;
  const outOfStockCount = valuationRows.filter((r) => r.status === 'out_of_stock').length;
  const avgTurnover =
    valuationRows.length > 0
      ? (valuationRows.reduce((acc, r) => acc + r.turnoverRatio, 0) / valuationRows.length).toFixed(1)
      : '0';

  const columns: DataTableColumn<InventoryValuationRow>[] = [
    {
      key: 'name',
      header: 'Item',
      render: (row) => (
        <div>
          <p className="font-semibold text-foreground">{row.name}</p>
          <p className="text-xs text-muted-foreground">SKU: {row.sku}</p>
        </div>
      ),
    },
    { key: 'category', header: 'Category' },
    {
      key: 'currentStock',
      header: 'On Hand',
      align: 'right',
      render: (row) => <span className="font-semibold">{formatNumber(row.currentStock)}</span>,
    },
    {
      key: 'unitCost',
      header: 'Cost / Unit',
      align: 'right',
      render: (row) => <span>{formatCurrency(row.unitCost)}</span>,
    },
    {
      key: 'totalCostValue',
      header: 'Cost Basis',
      align: 'right',
      render: (row) => <span className="font-semibold tabular-nums">{formatCurrency(row.totalCostValue)}</span>,
    },
    {
      key: 'totalRetailValue',
      header: 'Retail Value',
      align: 'right',
      render: (row) => <span className="tabular-nums text-muted-foreground">{formatCurrency(row.totalRetailValue)}</span>,
    },
    {
      key: 'turnoverRatio',
      header: 'Turnover',
      align: 'right',
      render: (row) => <span className="tabular-nums">{row.turnoverRatio}x</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const variant =
          row.status === 'in_stock'
            ? 'success'
            : row.status === 'low_stock'
              ? 'warning'
              : 'danger';
        return <Badge variant={variant} size="sm">{row.status.replace('_', ' ')}</Badge>;
      },
    },
  ];


  const handleExportCsv = () => {
    if (!inventory.data?.valuation) return;
    exportToCSV('inventory-valuation-report', inventory.data.valuation, [
      { key: 'name', header: 'Product' },
      { key: 'sku', header: 'SKU' },
      { key: 'category', header: 'Category' },
      { key: 'currentStock', header: 'On Hand' },
      { key: 'unitCost', header: 'Unit Cost ($)', format: (v) => formatCurrency(v as number) },
      { key: 'totalCostValue', header: 'Cost Basis ($)', format: (v) => formatCurrency(v as number) },
      { key: 'totalRetailValue', header: 'Retail Valuation ($)', format: (v) => formatCurrency(v as number) },
      { key: 'turnoverRatio', header: 'Turnover Ratio' },
      { key: 'status', header: 'Stock Status' },
    ]);
  };

  return (
    <PageContainer maxWidth="full">
      <ReportsHeader
        title="Inventory Valuation & Stock Flow Report"
        description="Asset cost basis, potential retail valuation, warehouse turnover velocity and dead stock audit."
        actions={
          <ReportExportActions
            reportTitle="Inventory Valuation Report"
            onExportCsv={handleExportCsv}
          />
        }
      />

      <ReportsFilterBar
        showCategoryFilter
        showSearch
        searchPlaceholder="Filter items by name or SKU..."
        showChannelFilter={false}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard
          title="Total Cost Valuation"
          value={formatCurrency(totalCostValuation)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatCard
          title="Retail Potential"
          value={formatCurrency(totalRetailValuation)}
          changeLabel={`Potential profit: ${formatCurrency(totalRetailValuation - totalCostValuation)}`}
          icon={<Layers className="h-4 w-4" />}
        />
        <StatCard
          title="Turnover Ratio"
          value={`${avgTurnover}x`}
          icon={<RefreshCw className="h-4 w-4" />}
        />
        <StatCard
          title="Stock Alerts"
          value={formatNumber(lowStockCount + outOfStockCount)}
          changeLabel={`${outOfStockCount} out of stock`}
          icon={<AlertCircle className="h-4 w-4" />}
        />
      </div>

      <div className="mb-6">
        <InventoryMovementChart
          data={movementRows}
          isLoading={inventory.isLoading}
          error={inventory.error instanceof Error ? inventory.error.message : null}
          onRetry={() => void inventory.refetch()}
        />
      </div>

      <SectionCard title="Stock Valuation Ledger" description="Current inventory valuation per product on hand." noPadding>
        <DataTable
          columns={columns}
          data={valuationRows}
          rowKey="productId"
          loading={inventory.isLoading}
          error={inventory.error instanceof Error ? inventory.error.message : null}
          emptyTitle="No inventory valuation records found"
        />
      </SectionCard>
    </PageContainer>
  );
}

export default InventoryReportPage;
