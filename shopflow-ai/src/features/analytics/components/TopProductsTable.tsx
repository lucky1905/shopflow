import { motion } from 'framer-motion';
import { Boxes, TrendingDown, TrendingUp } from 'lucide-react';
import { SectionCard } from '@/components/common/SectionCard';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { formatCurrency, formatNumber } from '@/utils/format';
import { cn } from '@/lib/utils';
import { percentLabel } from '../utils';
import type { AnalyticsProductRow } from '../types';

export interface TopProductsTableProps {
  rows?: AnalyticsProductRow[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  className?: string;
}

/** Top products by revenue, with margin and growth context. */
export function TopProductsTable({ rows, isLoading, error, onRetry, className }: TopProductsTableProps) {
  const max = rows?.length ? Math.max(...rows.map((row) => row.revenue)) : 0;

  return (
    <SectionCard
      title="Top products"
      description="Best sellers ranked by revenue contribution."
      icon={<Boxes className="h-4 w-4" />}
      className={className}
      noPadding
      action={
        rows && rows.length > 0 ? (
          <Badge variant="outline" size="sm">
            {rows.length} SKUs
          </Badge>
        ) : undefined
      }
    >
      {error ? (
        <ErrorState
          title="Top products unavailable"
          message="We could not load the ranking."
          onRetry={onRetry}
          compact
        />
      ) : isLoading || !rows ? (
        <div className="p-5">
          <LoadingSkeleton variant="table" rows={6} />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState title="No products sold" description="Nothing was sold in this period." compact />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-3 py-3 text-right font-medium">Units</th>
                <th className="px-3 py-3 text-right font-medium">Revenue</th>
                <th className="px-3 py-3 text-right font-medium">Margin</th>
                <th className="px-5 py-3 text-right font-medium">Growth</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03, duration: 0.2 }}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="px-5 py-3">
                    <p className="font-medium text-foreground">{row.name}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">{row.sku}</p>
                    <div className="mt-1.5 h-1 w-28 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${max > 0 ? (row.revenue / max) * 100 : 0}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-foreground">
                    {formatNumber(row.unitsSold)}
                  </td>
                  <td className="px-3 py-3 text-right font-medium tabular-nums text-foreground">
                    {formatCurrency(row.revenue, 'USD', { notation: 'compact', maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">
                    {row.marginPct.toFixed(1)}%
                  </td>
                  <td
                    className={cn(
                      'px-5 py-3 text-right font-medium tabular-nums',
                      row.growth >= 0 ? 'text-success' : 'text-destructive',
                    )}
                  >
                    <span className="inline-flex items-center gap-1">
                      {row.growth >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {percentLabel(row.growth)}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}
