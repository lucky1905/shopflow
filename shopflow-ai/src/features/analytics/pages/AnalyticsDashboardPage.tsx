import { useState } from 'react';
import { BarChart3, Coins, LineChart, PackageSearch, RefreshCw, ShoppingCart, Truck, Users, Wallet } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/common/PageHeader';
import { SectionCard } from '@/components/common/SectionCard';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { Button } from '@/components/ui/Button';
import { useAnalyticsDashboard } from '../api/queries';
import { useAnalyticsFiltersStore } from '../hooks/useAnalyticsFiltersStore';
import { ANALYTICS_PALETTE } from '../constants';
import type { AnalyticsView } from '../types';
import {
  AnalyticsChartCard,
  AnalyticsExportActions,
  AnalyticsFilterBar,
  AnalyticsViewSwitcher,
  CustomerAnalyticsPanel,
  AnalyticsHealthCard,
  InventoryPerformancePanel,
  KpiGrid,
  MixDonutChart,
  PnlPanel,
  RevenueAreaChart,
  SalesHeatmap,
  SupplierAnalyticsPanel,
  TopCategoriesTable,
  TopProductsTable,
  TrendBarChart,
} from '../components';

const VIEW_COPY: Record<AnalyticsView, string> = {
  overview: 'Cross-module performance for the selected period.',
  sales: 'Revenue, order volume and the revenue mix by channel.',
  purchases: 'Purchase volume and supplier payment exposure.',
  inventory: 'Stock health, sell-through and the products moving fastest.',
  customers: 'Acquisition, retention and lifetime value by segment.',
  suppliers: 'Spend, lead times and on-time delivery performance.',
};

export function AnalyticsDashboardPage() {
  const [view, setView] = useState<AnalyticsView>('overview');
  const filters = useAnalyticsFiltersStore();
  const { preset, startDate, endDate, storeId } = filters;

  const { data, isLoading, isError, error, refetch, isFetching } = useAnalyticsDashboard({
    preset,
    startDate,
    endDate,
    storeId,
  });

  if (isError) {
    return (
      <PageContainer>
        <PageHeader
          title="Analytics"
          description="Revenue, profit, inventory, customer and supplier performance in one place."
          icon={<LineChart className="h-5 w-5" />}
        />
        <ErrorState
          title="Analytics unavailable"
          message={error instanceof Error ? error.message : 'We could not load analytics right now.'}
          onRetry={() => void refetch()}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Analytics"
        description="Revenue, profit, inventory, customer and supplier performance in one place."
        icon={<LineChart className="h-5 w-5" />}
        actions={
          <>
            <AnalyticsExportActions data={data} />
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={() => void refetch()}
              isLoading={isFetching}
            >
              Refresh
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <AnalyticsFilterBar />
          <AnalyticsViewSwitcher active={view} onChange={setView} />
          <p className="text-xs text-muted-foreground">{VIEW_COPY[view]}</p>
        </div>
      </PageHeader>

      {isLoading || !data ? (
        <LoadingSkeleton variant="page" />
      ) : (
        <div className="space-y-6">
          <KpiGrid kpis={data.kpis} />

          {view === 'overview' && (
            <div className="grid gap-6 xl:grid-cols-3">
              <div className="space-y-6 xl:col-span-2">
                <AnalyticsChartCard
                  title="Revenue overview"
                  description="Revenue area with order volume overlaid."
                  icon={<BarChart3 className="h-4 w-4" />}
                  isEmpty={data.trend.length === 0}
                >
                  <RevenueAreaChart data={data.trend} />
                </AnalyticsChartCard>

                <div className="grid gap-6 lg:grid-cols-2">
                  <AnalyticsChartCard
                    title="Profit & loss"
                    description="Where the money came from and where it went."
                    icon={<Wallet className="h-4 w-4" />}
                    isLoading={isLoading}
                    height={260}
                  >
                    <PnlPanel data={data.pnl} className="h-full" />
                  </AnalyticsChartCard>

                  <AnalyticsChartCard
                    title="Revenue by channel"
                    description="Where revenue is being generated."
                    icon={<ShoppingCart className="h-4 w-4" />}
                    isEmpty={data.revenueByChannel.length === 0}
                  >
                    <MixDonutChart data={data.revenueByChannel} centerLabel="total revenue" />
                  </AnalyticsChartCard>
                </div>

                <SalesHeatmap cells={data.heatmap} />
              </div>

              <div className="space-y-6">
                <AnalyticsHealthCard health={data.health} isLoading={isLoading} />
                <AnalyticsChartCard
                  title="Payment mix"
                  description="How customers are paying."
                  icon={<Coins className="h-4 w-4" />}
                  isEmpty={data.paymentMix.length === 0}
                  height={240}
                >
                  <MixDonutChart data={data.paymentMix} centerLabel="collected" />
                </AnalyticsChartCard>
              </div>
            </div>
          )}
          {view === 'sales' && (
            <div className="grid gap-6 xl:grid-cols-3">
              <div className="space-y-6 xl:col-span-2">
                <AnalyticsChartCard
                  title="Sales trends"
                  description="Revenue and order volume across the period."
                  icon={<BarChart3 className="h-4 w-4" />}
                  isEmpty={data.trend.length === 0}
                  height={320}
                >
                  <RevenueAreaChart data={data.trend} />
                </AnalyticsChartCard>

                <AnalyticsChartCard
                  title="Category mix"
                  description="Revenue share by product category."
                  icon={<PackageSearch className="h-4 w-4" />}
                  isEmpty={data.categoryMix.length === 0}
                >
                  <MixDonutChart data={data.categoryMix} centerLabel="category revenue" />
                </AnalyticsChartCard>

                <TopProductsTable rows={data.topProducts} />
              </div>

              <div className="space-y-6">
                <TopCategoriesTable rows={data.topCategories} />
                <AnalyticsHealthCard health={data.health} />
              </div>
            </div>
          )}

          {view === 'purchases' && (
            <div className="grid gap-6 xl:grid-cols-3">
              <div className="space-y-6 xl:col-span-2">
                <AnalyticsChartCard
                  title="Purchase trends"
                  description="Purchase volume compared with generated profit."
                  icon={<Truck className="h-4 w-4" />}
                  isEmpty={data.trend.length === 0}
                  height={320}
                >
                  <TrendBarChart
                    data={data.trend}
                    keys={[
                      { key: 'purchases', label: 'Purchases', color: ANALYTICS_PALETTE[1] },
                      { key: 'profit', label: 'Profit', color: ANALYTICS_PALETTE[2] },
                    ]}
                  />
                </AnalyticsChartCard>

                <AnalyticsChartCard
                  title="Profit & loss"
                  description="Purchase cost as a share of the P&L."
                  icon={<Wallet className="h-4 w-4" />}
                  height={260}
                >
                  <PnlPanel data={data.pnl} className="h-full" />
                </AnalyticsChartCard>
              </div>

              <div className="space-y-6">
                <SectionCard
                  title="Supplier analytics"
                  description="Spend, lead times and on-time delivery."
                  icon={<Truck className="h-4 w-4" />}
                >
                  <SupplierAnalyticsPanel data={data.suppliers} />
                </SectionCard>
              </div>
            </div>
          )}

          {view === 'inventory' && (
            <div className="grid gap-6 xl:grid-cols-3">
              <div className="space-y-6 xl:col-span-2">
                <SectionCard
                  title="Inventory performance"
                  description="Stock health, sell-through and the fastest movers."
                  icon={<PackageSearch className="h-4 w-4" />}
                >
                  <InventoryPerformancePanel data={data.inventory} />
                </SectionCard>

                <TopProductsTable rows={data.topProducts} />
              </div>

              <div className="space-y-6">
                <SalesHeatmap cells={data.heatmap} />
                <AnalyticsHealthCard health={data.health} />
              </div>
            </div>
          )}

          {view === 'customers' && (
            <div className="grid gap-6 xl:grid-cols-3">
              <div className="space-y-6 xl:col-span-2">
                <SectionCard
                  title="Customer analytics"
                  description="Acquisition, retention and lifetime value by segment."
                  icon={<Users className="h-4 w-4" />}
                >
                  <CustomerAnalyticsPanel data={data.customers} />
                </SectionCard>

                <AnalyticsChartCard
                  title="Revenue trend"
                  description="Revenue over time with order volume."
                  icon={<LineChart className="h-4 w-4" />}
                  isEmpty={data.trend.length === 0}
                >
                  <RevenueAreaChart data={data.trend} />
                </AnalyticsChartCard>
              </div>

              <div className="space-y-6">
                <TopCategoriesTable rows={data.topCategories} />
                <AnalyticsHealthCard health={data.health} />
              </div>
            </div>
          )}

          {view === 'suppliers' && (
            <div className="grid gap-6 xl:grid-cols-3">
              <div className="space-y-6 xl:col-span-2">
                <SectionCard
                  title="Supplier analytics"
                  description="Spend, reliability and outstanding payables."
                  icon={<Truck className="h-4 w-4" />}
                >
                  <SupplierAnalyticsPanel data={data.suppliers} />
                </SectionCard>

                <AnalyticsChartCard
                  title="Purchase trend"
                  description="Purchase volume over the selected period."
                  icon={<BarChart3 className="h-4 w-4" />}
                  isEmpty={data.trend.length === 0}
                >
                  <TrendBarChart
                    data={data.trend}
                    keys={[{ key: 'purchases', label: 'Purchases', color: ANALYTICS_PALETTE[1] }]}
                  />
                </AnalyticsChartCard>
              </div>

              <div className="space-y-6">
                <AnalyticsChartCard
                  title="Profit & loss"
                  description="Net margin and cost structure."
                  icon={<Wallet className="h-4 w-4" />}
                  height={260}
                >
                  <PnlPanel data={data.pnl} className="h-full" />
                </AnalyticsChartCard>
              </div>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}

export default AnalyticsDashboardPage;

