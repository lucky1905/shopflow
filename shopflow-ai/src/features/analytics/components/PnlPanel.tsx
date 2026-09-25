import { Scale } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import type { AnalyticsPnL } from '../types';

/** Profit & loss breakdown with a net-margin callout. */
export function PnlPanel({
  data,
  isLoading,
  className,
}: {
  data?: AnalyticsPnL;
  isLoading?: boolean;
  className?: string;
}) {
  const rows: Array<{ label: string; value: number; signed?: boolean; strong?: boolean }> = data
    ? [
        { label: 'Revenue', value: data.revenue },
        { label: 'Cost of goods sold', value: data.cogs, signed: true },
        { label: 'Gross profit', value: data.grossProfit, strong: true },
        { label: 'Operating expenses', value: data.expenses, signed: true },
        { label: 'Net profit', value: data.netProfit, strong: true },
      ]
    : [];

  return (
    <div className={className}>
      <ul className="space-y-1">
        {isLoading || !data
          ? Array.from({ length: 5 }).map((_, index) => (
              <li key={index} className="flex items-center justify-between border-b border-border py-2.5 last:border-0">
                <span className="h-3 w-28 animate-pulse rounded bg-muted" />
                <span className="h-3 w-20 animate-pulse rounded bg-muted" />
              </li>
            ))
          : rows.map((row) => (
              <li
                key={row.label}
                className="flex items-center justify-between border-b border-border py-2.5 last:border-0"
              >
                <span className={row.strong ? 'text-sm font-semibold text-foreground' : 'text-sm text-muted-foreground'}>
                  {row.label}
                </span>
                <span
                  className={
                    row.strong
                      ? 'text-sm font-semibold tabular-nums text-foreground'
                      : 'text-sm tabular-nums text-muted-foreground'
                  }
                >
                  {row.signed ? '- ' : ''}
                  {formatCurrency(row.value)}
                </span>
              </li>
            ))}
      </ul>

      {data && (
        <div className="mt-3 flex items-center justify-between rounded-lg bg-primary/5 p-2.5">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Scale className="h-3.5 w-3.5 text-primary" />
            Net margin
          </span>
          <span className="text-sm font-semibold tabular-nums text-primary">{data.marginPct.toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
}
