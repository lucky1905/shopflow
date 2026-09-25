import { motion } from 'framer-motion';
import { ArrowRight, Layers } from 'lucide-react';
import { SectionCard } from '@/components/common/SectionCard';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { formatCurrency } from '@/utils/format';
import { confidencePct, scoreWidth } from '../utils';
import type { ProductPairing } from '../types';

export interface CrossSellSuggestionsProps {
  pairings?: ProductPairing[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  className?: string;
}

/** Cross-sell & upsell — product pairs ranked by expected revenue lift. */
export function CrossSellSuggestions({
  pairings,
  isLoading,
  error,
  onRetry,
  className,
}: CrossSellSuggestionsProps) {
  const isEmpty = !isLoading && !error && (pairings?.length ?? 0) === 0;
  const totalLift = pairings?.reduce((sum, row) => sum + row.estimatedIncrementalRevenue, 0) ?? 0;

  return (
    <SectionCard
      title="Cross-sell & upsell"
      description="Product pairs the model expects to lift basket value."
      icon={<Layers className="h-4 w-4" />}
      className={className}
      action={
        pairings && pairings.length > 0 ? (
          <Badge variant="success" size="sm">
            +{formatCurrency(totalLift)} potential
          </Badge>
        ) : undefined
      }
    >
      {error ? (
        <ErrorState
          title="Suggestions unavailable"
          message="We could not compute product pairings right now."
          onRetry={onRetry}
          compact
        />
      ) : isLoading || !pairings ? (
        <LoadingSkeleton variant="list" rows={4} />
      ) : isEmpty ? (
        <EmptyState
          icon={<Layers className="h-5 w-5" />}
          title="No pairings yet"
          description="Once you record enough baskets, the model will surface high-affinity product pairs."
          compact
        />
      ) : (
        <ul className="space-y-3">
          {pairings.map((pairing, index) => (
            <motion.li
              key={pairing.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
                <span className="min-w-0 truncate">{pairing.primaryProduct}</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="min-w-0 truncate text-primary">{pairing.suggestedProduct}</span>
              </div>

              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{pairing.rationale}</p>

              <div className="mt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Attach rate</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {pairing.attachRate.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: scoreWidth(pairing.attachRate) }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: index * 0.05 }}
                    className="h-full rounded-full bg-primary"
                  />
                </div>
              </div>

              <dl className="mt-3 grid grid-cols-3 gap-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">Expected lift</dt>
                  <dd className="font-semibold tabular-nums text-success">
                    +{pairing.estimatedLift.toFixed(1)}%
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Incremental</dt>
                  <dd className="font-semibold tabular-nums text-foreground">
                    {formatCurrency(pairing.estimatedIncrementalRevenue)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Confidence</dt>
                  <dd className="font-semibold tabular-nums text-foreground">
                    {confidencePct(pairing.confidence)}
                  </dd>
                </div>
              </dl>
            </motion.li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
