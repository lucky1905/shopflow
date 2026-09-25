/**
 * Sales & Purchase Management — Sales module (Phase 4).
 *
 *   features/sales/
 *     ├── api/          # mock + real service, TanStack Query hooks
 *     ├── components/   # header, stats, charts, filters, printable invoice
 *     ├── hooks/        # persisted Zustand filter stores
 *     ├── pages/        # route screens (re-exported through src/pages)
 *     ├── constants.ts  # status metadata, filter options, chart palette
 *     ├── types.ts      # domain contracts
 *     └── utils.ts      # invoice math, filtering, pagination helpers
 *
 * NOTE: `./utils` is intentionally NOT re-exported — its generic helpers
 * (`roundMoney`, `paginate`, …) share names with the POS/inventory barrels.
 * Import them from `@/features/sales/utils` when needed.
 *
 * UI code should import from this barrel (or a specific file) and never talk
 * to the mock database directly — swapping mock → API happens in `api/`.
 */
export * from './types';
export * from './constants';
export * from './api';
export * from './hooks';
export * from './components';
export * from './pages';