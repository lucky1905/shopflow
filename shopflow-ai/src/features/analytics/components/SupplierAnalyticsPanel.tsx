import { Timer, TrendingUp } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/format';
import { MiniStat, LoadingRows } from './InventoryPerformancePanel';
import type { AnalyticsSupplierAnalytics } from '../types';

/** Supplier analytics: spend, reliability, lead time and payables. */
export function SupplierAnalyticsPanel({
  data,
  isLoading,
  className,
}: {
  data?: AnalyticsSupplierAnalytics;
  isLoading?: boolean;
  className?: string;
}) {
  if (isLoading || !data) {
    return (
      <div className={className}>
        <LoadingRows rows={4} />
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat
          label="Spend"
          value={formatCurrency(data.totalSpend, 'USD', { notation: 'compact', maximumFractionDigits: 0 })}
        />
        <MiniStat label="On-time" value={`${data.onTimeRatePct.toFixed(1)}%`} tone="success" />
        <MiniStat label="Lead time" value={`${data.avgLeadTimeDays}d`} tone="primary" />
        <MiniStat
          label="Payables"
          value={formatCurrency(data.outstandingPayables, 'USD', { notation: 'compact', maximumFractionDigits: 0 })}
          tone="warning"
        />
      </div>

      <ul className="space-y-2">
        {data.topSuppliers.map((supplier) => (
          <li key={supplier.name} className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-sm font-medium text-foreground">{supplier.name}</p>
              <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                {formatCurrency(supplier.spend, 'USD', { notation: 'compact', maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> {formatNumber(supplier.orders)} orders
              </span>
              <span className="inline-flex items-center gap-1">
                <Timer className="h-3 w-3" /> {supplier.onTimePct.toFixed(0)}% on time
              </span>
              <span>{supplier.qualityPct.toFixed(0)}% quality</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

