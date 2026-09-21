import { cn } from '@/lib/utils';

export interface SkeletonProps {
  className?: string;
}

/** Base shimmer block. Compose it to build layout-specific skeletons. */
export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />;
}

export interface LoadingSkeletonProps {
  /** `page` = hero + cards + table, `card` = single card, `list` = rows. */
  variant?: 'page' | 'card' | 'list' | 'table';
  rows?: number;
  className?: string;
}

function ListSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="flex gap-4 border-b border-border bg-muted/50 px-4 py-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="ml-auto h-3 w-16" />
      </div>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 border-b border-border px-4 py-3.5 last:border-0">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="ml-auto h-6 w-14 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/**
 * Content placeholder used while data loads and as the Suspense fallback
 * for lazily-loaded routes.
 */
export function LoadingSkeleton({ variant = 'page', rows = 5, className }: LoadingSkeletonProps) {
  if (variant === 'card') {
    return (
      <div className={cn('rounded-xl border border-border bg-card p-5 shadow-sm', className)}>
        <div className="space-y-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={className}>
        <ListSkeleton rows={rows} />
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={className}>
        <TableSkeleton rows={rows} />
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)} aria-busy="true" aria-live="polite">
      <div className="space-y-2">
        <Skeleton className="h-6 w-52" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-7 w-20" />
            <Skeleton className="mt-3 h-3 w-16" />
          </div>
        ))}
      </div>

      <TableSkeleton rows={rows} />
    </div>
  );
}

export default LoadingSkeleton;