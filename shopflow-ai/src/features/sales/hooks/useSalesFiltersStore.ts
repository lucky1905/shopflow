import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@/constants';
import { DEFAULT_RETURN_FILTERS, DEFAULT_SALES_FILTERS } from '../constants';
import type { SalesFilters, SalesReturnFilters } from '../types';

/* -------------------------------------------------------------------------- */
/*  Invoice table filters (persisted across sessions)                         */
/* -------------------------------------------------------------------------- */

export type SalesDatePreset = '7d' | '30d' | '90d' | 'custom';

interface SalesFiltersState extends SalesFilters {
  preset: SalesDatePreset;
  /** Merges a patch; resets pagination unless the patch provides `page`. */
  patch: (values: Partial<SalesFilters> & { preset?: SalesDatePreset }) => void;
  /** Applies a quick date preset (`custom` keeps existing bounds). */
  applyPreset: (preset: SalesDatePreset) => void;
  reset: () => void;
}

function presetRange(preset: SalesDatePreset): { dateFrom: string; dateTo: string } {
  if (preset === 'custom') return { dateFrom: '', dateTo: '' };
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
  const from = new Date();
  from.setDate(from.getDate() - days);
  return {
    dateFrom: from.toISOString().slice(0, 10),
    dateTo: new Date().toISOString().slice(0, 10),
  };
}

export const useSalesFiltersStore = create<SalesFiltersState>()(
  persist(
    (set) => ({
      ...DEFAULT_SALES_FILTERS,
      preset: 'custom',
      patch: (values) =>
        set((state) => ({
          ...state,
          ...values,
          page: values.page ?? state.page,
        })),
      applyPreset: (preset) =>
        set((state) => ({
          ...state,
          ...(preset === 'custom' ? {} : presetRange(preset)),
          preset,
          page: 1,
        })),
      reset: () => set({ ...DEFAULT_SALES_FILTERS, preset: 'custom' }),
    }),
    { name: STORAGE_KEYS.SALES_FILTERS },
  ),
);

/* -------------------------------------------------------------------------- */
/*  Returns table filters                                                     */
/* -------------------------------------------------------------------------- */

interface SalesReturnFiltersState extends SalesReturnFilters {
  patch: (values: Partial<SalesReturnFilters>) => void;
  reset: () => void;
}

export const useSalesReturnFiltersStore = create<SalesReturnFiltersState>()(
  persist(
    (set) => ({
      ...DEFAULT_RETURN_FILTERS,
      patch: (values) =>
        set((state) => ({ ...state, ...values, page: values.page ?? state.page })),
      reset: () => set({ ...DEFAULT_RETURN_FILTERS }),
    }),
    { name: `${STORAGE_KEYS.SALES_FILTERS}-returns` },
  ),
);