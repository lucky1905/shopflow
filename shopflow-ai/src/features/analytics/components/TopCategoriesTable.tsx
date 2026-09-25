import { motion } from 'framer-motion';
import { Boxes } from 'lucide-react';
import { SectionCard } from '@/components/common/SectionCard';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { formatCurrency, formatNumber } from '@/utils/format';
import { cn } from '@/lib/utils';
import { percentLabel } from '../utils';
import type { AnalyticsCategoryRow } from '../types';

export interface TopCategoriesTableProps {
  rows?: AnalyticsCategoryRow[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  className?: string;
}

/** Category mix with share of revenue and growth. */
export function TopCategoriesTable({ rows, isLoading, error, onRetry, className }: TopCategoriesTableProps) {
  return (
    <SectionCard
      title="Top categories"
      description="Revenue share and growth by product category."
      icon={<Boxes className="h-4 w-4" />}
      className={className}
      noPadding
    >
      {error ? (
        <ErrorState
          title="Categories unavailable"
          message="We could not load the category mix."
          onRetry={onRetry}
          compact
        />
      ) : isLoading || !rows ? (
        <div className="p-5">
          <LoadingSkeleton variant="table" rows={5} />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState title="No category data" description="No sales were recorded in this period." compact />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[460px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-3 py-3 text-right font-medium">Orders</th>
                <th className="px-3 py-3 text-right font-medium">Revenue</th>
                <th className="px-5 py-3 text-right font-medium">Growth</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <motion.tr
                  key={row.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.04, duration: 0.2 }}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
                      <div>
                        <p className="font-medium text-foreground">{row.name}</p>
                        <p className="text-[11px] text-muted-foreground">{row.sharePct.toFixed(1)}% of revenue</p>
                      </div>
                    </div>
                    <div className="mt-1.5 h-1 w-40 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${row.sharePct}%`, backgroundColor: row.color }}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-foreground">{formatNumber(row.orders)}</td>
                  <td className="px-3 py-3 text-right font-medium tabular-nums text-foreground">
                    {formatCurrency(row.revenue, 'USD', { notation: 'compact', maximumFractionDigits: 0 })}
                  </td>
                  <td
                    className={cn(
                      'px-5 py-3 text-right font-medium tabular-nums',
                      row.growth >= 0 ? 'text-success' : 'text-destructive',
                    )}
                  >
                    {percentLabel(row.growth)}
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
