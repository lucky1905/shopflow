import { Activity, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/common/LoadingSkeleton';
import { useInventorySummary, useSuppliers } from '../api';
import { TIMELINE_PREVIEW_LIMIT } from '../constants';
import type { Product, StockStatus } from '../types';
import { InventoryStatCards } from './InventoryStatCards';
import { LowStockAlerts } from './LowStockAlerts';
import { StockTimeline } from './StockTimeline';

export interface InventoryAnalyticsSectionProps {
  /** Applies the matching stock filter to the table below. */
  onStockFilterChange: (status: StockStatus) => void;
  /** Opens the stock adjuster from the reorder queue. */
  onAdjustStock: (product: Product) => void;
  onViewAllLowStock: () => void;
  className?: string;
}

/**
 * Analytics band of the Inventory screen: KPI cards, the low-stock reorder
 * queue and the catalog-wide stock history feed.
 */
export function InventoryAnalyticsSection({
  onStockFilterChange,
  onAdjustStock,
  onViewAllLowStock,
  className,
}: InventoryAnalyticsSectionProps) {
  const { data, isLoading, isError, error, refetch } = useInventorySummary();
  const { data: suppliers = [] } = useSuppliers();

  if (isError && !data) {
    return (
      <ErrorState
        compact
        title="Inventory analytics unavailable"
        message={(error as { message?: string } | null)?.message}
        onRetry={() => void refetch()}
        className={cn(
          'rounded-3xl border border-black/[0.06] bg-card/85 backdrop-blur-xl dark:border-white/[0.07]',
          className,
        )}
      />
    );
  }

  if (isLoading && !data) {
    return (
      <div className={cn('space-y-6', className)} aria-busy="true">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-3xl border border-black/[0.06] bg-card/85 p-6 backdrop-blur-xl dark:border-white/[0.07]"
            >
              <Skeleton className="h-12 w-12 rounded-2xl" />
              <Skeleton className="mt-6 h-3 w-24" />
              <Skeleton className="mt-3 h-9 w-28" />
              <Skeleton className="mt-3 h-3 w-36" />
            </div>
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-3">
          <Skeleton className="h-64 rounded-3xl xl:col-span-2" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className={cn('space-y-6', className)}>
      <InventoryStatCards summary={data} onSelectStockFilter={onStockFilterChange} />

      <div className="grid gap-6 xl:grid-cols-3">
        <LowStockAlerts
          className="xl:col-span-2"
          products={data.lowStockProducts}
          suppliers={suppliers}
          onAdjustStock={onAdjustStock}
          onViewAll={data.lowStockProducts.length > 0 ? onViewAllLowStock : undefined}
        />

        <section
          aria-label="Recent stock movements"
          className={cn(
            'relative overflow-hidden rounded-3xl border border-black/[0.06] bg-card/85 p-6 backdrop-blur-xl sm:p-7',
            'shadow-[0_1px_2px_rgba(15,10,40,0.04),0_24px_60px_-24px_rgba(76,29,149,0.25)]',
            'dark:border-white/[0.07]',
          )}
        >
          <header className="flex items-start justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-base font-bold tracking-tight">
                <Activity className="h-4 w-4 text-violet-500" />
                Stock activity
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Latest movements across the catalog
              </p>
            </div>
          </header>

          <StockTimeline
            className="mt-4"
            movements={data.recentMovements}
            limit={TIMELINE_PREVIEW_LIMIT}
          />

          {data.recentMovements.length > TIMELINE_PREVIEW_LIMIT && (
            <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
              {data.recentMovements.length - TIMELINE_PREVIEW_LIMIT} older events
              <ArrowUpRight className="h-3 w-3" />
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

export default InventoryAnalyticsSection;
