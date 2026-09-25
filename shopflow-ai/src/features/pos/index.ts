/**
 * Smart POS feature module (Phase 3 — billing).
 *
 *   features/pos/
 *     ├── api/          # mock + real service, TanStack Query hooks
 *     ├── components/   # split-screen UI (grid, cart, payments, receipts)
 *     ├── hooks/        # persisted cart store + keyboard shortcuts
 *     ├── pages/        # route screens (re-exported through src/pages)
 *     ├── constants.ts  # payment/tax/discount metadata, limits
 *     ├── schemas.ts    # zod form schemas
 *     ├── types.ts      # domain contracts
 *     └── utils.ts      # cart math, search scoring, receipt helpers
 *
 * UI code should import from this barrel (or a specific file) and never talk
 * to the mock database directly — swapping mock → API happens in `api/`.
 */
export * from './types';
export * from './constants';
export * from './schemas';
export * from './utils';
export * from './api';
export * from './hooks';
export * from './components';
export * from './pages';