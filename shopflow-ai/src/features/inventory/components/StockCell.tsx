import { Badge } from '@/components/common/Badge';
import { cn } from '@/lib/utils';
import { STOCK_STATUS_META } from '../constants';
import { getStockStatus } from '../utils';

export interface StockCellProps {
  stock: number;
  reorderPoint: number;
  unit: string;
  /** Compact variant fits the analytics drawer rows. */
  compact?: boolean;
  className?: string;
}

/**
 * Quantity + status pill + fill meter, computed from stock vs reorder point.
 * The single source of stock-status presentation across the module.
 */
export function StockCell({ stock, reorderPoint, unit, compact = false, className }: StockCellProps) {
  const status = getStockStatus(stock, reorderPoint);
  const meta = STOCK_STATUS_META[status];
  const fillPct = Math.min(100, Math.round((stock / Math.max(reorderPoint * 2, 1)) * 100));

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span className="text-[13px] font-bold tabular-nums">{stock}</span>
        <span className={cn('inline-flex items-center gap-1 text-[11px] font-semibold', meta.text)}>
          {meta.pulse && (
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
            </span>
          )}
          {meta.label}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold tabular-nums">
          {stock}
          <span className="ml-0.5 text-[10px] font-medium text-muted-foreground">{unit}</span>
        </span>
        <Badge variant={meta.badge} size="sm" dot={meta.pulse}>
          {meta.label}
        </Badge>
      </div>
      <div className="h-1 w-full max-w-[7rem] overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
        <div
          className={cn('h-full rounded-full transition-all', meta.bar)}
          style={{ width: `${fillPct}%` }}
        />
      </div>
      <span className="text-[10px] font-medium text-muted-foreground">
        reorder at {reorderPoint}
      </span>
    </div>
  );
}

export default StockCell;
