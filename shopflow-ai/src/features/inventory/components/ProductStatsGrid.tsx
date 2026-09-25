import { cn } from '@/lib/utils';

export interface ProductStatsGridProps {
  stats: Array<{
    label: string;
    value: string;
    /** Tailwind text color for the value (defaults to foreground). */
    accent?: string;
  }>;
  className?: string;
}

/** Compact 2-col stat grid used in the product details drawer. */
export function ProductStatsGrid({ stats, className }: ProductStatsGridProps) {
  return (
    <dl className={cn('grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border', className)}>
      {stats.map((stat) => (
        <div key={stat.label} className="bg-card px-4 py-3">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {stat.label}
          </dt>
          <dd className={cn('mt-1 text-sm font-bold tabular-nums', stat.accent ?? 'text-foreground')}>
            {stat.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default ProductStatsGrid;
