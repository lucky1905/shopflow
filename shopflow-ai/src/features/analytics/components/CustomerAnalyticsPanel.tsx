import { AlertTriangle } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/format';
import { ANALYTICS_PALETTE } from '../constants';
import { MiniStat, LoadingRows } from './InventoryPerformancePanel';
import type { AnalyticsCustomerAnalytics } from '../types';

/** Customer analytics: acquisition, retention, LTV and segment mix. */
export function CustomerAnalyticsPanel({
  data,
  isLoading,
  className,
}: {
  data?: AnalyticsCustomerAnalytics;
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
        <MiniStat label="Customers" value={formatNumber(data.totalCustomers)} />
        <MiniStat label="New" value={formatNumber(data.newCustomers)} tone="primary" />
        <MiniStat label="Repeat rate" value={`${data.repeatRatePct.toFixed(1)}%`} tone="success" />
        <MiniStat label="Avg LTV" value={formatCurrency(data.avgLifetimeValue)} tone="primary" />
      </div>

      <ul className="space-y-2.5">
        {data.segments.map((segment, index) => (
          <li key={segment.name}>
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-foreground">{segment.name}</span>
              <span className="tabular-nums text-muted-foreground">
                {formatNumber(segment.customers)} &middot;{' '}
                {formatCurrency(segment.revenue, 'USD', { notation: 'compact', maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${segment.sharePct}%`,
                  backgroundColor: ANALYTICS_PALETTE[index % ANALYTICS_PALETTE.length],
                }}
              />
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-4 flex items-start gap-2 rounded-lg bg-warning/10 p-2.5 text-xs text-warning">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {formatNumber(data.churnRisk)} customers show churn risk and need a win-back offer.
      </p>
    </div>
  );
}

