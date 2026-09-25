import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ANALYTICS_DATE_PRESETS, DEFAULT_ANALYTICS_FILTERS } from '../constants';
import type { AnalyticsDatePreset, AnalyticsFilters } from '../types';

interface AnalyticsFiltersState extends AnalyticsFilters {
  patch: (values: Partial<AnalyticsFilters>) => void;
  applyPreset: (preset: AnalyticsDatePreset) => void;
  reset: () => void;
}

const toISODate = (date: Date) => date.toISOString().slice(0, 10);

export function datesForPreset(preset: AnalyticsDatePreset): { startDate: string; endDate: string } {
  const end = new Date();
  if (preset === 'today') {
    return { startDate: toISODate(end), endDate: toISODate(end) };
  }
  const days = ANALYTICS_DATE_PRESETS.find((option) => option.value === preset)?.days ?? 30;
  const start = new Date(end.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  return { startDate: toISODate(start), endDate: toISODate(end) };
}

export const useAnalyticsFiltersStore = create<AnalyticsFiltersState>()(
  persist(
    (set) => ({
      ...DEFAULT_ANALYTICS_FILTERS,
      ...datesForPreset(DEFAULT_ANALYTICS_FILTERS.preset),
      patch: (values) => set((state) => ({ ...state, ...values })),
      applyPreset: (preset) => {
        if (preset === 'custom') {
          set((state) => ({ ...state, preset: 'custom' }));
          return;
        }
        set((state) => ({ ...state, preset, ...datesForPreset(preset) }));
      },
      reset: () => set({ ...DEFAULT_ANALYTICS_FILTERS, ...datesForPreset(DEFAULT_ANALYTICS_FILTERS.preset) }),
    }),
    { name: 'shopflow-analytics-filters' },
  ),
);
