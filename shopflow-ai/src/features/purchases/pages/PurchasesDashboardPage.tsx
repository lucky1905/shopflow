import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Truck } from 'lucide-react';
import { purchaseOrderPath, ROUTES } from '@/constants';
import { cn } from '@/lib/utils';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionCard } from '@/components/common/SectionCard';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/common/Badge';
import { formatCurrency, formatDate } from '@/utils/format';
import {
  PurchasesHeader,
  PurchasesStatsGrid,
  PurchaseStatusChart,
  SpendTrendChart,
  SupplierSpendChart,
} from '../components';
import {
  usePendingDeliveries,
  usePurchaseStatusSplit,
  usePurchasesDashboard,
  useSpendTrend,
  useSupplierSpend,
} from '../api';
import { PURCHASE_STATUS_META } from '../constants';
import type { PurchaseOrder, PurchaseTrendRange } from '../types';

const RANGES: Array<{ value: PurchaseTrendRange; label: string }> = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
];

/** Purchases dashboard: KPIs, spend trend, supplier mix and upcoming orders. */
export function PurchasesDashboardPage() {
  const navigate = useNavigate();
  const [range, setRange] = useState<PurchaseTrendRange>('30d');

  const stats = usePurchasesDashboard();
  const trend = useSpendTrend(range);
  const statusSplit = usePurchaseStatusSplit();
  const supplierSpend = useSupplierSpend();
  const deliveries = usePendingDeliveries();

  const recentColumns: DataTableColumn<PurchaseOrder>[] = [
    {
      key: 'poNumber',
      header: 'Order',
      render: (row) => <span className="font-semibold text-primary">{row.poNumber}</span>,
    },
    { key: 'supplierName', header: 'Supplier', hideOnMobile: true },
    {
      key: 'expectedDate',
      header: 'Expected',
      render: (row) => <span className="whitespace-nowrap">{formatDate(row.expectedDate)}</span>,
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
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (row) => (
        <span className="font-semibold tabular-nums">{formatCurrency(row.total)}</span>
      ),
    },
  ];

  const rangeSwitch = (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
      {RANGES.map((entry) => (
        <button
          key={entry.value}
          type="button"
          onClick={() => setRange(entry.value)}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
            range === entry.value
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {entry.label}
        </button>
      ))}
    </div>
  );

  return (
    <PageContainer maxWidth="full">
      <PurchasesHeader
        title="Purchases dashboard"
        description="Purchase orders, deliveries and supplier payments at a glance."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(ROUTES.PURCHASE_DELIVERIES)}
            leftIcon={<Truck className="h-3.5 w-3.5" />}
          >
            Deliveries
          </Button>
        }
      />

      <PurchasesStatsGrid stats={stats.data} isLoading={stats.isLoading} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SpendTrendChart
            data={trend.data ?? []}
            isLoading={trend.isLoading}
            error={trend.error instanceof Error ? trend.error.message : null}
            onRetry={() => void trend.refetch()}
            action={rangeSwitch}
          />
        </div>
        <PurchaseStatusChart
          data={statusSplit.data ?? []}
          isLoading={statusSplit.isLoading}
          error={statusSplit.error instanceof Error ? statusSplit.error.message : null}
          onRetry={() => void statusSplit.refetch()}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SupplierSpendChart
          data={supplierSpend.data ?? []}
          isLoading={supplierSpend.isLoading}
          error={supplierSpend.error instanceof Error ? supplierSpend.error.message : null}
          onRetry={() => void supplierSpend.refetch()}
        />

        <SectionCard
          title="Upcoming deliveries"
          description="Open orders sorted by expected date"
          noPadding
          action={
            <Button
              variant="ghost"
              size="sm"
              rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              onClick={() => navigate(ROUTES.PURCHASE_ORDERS)}
            >
              All orders
            </Button>
          }
        >
          <DataTable
            columns={recentColumns}
            data={(deliveries.data ?? []).slice(0, 6)}
            rowKey="id"
            loading={deliveries.isLoading}
            error={deliveries.error instanceof Error ? deliveries.error.message : null}
            emptyTitle="No open deliveries"
            emptyDescription="Sent and partially received orders will appear here."
            onRowClick={(row) => navigate(purchaseOrderPath(row.id))}
          />
        </SectionCard>
      </div>
    </PageContainer>
  );
}

export default PurchasesDashboardPage;