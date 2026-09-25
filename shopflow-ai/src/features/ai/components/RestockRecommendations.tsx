import { motion } from 'framer-motion';
import { Check, Clock, PackagePlus, Sparkles, X } from 'lucide-react';
import { SectionCard } from '@/components/common/SectionCard';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatNumber } from '@/utils/format';
import { cn } from '@/lib/utils';
import { useAIWorkspaceStore, type RestockDecision } from '../hooks/useAIWorkspaceStore';
import { PRIORITY_META, confidencePct, riskTone, sortedRestock } from '../utils';
import type { RestockRecommendation } from '../types';

export interface RestockRecommendationsProps {
  recommendations?: RestockRecommendation[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  className?: string;
}

/**
 * Smart restock queue. Each row is an AI recommendation with the reasoning
 * behind it; accept / snooze / dismiss decisions live in Zustand.
 */
export function RestockRecommendations({
  recommendations,
  isLoading,
  error,
  onRetry,
  className,
}: RestockRecommendationsProps) {
  const decisions = useAIWorkspaceStore((state) => state.restockDecisions);
  const decideRestock = useAIWorkspaceStore((state) => state.decideRestock);

  const rows = recommendations ? sortedRestock(recommendations) : [];
  const isEmpty = !isLoading && !error && rows.length === 0;
  const totalCost = rows.reduce((sum, row) => sum + row.estimatedCost, 0);

  return (
    <SectionCard
      title="Smart restock"
      description="Reorder quantities sized to cover lead time plus projected demand."
      icon={<PackagePlus className="h-4 w-4" />}
      className={className}
      action={
        rows.length > 0 ? (
          <Badge variant="outline" size="sm">
            {formatCurrency(totalCost)} to reorder
          </Badge>
        ) : undefined
      }
    >
      {error ? (
        <ErrorState
          title="Restock plan unavailable"
          message="We could not build a reorder plan right now."
          onRetry={onRetry}
          compact
        />
      ) : isLoading || !recommendations ? (
        <LoadingSkeleton variant="list" rows={4} />
      ) : isEmpty ? (
        <EmptyState
          icon={<PackagePlus className="h-5 w-5" />}
          title="Stock levels are healthy"
          description="Nothing needs reordering right now. We will alert you as soon as cover drops below lead time."
          compact
        />
      ) : (
        <ul className="space-y-3">
          {rows.map((row, index) => (
            <RestockRow
              key={row.id}
              row={row}
              index={index}
              decision={decisions[row.id]}
              onDecide={(decision) => decideRestock(row.id, decision)}
            />
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function RestockRow({
  row,
  index,
  decision,
  onDecide,
}: {
  row: RestockRecommendation;
  index: number;
  decision?: RestockDecision;
  onDecide: (decision: RestockDecision) => void;
}) {
  const meta = PRIORITY_META[row.priority];

  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.22 }}
      className={cn(
        'rounded-xl border border-border bg-card p-4 transition-opacity',
        decision === 'dismissed' && 'opacity-55',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-foreground">{row.productName}</h3>
            <Badge variant={meta.variant} size="sm">
              {meta.label}
            </Badge>
            {decision && (
              <Badge variant="outline" size="sm" dot>
                {decision === 'accepted' ? 'Added to PO' : decision === 'snoozed' ? 'Snoozed' : 'Dismissed'}
              </Badge>
            )}
          </div>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">{row.sku}</p>
        </div>
        <div className="text-right">
          <p className="text-base font-semibold tabular-nums text-foreground">
            +{formatNumber(row.recommendedQuantity)} units
          </p>
          <p className="text-xs tabular-nums text-muted-foreground">{formatCurrency(row.estimatedCost)}</p>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">On hand</dt>
          <dd className="font-semibold tabular-nums text-foreground">{formatNumber(row.currentStock)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Daily velocity</dt>
          <dd className="font-semibold tabular-nums text-foreground">{row.dailyVelocity}/day</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Cover left</dt>
          <dd className={cn('font-semibold tabular-nums', riskTone(row.daysRemaining))}>
            {row.daysRemaining} days
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Confidence</dt>
          <dd className="font-semibold tabular-nums text-foreground">{confidencePct(row.confidence)}</dd>
        </div>
      </dl>

      <p className="mt-3 flex items-start gap-2 rounded-lg bg-muted/40 p-2.5 text-xs leading-relaxed text-muted-foreground">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-highlight" />
        {row.reason}
      </p>

      {decision !== 'accepted' && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" variant="primary" leftIcon={<Check className="h-3.5 w-3.5" />} onClick={() => onDecide('accepted')}>
            Add to purchase order
          </Button>
          {decision !== 'snoozed' && (
            <Button size="sm" variant="outline" leftIcon={<Clock className="h-3.5 w-3.5" />} onClick={() => onDecide('snoozed')}>
              Snooze
            </Button>
          )}
          {decision !== 'dismissed' && (
            <Button size="sm" variant="ghost" leftIcon={<X className="h-3.5 w-3.5" />} onClick={() => onDecide('dismissed')}>
              Dismiss
            </Button>
          )}
        </div>
      )}
    </motion.li>
  );
}
