/**
 * Inventory feature module (Phase 2).
 *
 *   features/inventory/
 *     ├── api/          # mock + real service, TanStack Query hooks
 *     ├── components/   # module UI (table, drawer, modals, timeline, cards)
 *     ├── hooks/        # filter + row-selection state
 *     ├── pages/        # route screens (re-exported through src/pages)
 *     ├── constants.ts  # options, metadata, limits
 *     ├── schemas.ts    # zod form schemas
 *     ├── types.ts      # domain contracts
 *     └── utils.ts      # SKU/barcode, stock, CSV helpers
 *
 * UI code should import from this barrel (or a specific file) and never talk to
 * the mock database directly — swapping mock → API happens in `api/`.
 */
export * from './types';
export * from './constants';
export * from './schemas';
export * from './utils';
export * from './api';
export * from './hooks';
export * from './components';
export * from './pages';
