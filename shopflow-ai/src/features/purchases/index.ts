/**
 * Sales & Purchase Management — Purchases module (Phase 4).
 *
 *   features/purchases/
 *     ├── api/          # mock + real service, TanStack Query hooks
 *     ├── components/   # header, stats, charts, filters, GRN/payment modals
 *     ├── hooks/        # persisted Zustand filter stores
 *     ├── pages/        # route screens (re-exported through src/pages)
 *     ├── constants.ts  # status metadata, filter options, chart palette
 *     ├── schemas.ts    # zod form schemas (GRN, payment)
 *     ├── types.ts      # domain contracts
 *     └── utils.ts      # PO math, filtering, date helpers
 *
 * NOTE: `./utils` is intentionally NOT re-exported — its generic helpers
 * (`roundMoney`, `paginate`, …) share names with the sales/POS barrels.
 * Import them from `@/features/purchases/utils` when needed.
 *
 * UI code should import from this barrel (or a specific file) and never talk
 * to the mock database directly — swapping mock → API happens in `api/`.
 */
export * from './types';
export * from './constants';
export * from './schemas';
export * from './api';
export * from './hooks';
export * from './components';
export * from './pages';