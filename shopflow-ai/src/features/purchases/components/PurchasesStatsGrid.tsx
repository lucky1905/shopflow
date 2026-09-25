import { ClipboardList, DollarSign, Truck, Wallet } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { Skeleton } from '@/components/common/LoadingSkeleton';
import { formatCurrency, formatNumber } from '@/utils/format';
import type { PurchasesDashboardStats } from '../types';

export interface PurchasesStatsGridProps {
  stats?: PurchasesDashboardStats;
  isLoading: boolean;
}

/** KPI strip: open orders, deliveries, spend and outstanding balance. */
export function PurchasesStatsGrid({ stats, isLoading }: PurchasesStatsGridProps) {
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
        title="Open orders"
        value={formatNumber(stats.openOrders)}
        changeLabel={`${formatCurrency(stats.openOrderValue)} committed`}
        icon={<ClipboardList className="h-4 w-4" />}
      />
      <StatCard
        title="Pending deliveries"
        value={formatNumber(stats.pendingDeliveries)}
        changeLabel={`${formatNumber(stats.receivedThisMonth)} received this month`}
        icon={<Truck className="h-4 w-4" />}
      />
      <StatCard
        title="Spend (30d)"
        value={formatCurrency(stats.monthSpend)}
        change={stats.spendChangePct}
        changeLabel="vs prev. 30d"
        icon={<DollarSign className="h-4 w-4" />}
      />
      <StatCard
        title="Outstanding"
        value={formatCurrency(stats.outstandingBalance)}
        changeLabel={`${stats.overduePayments} overdue bills`}
        icon={<Wallet className="h-4 w-4" />}
      />
    </div>
  );
}

export default PurchasesStatsGrid;