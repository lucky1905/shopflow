import { AlertTriangle, Boxes, PackageX, Users } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/format';
import type { AnalyticsInventoryPerformance } from '../types';

/** Inventory performance: stock health, turns and top movers. */
export function InventoryPerformancePanel({
  data,
  isLoading,
  className,
}: {
  data?: AnalyticsInventoryPerformance;
  isLoading?: boolean;
  className?: string;
}) {
  if (isLoading || !data) {
    return (
      <div className={className}>
        <LoadingRows rows={4} />
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Total SKUs" value={formatNumber(data.totalSkus)} />
        <MiniStat label="Sell-through" value={`${data.sellThroughPct.toFixed(1)}%`} tone="success" />
        <MiniStat label="Stock turns" value={data.stockTurns.toFixed(1)} tone="primary" />
        <MiniStat label="Dead stock" value={formatCurrency(data.deadStockValue)} tone="warning" />
      </div>

      <ul className="space-y-2.5 text-sm">
        <StatusRow icon={PackageX} label="Out of stock" value={formatNumber(data.outOfStock)} tone="destructive" />
        <StatusRow icon={AlertTriangle} label="Low stock" value={formatNumber(data.lowStock)} tone="warning" />
        <StatusRow icon={Boxes} label="Overstocked" value={formatNumber(data.overstocked)} tone="primary" />
        <StatusRow icon={Users} label="Active SKUs" value={formatNumber(data.activeSkus)} tone="success" />
      </ul>

      <div className="mt-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Top movers</p>
        <ul className="space-y-1.5">
          {data.topMovers.slice(0, 4).map((mover) => (
            <li key={mover.sku} className="flex items-center justify-between text-xs">
              <span className="min-w-0 truncate text-foreground">{mover.name}</span>
              <span className="shrink-0 font-medium tabular-nums text-muted-foreground">
                {formatNumber(mover.units)} units
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function MiniStat({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'destructive';
}) {
  const toneClass =
    tone === 'success'
      ? 'text-success'
      : tone === 'warning'
        ? 'text-warning'
        : tone === 'destructive'
          ? 'text-destructive'
          : tone === 'primary'
            ? 'text-primary'
            : 'text-foreground';

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5">
      <p className="truncate text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold tabular-nums ${toneClass}`}>{value}</p>
    </div>
  );
}

export function StatusRow({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Boxes;
  label: string;
  value: string;
  tone: 'primary' | 'success' | 'warning' | 'destructive';
}) {
  const color =
    tone === 'destructive'
      ? 'text-destructive'
      : tone === 'warning'
        ? 'text-warning'
        : tone === 'success'
          ? 'text-success'
          : 'text-primary';

  return (
    <li className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className={`h-3.5 w-3.5 ${color}`} />
        {label}
      </span>
      <span className={`font-semibold tabular-nums ${color}`}>{value}</span>
    </li>
  );
}

export function LoadingRows({ rows }: { rows: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center justify-between">
          <span className="h-3 w-28 animate-pulse rounded bg-muted" />
          <span className="h-3 w-16 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
