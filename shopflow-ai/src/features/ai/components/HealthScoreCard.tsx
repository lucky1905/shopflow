import { motion } from 'framer-motion';
import { Activity, TrendingDown, TrendingUp } from 'lucide-react';
import { SectionCard } from '@/components/common/SectionCard';
import { Badge } from '@/components/common/Badge';
import { Skeleton } from '@/components/common/LoadingSkeleton';
import { formatPercent } from '@/utils/format';
import { cn } from '@/lib/utils';
import { ScoreRing } from './primitives';
import { factorTone, scoreWidth } from '../utils';
import type { BusinessHealth } from '../types';

function HealthSkeleton() {
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <Skeleton className="h-[132px] w-[132px] shrink-0 rounded-full" />
      <div className="w-full space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
    </div>
  );
}

export interface HealthScoreCardProps {
  health?: BusinessHealth;
  isLoading?: boolean;
  className?: string;
}

/**
 * Business Health Score — composite ring plus the six weighted factors that
 * produced the number, so the score is always explainable.
 */
export function HealthScoreCard({ health, isLoading, className }: HealthScoreCardProps) {
  const score = health?.score ?? 0;
  const tone = score >= 75 ? 'positive' : score >= 55 ? 'warning' : 'danger';

  return (
    <SectionCard
      title="Business health score"
      description="Weighted across revenue, margin, stock, retention and cash cycle."
      icon={<Activity className="h-4 w-4" />}
      className={className}
      action={
        health && (
          <Badge variant={tone === 'positive' ? 'success' : tone === 'warning' ? 'warning' : 'danger'} size="sm" dot>
            {health.label}
          </Badge>
        )
      }
    >
      {isLoading || !health ? (
        <HealthSkeleton />
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-5">
            <ScoreRing value={score} size={148} tone={tone} label="of 100" />
            <div className="text-center sm:text-left">
              <p className="flex items-center justify-center gap-1 text-sm font-semibold text-foreground sm:justify-start">
                {health.change >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
                <span className={health.change >= 0 ? 'text-success' : 'text-destructive'}>
                  {formatPercent(health.change)}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">vs. last 30 days</p>
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">{health.summary}</p>

            <ul className="space-y-2.5">
              {health.factors.map((factor, index) => (
                <motion.li
                  key={factor.label}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.2 }}
                  className="space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="truncate font-medium text-foreground">{factor.label}</span>
                    <span className="flex shrink-0 items-center gap-2 tabular-nums">
                      <span
                        className={cn(
                          factor.change >= 0 ? 'text-success' : 'text-destructive',
                        )}
                      >
                        {formatPercent(factor.change)}
                      </span>
                      <span className="w-7 text-right font-semibold text-foreground">{factor.score}</span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: scoreWidth(factor.score) }}
                      transition={{ duration: 0.6, ease: 'easeOut', delay: index * 0.04 }}
                      className={cn('h-full rounded-full', factorTone(factor))}
                    />
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </SectionCard>
  );
}
