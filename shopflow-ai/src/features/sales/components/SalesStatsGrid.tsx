import { DollarSign, Receipt, ShoppingBag, Undo2 } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { Skeleton } from '@/components/common/LoadingSkeleton';
import { formatCurrency, formatNumber } from '@/utils/format';
import type { SalesDashboardStats } from '../types';

export interface SalesStatsGridProps {
  stats?: SalesDashboardStats;
  isLoading: boolean;
}

/** KPI strip for the sales dashboard: revenue, orders, AOV, refunds. */
export function SalesStatsGrid({ stats, isLoading }: SalesStatsGridProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="mt-3 h-7 w-32" />
            <Skeleton className="mt-3 h-3 w-20" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Net revenue (30d)"
        value={formatCurrency(stats.netRevenue)}
        change={stats.revenueChangePct}
        changeLabel="vs prev. 30d"
        icon={<DollarSign className="h-4 w-4" />}
      />
      <StatCard
        title="Orders (30d)"
        value={formatNumber(stats.orderCount)}
        change={stats.orderChangePct}
        changeLabel="vs prev. 30d"
        icon={<ShoppingBag className="h-4 w-4" />}
      />
      <StatCard
        title="Avg. order value"
        value={formatCurrency(stats.avgOrderValue)}
        changeLabel={`${formatNumber(stats.unitsSold)} units sold`}
        icon={<Receipt className="h-4 w-4" />}
      />
      <StatCard
        title="Refunds (30d)"
        value={formatCurrency(stats.refundTotal)}
        changeLabel={`${stats.pendingRefunds} pending · ${formatCurrency(stats.overdueTotal)} overdue`}
        icon={<Undo2 className="h-4 w-4" />}
      />
    </div>
  );
}

export default SalesStatsGrid;