import { motion } from 'framer-motion';
import { Mail, TrendingDown, TrendingUp, Users } from 'lucide-react';
import { SectionCard } from '@/components/common/SectionCard';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { formatCurrency, formatNumber } from '@/utils/format';
import { cn } from '@/lib/utils';
import { SEGMENT_META, confidencePct, relativeDayLabel } from '../utils';
import type { CustomerInsight } from '../types';

export interface CustomerInsightsProps {
  customers?: CustomerInsight[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  className?: string;
}

/** Customer Insights — segmentation, value and the recommended next action. */
export function CustomerInsights({
  customers,
  isLoading,
  error,
  onRetry,
  className,
}: CustomerInsightsProps) {
  const isEmpty = !isLoading && !error && (customers?.length ?? 0) === 0;

  return (
    <SectionCard
      title="Customer insights"
      description="Segments, lifetime value and the next best action per account."
      icon={<Users className="h-4 w-4" />}
      className={className}
      action={
        customers && customers.length > 0 ? (
          <Badge variant="outline" size="sm">
            {formatCurrency(customers.reduce((sum, c) => sum + c.lifetimeValue, 0))} LTV tracked
          </Badge>
        ) : undefined
      }
    >
      {error ? (
        <ErrorState
          title="Customer insights unavailable"
          message="We could not segment your customers right now."
          onRetry={onRetry}
          compact
        />
      ) : isLoading || !customers ? (
        <LoadingSkeleton variant="list" rows={4} />
      ) : isEmpty ? (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title="No customer data yet"
          description="Once you record your first orders, segmentation and lifetime value will appear here."
          compact
        />
      ) : (
        <ul className="space-y-3">
          {customers.map((customer, index) => (
            <motion.li
              key={customer.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.2 }}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-foreground">{customer.name}</h3>
                    <Badge variant={SEGMENT_META[customer.segment].variant} size="sm">
                      {customer.segment}
                    </Badge>
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                    <Mail className="h-3 w-3 shrink-0" />
                    {customer.email}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-base font-semibold tabular-nums text-foreground">
                    {formatCurrency(customer.lifetimeValue)}
                  </p>
                  <p
                    className={cn(
                      'flex items-center justify-end gap-1 text-xs tabular-nums',
                      customer.trend >= 0 ? 'text-success' : 'text-destructive',
                    )}
                  >
                    {customer.trend >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {customer.trend > 0 ? '+' : ''}
                    {customer.trend.toFixed(1)}%
                  </p>
                </div>
              </div>

              <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs">
                <div className="flex gap-1.5">
                  <dt className="text-muted-foreground">Orders</dt>
                  <dd className="font-semibold tabular-nums text-foreground">
                    {formatNumber(customer.orders)}
                  </dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="text-muted-foreground">Last order</dt>
                  <dd className="font-semibold text-foreground">
                    {relativeDayLabel(customer.lastOrderDaysAgo)}
                  </dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="text-muted-foreground">Confidence</dt>
                  <dd className="font-semibold tabular-nums text-foreground">
                    {confidencePct(Math.min(1, Math.abs(customer.trend) / 45))}
                  </dd>
                </div>
              </dl>

              <p className="mt-3 rounded-lg bg-muted/40 p-2.5 text-xs leading-relaxed text-muted-foreground">
                {customer.opportunity}
              </p>
              <p className="mt-2 flex items-start gap-2 text-xs font-medium text-primary">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                {customer.recommendedAction}
              </p>
            </motion.li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
