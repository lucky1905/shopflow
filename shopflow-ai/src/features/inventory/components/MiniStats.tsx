import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface MiniStatItem {
  label: string;
  value: string;
  /** Secondary line under the value. */
  hint?: string;
  icon?: ReactNode;
}

export interface MiniStatsProps {
  items: MiniStatItem[];
  className?: string;
}

/**
 * Compact glass KPI strip (2–4 items) used by the Categories and Suppliers
 * screens — the light-weight sibling of the Inventory analytics cards.
 */
export function MiniStats({ items, className }: MiniStatsProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4',
        items.length <= 3 && 'lg:grid-cols-3',
        className,
      )}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            'flex items-start gap-3 rounded-2xl border border-black/[0.06] bg-card/85 p-4 backdrop-blur-xl',
            'shadow-[0_1px_2px_rgba(15,10,40,0.04),0_20px_50px_-30px_rgba(76,29,149,0.35)]',
            'dark:border-white/[0.07]',
          )}
        >
          {item.icon && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/15 to-fuchsia-500/15 text-violet-600 dark:text-violet-400">
              {item.icon}
            </span>
          )}
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-1 truncate text-xl font-black tracking-tight tabular-nums">
              {item.value}
            </p>
            {item.hint && (
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{item.hint}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default MiniStats;
