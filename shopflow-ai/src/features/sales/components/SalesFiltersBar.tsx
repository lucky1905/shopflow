import { FilterBar } from '@/components/common/FilterBar';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import { CHANNEL_OPTIONS, DEFAULT_SALES_FILTERS, INVOICE_STATUS_OPTIONS } from '../constants';
import { useSalesFiltersStore, type SalesDatePreset } from '../hooks';
import type { SalesFilters } from '../types';

const PRESETS: Array<{ value: SalesDatePreset; label: string }> = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: 'custom', label: 'Custom' },
];

function activeFilterCount(filters: SalesFilters, preset: SalesDatePreset): number {
  let count = 0;
  if (filters.status !== DEFAULT_SALES_FILTERS.status) count += 1;
  if (filters.channel !== DEFAULT_SALES_FILTERS.channel) count += 1;
  if (filters.dateFrom || filters.dateTo) count += 1;
  if (preset !== 'custom') count += 1;
  if (filters.minAmount) count += 1;
  if (filters.maxAmount) count += 1;
  return count;
}

/**
 * Advanced filter panel for invoice tables: status, channel, quick date
 * ranges with exact bounds, and min/max amounts. State lives in the persisted
 * Zustand store so filters survive navigation and reloads.
 */
export function SalesFiltersBar() {
  const filters = useSalesFiltersStore();
  const patch = useSalesFiltersStore((state) => state.patch);
  const reset = useSalesFiltersStore((state) => state.reset);
  const applyPreset = useSalesFiltersStore((state) => state.applyPreset);

  return (
    <FilterBar
      activeCount={activeFilterCount(filters, filters.preset)}
      onReset={reset}
      label="Advanced filters"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          aria-label="Status"
          value={filters.status}
          onChange={(event) => patch({ status: event.target.value as SalesFilters['status'], page: 1 })}
          options={INVOICE_STATUS_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          className="h-9 text-sm"
        />
        <Select
          aria-label="Channel"
          value={filters.channel}
          onChange={(event) => patch({ channel: event.target.value as SalesFilters['channel'], page: 1 })}
          options={CHANNEL_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
          className="h-9 text-sm"
        />

        <div className="flex items-end gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => applyPreset(preset.value)}
              className={cn(
                'h-9 rounded-lg border px-2.5 text-xs font-semibold transition-colors',
                filters.preset === preset.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-muted-foreground hover:bg-accent',
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Input
            type="date"
            aria-label="From date"
            value={filters.dateFrom}
            onChange={(event) => patch({ dateFrom: event.target.value, preset: 'custom', page: 1 })}
            className="h-9 text-sm"
          />
          <Input
            type="date"
            aria-label="To date"
            value={filters.dateTo}
            onChange={(event) => patch({ dateTo: event.target.value, preset: 'custom', page: 1 })}
            className="h-9 text-sm"
          />
        </div>

        <Input
          type="number"
          aria-label="Minimum amount"
          placeholder="Min amount"
          value={filters.minAmount}
          onChange={(event) => patch({ minAmount: event.target.value, page: 1 })}
          className="h-9 text-sm"
        />
        <Input
          type="number"
          aria-label="Maximum amount"
          placeholder="Max amount"
          value={filters.maxAmount}
          onChange={(event) => patch({ maxAmount: event.target.value, page: 1 })}
          className="h-9 text-sm"
        />
      </div>
    </FilterBar>
  );
}

export default SalesFiltersBar;