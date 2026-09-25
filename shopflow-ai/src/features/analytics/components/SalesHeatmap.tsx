import { useMemo, useState } from 'react';
import { CalendarRange, Info } from 'lucide-react';
import { SectionCard } from '@/components/common/SectionCard';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { formatCurrency, formatNumber } from '@/utils/format';
import { heatColor } from '../utils';
import { HEATMAP_HOURS } from '../api/analytics.mock';
import type { AnalyticsHeatmapCell } from '../types';

export interface SalesHeatmapProps {
  cells?: AnalyticsHeatmapCell[];
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  className?: string;
}

interface HeatmapRow {
  date: string;
  label: string;
  cells: AnalyticsHeatmapCell[];
}

const formatHour = (hour: number) => `${String(hour).padStart(2, '0')}:00`;

/**
 * Heatmap-style sales grid — one row per day, one column per trading hour.
 *
 * Cells are looked up by the `hour` carried on each record. The hour must not
 * be re-derived from `cell.date`: that field is a plain YYYY-MM-DD string and
 * `new Date(...)` parses it as UTC midnight, so `getHours()` returns a
 * different value in every non-UTC timezone and the whole grid renders blank.
 */
export function SalesHeatmap({ cells, isLoading, error, onRetry, className }: SalesHeatmapProps) {
  const [hovered, setHovered] = useState<AnalyticsHeatmapCell | null>(null);

  // Group by the ISO date, then index each row by its own hour.
  const rows = useMemo<HeatmapRow[]>(() => {
    const byDate = new Map<string, HeatmapRow>();
    for (const cell of cells ?? []) {
      const row = byDate.get(cell.date) ?? { date: cell.date, label: cell.label, cells: [] };
      row.cells.push(cell);
      byDate.set(cell.date, row);
    }
    return Array.from(byDate.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((row) => ({
        ...row,
        cells: [...row.cells].sort((a, b) => a.hour - b.hour),
      }));
  }, [cells]);

  const populatedCells = rows.reduce((sum, row) => sum + row.cells.length, 0);
  const isEmpty = !isLoading && !error && populatedCells === 0;

  return (
    <SectionCard
      title="Sales activity"
      description="Revenue intensity by day and hour across the last 14 days."
      icon={<CalendarRange className="h-4 w-4" />}
      className={className}
      action={
        hovered ? (
          <span className="text-xs text-muted-foreground">
            {hovered.label} &middot; {formatHour(hovered.hour)} &middot;{' '}
            {formatCurrency(hovered.revenue)} &middot; {formatNumber(hovered.orders)} orders
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Hover a cell for detail</span>
        )
      }
    >
      {error ? (
        <ErrorState
          title="Sales activity unavailable"
          message="We could not load the activity grid."
          onRetry={onRetry}
          compact
        />
      ) : isLoading || !cells ? (
        <LoadingSkeleton variant="card" />
      ) : isEmpty ? (
        <EmptyState
          icon={<CalendarRange className="h-5 w-5" />}
          title="No trading hours recorded"
          description="There is no sales activity in this period, so there is nothing to plot yet."
          compact
        />
      ) : (
        <HeatmapGrid rows={rows} onHover={setHovered} />
      )}
    </SectionCard>
  );
}

function HeatmapGrid({
  rows,
  onHover,
}: {
  rows: HeatmapRow[];
  onHover: (cell: AnalyticsHeatmapCell | null) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <div className="min-w-[620px]">
          <div className="mb-1.5 flex pl-[52px]">
            {HEATMAP_HOURS.map((hour) => (
              <span key={hour} className="flex-1 text-center text-[10px] tabular-nums text-muted-foreground">
                {hour}
              </span>
            ))}
          </div>

          <div className="space-y-1">
            {rows.map((row) => {
              const byHour = new Map(row.cells.map((cell) => [cell.hour, cell]));
              return (
                <div key={row.date} className="flex items-center gap-1">
                  <span className="w-[46px] shrink-0 text-[11px] text-muted-foreground">{row.label}</span>
                  <div className="flex flex-1 gap-1">
                    {HEATMAP_HOURS.map((hour) => {
                      const cell = byHour.get(hour);
                      return (
                        <HeatCell key={hour} hour={hour} cell={cell} onHover={onHover} />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <HeatmapLegend />
    </div>
  );
}

/** A single hour cell. Renders a muted placeholder when no data exists. */
function HeatCell({
  hour,
  cell,
  onHover,
}: {
  hour: number;
  cell?: AnalyticsHeatmapCell;
  onHover: (cell: AnalyticsHeatmapCell | null) => void;
}) {
  if (!cell) {
    return (
      <div
        className="h-6 flex-1 rounded bg-muted/40"
        title={`${formatHour(hour)} - no sales recorded`}
        onMouseEnter={() => onHover(null)}
        onMouseLeave={() => onHover(null)}
      />
    );
  }

  return (
    <div
      className="h-6 flex-1 cursor-pointer rounded transition-transform hover:scale-110 hover:ring-1 hover:ring-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      style={{ backgroundColor: heatColor(cell.intensity) }}
      tabIndex={0}
      role="img"
      aria-label={`${cell.label} at ${formatHour(hour)}: ${formatCurrency(cell.revenue)}, ${formatNumber(cell.orders)} orders`}
      title={`${cell.label} ${formatHour(hour)} - ${formatCurrency(cell.revenue)} (${formatNumber(cell.orders)} orders)`}
      onMouseEnter={() => onHover(cell)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(cell)}
      onBlur={() => onHover(null)}
    />
  );
}

/** Legend so the colour scale is interpretable. */
function HeatmapLegend() {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 text-[11px] text-muted-foreground">
      <span>Low</span>
      <div className="flex gap-0.5">
        {[0, 0.25, 0.5, 0.75, 1].map((step) => (
          <span key={step} className="h-3 w-5 rounded-sm" style={{ backgroundColor: heatColor(step) }} />
        ))}
      </div>
      <span>High</span>
      <span className="ml-1 inline-flex items-center gap-1">
        <Info className="h-3 w-3" />
        Colour shows relative revenue
      </span>
    </div>
  );
}
