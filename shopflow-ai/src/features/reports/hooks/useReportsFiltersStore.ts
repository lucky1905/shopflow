import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/constants';
import { DEFAULT_REPORT_FILTERS, REPORT_PRESETS } from '../constants';
import type { ReportsDatePreset, ReportsFilterParams } from '../types';

interface ReportsFiltersState extends ReportsFilterParams {
  patch: (values: Partial<ReportsFilterParams>) => void;
  applyPreset: (preset: ReportsDatePreset) => void;
  reset: () => void;
}

function calculateDatesForPreset(preset: ReportsDatePreset): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();

  if (preset === 'today') {
    return {
      startDate: end.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    };
  }

  const presetConfig = REPORT_PRESETS.find((p) => p.value === preset);
  const days = presetConfig?.days ?? 30;
  start.setDate(end.getDate() - days);

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

export const useReportsFiltersStore = create<ReportsFiltersState>()(
  persist(
    (set) => ({
      ...DEFAULT_REPORT_FILTERS,
      patch: (values) =>
        set((state) => ({
          ...state,
          ...values,
        })),
      applyPreset: (preset) => {
        if (preset === 'custom') {
          set((state) => ({ ...state, preset: 'custom' }));
        } else {
          const { startDate, endDate } = calculateDatesForPreset(preset);
          set((state) => ({
            ...state,
            preset,
            startDate,
            endDate,
          }));
        }
      },
      reset: () => set(DEFAULT_REPORT_FILTERS),
    }),
    {
      name: STORAGE_KEYS.REPORTS_FILTERS,
    },
  ),
);
