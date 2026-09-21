import type { ReactNode } from 'react';
import { PackageOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  /** Secondary action rendered beside the primary one. */
  secondaryAction?: ReactNode;
  className?: string;
  compact?: boolean;
}

/**
 * Friendly zero-data state. Used by tables, lists and dashboards so every
 * module communicates "what to do next" instead of showing a blank panel.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'gap-2 px-4 py-8' : 'gap-4 px-6 py-16',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-highlight/10 text-primary ring-1 ring-primary/15',
          compact ? 'h-11 w-11' : 'h-14 w-14',
        )}
      >
        {icon ?? <PackageOpen className={compact ? 'h-5 w-5' : 'h-6 w-6'} />}
      </div>

      <div className="space-y-1">
        <h3 className={cn('font-semibold text-foreground', compact ? 'text-sm' : 'text-base')}>
          {title}
        </h3>
        {description && (
          <p className="mx-auto max-w-md text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}

export default EmptyState;