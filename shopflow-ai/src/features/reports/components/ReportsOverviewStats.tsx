import {
  DollarSign,
  Package,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { Skeleton } from '@/components/common/LoadingSkeleton';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/format';
import type { ReportsOverviewSummary } from '../types';

export interface ReportsOverviewStatsProps {
  stats?: ReportsOverviewSummary;
  isLoading: boolean;
}

export function ReportsOverviewStats({ stats, isLoading }: ReportsOverviewStatsProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Total Revenue"
        value={formatCurrency(stats.totalRevenue)}
        change={stats.revenueTrendPct}
        changeLabel="vs previous period"
        icon={<DollarSign className="h-4 w-4" />}
      />
      <StatCard
        title="Total Orders"
        value={formatNumber(stats.totalOrders)}
        change={stats.ordersTrendPct}
        changeLabel="vs previous period"
        icon={<ShoppingBag className="h-4 w-4" />}
      />
      <StatCard
        title="Gross Profit"
        value={formatCurrency(stats.grossProfit)}
        change={stats.profitTrendPct}
        changeLabel={`Net margin: ${formatPercent(stats.netMarginPct)}`}
        icon={<TrendingUp className="h-4 w-4" />}
      />
      <StatCard
        title="Inventory Asset Value"
        value={formatCurrency(stats.inventoryValuation)}
        changeLabel={`${stats.activeCustomerCount} active buyers`}
        icon={<Package className="h-4 w-4" />}
      />
    </div>
  );
}

export default ReportsOverviewStats;
