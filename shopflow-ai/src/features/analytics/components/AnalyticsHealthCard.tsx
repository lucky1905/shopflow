import { motion } from 'framer-motion';
import { Activity, HeartPulse, TrendingDown, TrendingUp } from 'lucide-react';
import { SectionCard } from '@/components/common/SectionCard';
import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/common/LoadingSkeleton';
import { cn } from '@/lib/utils';
import { HEALTH_STATUS_META, barWidth, factorTone, percentLabel } from '../utils';
import type { AnalyticsHealth } from '../types';

/** Business health score rendered as a progress ring plus weighted factors. */
export function AnalyticsHealthCard({ health, isLoading }: { health?: AnalyticsHealth; isLoading?: boolean }) {
  if (isLoading || !health) {
    return (
      <SectionCard title="Business health" icon={<HeartPulse className="h-4 w-4" />}>
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <Skeleton className="h-32 w-32 rounded-full" />
          <div className="w-full space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-3 w-full" />
            ))}
          </div>
        </div>
      </SectionCard>
    );
  }

  const score = Math.max(0, Math.min(100, health.score));
  const tone = score >= 75 ? 'positive' : score >= 55 ? 'warning' : 'danger';
  const stroke = tone === 'positive' ? 'stroke-success' : tone === 'warning' ? 'stroke-warning' : 'stroke-destructive';
  const text = tone === 'positive' ? 'text-success' : tone === 'warning' ? 'text-warning' : 'text-destructive';
  const size = 128;
  const thickness = 10;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <SectionCard
      title="Business health"
      description="Composite score across growth, margin, stock and suppliers."
      icon={<HeartPulse className="h-4 w-4" />}
      action={
        <Badge variant={HEALTH_STATUS_META[score >= 75 ? 'strong' : 'watch'].variant} size="sm" dot>
          {health.label}
        </Badge>
      }
    >
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        <div className="relative inline-flex shrink-0 items-center justify-center">
          <svg width={size} height={size} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={thickness} className="stroke-muted" />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              strokeWidth={thickness}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (score / 100) * circumference}
              className={cn('transition-[stroke-dashoffset] duration-700 ease-out', stroke)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn('text-2xl font-bold tabular-nums', text)}>{Math.round(score)}</span>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">of 100</span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'mb-3 flex items-center gap-1 text-sm font-semibold',
              health.change >= 0 ? 'text-success' : 'text-destructive',
            )}
          >
            {health.change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {percentLabel(health.change)} <span className="font-normal text-muted-foreground">vs last period</span>
          </p>
          <p className="mb-4 text-xs leading-relaxed text-muted-foreground">{health.summary}</p>
          <ul className="space-y-2.5">
            {health.factors.map((factor, index) => (
              <motion.li
                key={factor.label}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04, duration: 0.2 }}
                className="space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <Activity className="h-3 w-3 shrink-0 text-muted-foreground" />
                    <span className="truncate font-medium text-foreground">{factor.label}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2 tabular-nums">
                    <span className={factor.change >= 0 ? 'text-success' : 'text-destructive'}>
                      {percentLabel(factor.change)}
                    </span>
                    <span className="w-6 text-right font-semibold text-foreground">{factor.score}</span>
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: barWidth(factor.score) }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: index * 0.04 }}
                    className={cn('h-full rounded-full', factorTone(factor))}
                  />
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </SectionCard>
  );
}

/** Shared empty state for the analytics sub-panels. */
export function AnalyticsEmpty({ title, description }: { title: string; description: string }) {
  return <EmptyState title={title} description={description} compact />;
}

