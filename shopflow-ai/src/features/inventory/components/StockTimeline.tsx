import { ArrowDownToLine, ArrowUpFromLine, PackageOpen, PackagePlus, SlidersHorizontal } from 'lucide-react';
import type { ComponentType } from 'react';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/utils/format';
import { EmptyState } from '@/components/common/EmptyState';
import { MOVEMENT_META } from '../constants';
import type { MovementType, StockMovement } from '../types';

const MOVEMENT_ICONS: Record<MovementType, ComponentType<{ className?: string }>> = {
  in: ArrowDownToLine,
  out: ArrowUpFromLine,
  adjust: SlidersHorizontal,
  opening: PackagePlus,
};

export interface StockTimelineProps {
  movements: StockMovement[];
  /** Trims the list (drawer shows a window; "view all" can expand). */
  limit?: number;
  className?: string;
}

/**
 * Vertical stock-history timeline (gradient spine + typed icon nodes),
 * mirroring the dashboard's activity feed visual language.
 */
export function StockTimeline({ movements, limit, className }: StockTimelineProps) {
  const items = limit ? movements.slice(0, limit) : movements;

  if (items.length === 0) {
    return (
      <EmptyState
        compact
        icon={<PackageOpen className="h-5 w-5" />}
        title="No stock history yet"
        description="Adjustments, purchases and sales will appear here."
        className={className}
      />
    );
  }

  return (
    <ol className={cn('relative space-y-1', className)}>
      {/* Gradient spine */}
      <span
        aria-hidden="true"
        className="absolute bottom-4 left-[19px] top-4 w-0.5 rounded-full bg-gradient-to-b from-violet-500 via-fuchsia-500 to-cyan-400 opacity-50"
      />

      {items.map((movement) => {
        const meta = MOVEMENT_META[movement.type];
        const Icon = MOVEMENT_ICONS[movement.type];

        return (
          <li key={movement.id} className="relative flex gap-3.5 py-2.5">
            <span
              className={cn(
                'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/[0.06] bg-card shadow-sm dark:border-white/[0.08]',
                meta.iconBg,
              )}
            >
              <Icon className={cn('h-4 w-4', meta.iconText)} />
            </span>

            <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold leading-snug">{movement.reason}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {[movement.reference, movement.note].filter(Boolean).join(' · ') || '—'}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {movement.user} · {formatRelativeTime(movement.createdAt)}
                </p>
              </div>

              <span
                className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums',
                  meta.chip,
                )}
              >
                {meta.sign}
                {Math.abs(movement.delta)}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default StockTimeline;
