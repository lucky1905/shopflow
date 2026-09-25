import { FilterBar } from '@/components/common/FilterBar';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import {
  REPORT_CATEGORIES,
  REPORT_CHANNELS,
  REPORT_PRESETS,
  REPORT_STORES,
} from '../constants';
import { useReportsFiltersStore } from '../hooks';

export interface ReportsFilterBarProps {
  showChannelFilter?: boolean;
  showCategoryFilter?: boolean;
  showSearch?: boolean;
  searchPlaceholder?: string;
}

export function ReportsFilterBar({
  showChannelFilter = true,
  showCategoryFilter = false,
  showSearch = false,
  searchPlaceholder = 'Search records...',
}: ReportsFilterBarProps) {
  const filters = useReportsFiltersStore();
  const patch = useReportsFiltersStore((state) => state.patch);
  const reset = useReportsFiltersStore((state) => state.reset);
  const applyPreset = useReportsFiltersStore((state) => state.applyPreset);

  let activeCount = 0;
  if (filters.preset !== '30d') activeCount++;
  if (filters.channel && filters.channel !== 'all') activeCount++;
  if (filters.category && filters.category !== 'all') activeCount++;
  if (filters.storeId && filters.storeId !== 'all') activeCount++;
  if (filters.search) activeCount++;

  return (
    <FilterBar
      activeCount={activeCount}
      onReset={reset}
      label="Report Filters"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Preset date buttons */}
        <div className="flex flex-wrap items-center gap-1.5 sm:col-span-2">
          {REPORT_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => applyPreset(preset.value)}
              className={cn(
                'h-9 rounded-lg border px-3 text-xs font-semibold transition-colors',
                filters.preset === preset.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-muted-foreground hover:bg-accent',
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Store location filter */}
        <Select
          aria-label="Location"
          value={filters.storeId ?? 'all'}
          onChange={(e) => patch({ storeId: e.target.value })}
          options={REPORT_STORES.map((s) => ({ value: s.value, label: s.label }))}
          className="h-9 text-sm"
        />

        {/* Channel filter (optional per tab) */}
        {showChannelFilter && (
          <Select
            aria-label="Channel"
            value={filters.channel ?? 'all'}
            onChange={(e) => patch({ channel: e.target.value as any })}
            options={REPORT_CHANNELS.map((c) => ({ value: c.value, label: c.label }))}
            className="h-9 text-sm"
          />
        )}

        {/* Category filter (optional per tab) */}
        {showCategoryFilter && (
          <Select
            aria-label="Category"
            value={filters.category ?? 'all'}
            onChange={(e) => patch({ category: e.target.value })}
            options={REPORT_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
            className="h-9 text-sm"
          />
        )}

        {/* Exact date bounds */}
        <div className="flex items-center gap-2 sm:col-span-2">
          <div className="w-1/2">
            <Input
              type="date"
              aria-label="Start date"
              value={filters.startDate}
              onChange={(e) => {
                patch({ startDate: e.target.value, preset: 'custom' });
              }}
              className="h-9 text-xs"
            />
          </div>
          <span className="text-xs text-muted-foreground">to</span>
          <div className="w-1/2">
            <Input
              type="date"
              aria-label="End date"
              value={filters.endDate}
              onChange={(e) => {
                patch({ endDate: e.target.value, preset: 'custom' });
              }}
              className="h-9 text-xs"
            />
          </div>
        </div>

        {/* Optional Search */}
        {showSearch && (
          <div className="sm:col-span-2 lg:col-span-2">
            <Input
              placeholder={searchPlaceholder}
              value={filters.search ?? ''}
              onChange={(e) => patch({ search: e.target.value })}
              className="h-9 text-sm"
            />
          </div>
        )}
      </div>
    </FilterBar>
  );
}
