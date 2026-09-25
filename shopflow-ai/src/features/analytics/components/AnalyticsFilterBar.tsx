import { Calendar, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { ANALYTICS_DATE_PRESETS, ANALYTICS_STORES } from '../constants';
import { useAnalyticsFiltersStore } from '../hooks/useAnalyticsFiltersStore';
import type { AnalyticsDatePreset } from '../types';

export interface AnalyticsFilterBarProps {
  className?: string;
}

/** Date-range presets, custom range inputs and the store selector. */
export function AnalyticsFilterBar({ className }: AnalyticsFilterBarProps) {
  const filters = useAnalyticsFiltersStore();
  const { applyPreset, patch, reset } = filters;

  return (
    <div className={cn('flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <div
          role="group"
          aria-label="Date range"
          className="inline-flex flex-wrap gap-1 rounded-lg border border-border bg-muted/40 p-0.5"
        >
          {ANALYTICS_DATE_PRESETS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => applyPreset(option.value as AnalyticsDatePreset)}
              aria-pressed={filters.preset === option.value}
              className={cn(
                'rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                filters.preset === option.value
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {filters.preset === 'custom' && (
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              aria-label="Start date"
              leftIcon={<Calendar className="h-3.5 w-3.5" />}
              value={filters.startDate}
              max={filters.endDate || undefined}
              onChange={(event) => patch({ startDate: event.target.value })}
              className="h-9 w-[150px] text-xs"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              aria-label="End date"
              leftIcon={<Calendar className="h-3.5 w-3.5" />}
              value={filters.endDate}
              min={filters.startDate || undefined}
              onChange={(event) => patch({ endDate: event.target.value })}
              className="h-9 w-[150px] text-xs"
            />
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
          onClick={reset}
          className="h-9"
        >
          Reset
        </Button>
      </div>

      <Select
        aria-label="Store"
        value={filters.storeId}
        onChange={(event) => patch({ storeId: event.target.value })}
        options={ANALYTICS_STORES.map((store) => ({ value: store.value, label: store.label }))}
        className="h-9 w-full text-xs lg:w-[220px]"
      />
    </div>
  );
}


