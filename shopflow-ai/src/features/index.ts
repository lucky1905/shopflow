/**
 * Feature-module registry.
 *
 * Each business module (inventory, pos, customers, …) owns:
 *   features/<module>/
 *     ├── api/              # service calls + TanStack Query hooks
 *     ├── components/       # module-specific UI
 *     ├── hooks/            # module state helpers
 *     ├── pages/            # route-level screens (re-exported via src/pages)
 *     ├── schemas.ts        # zod schemas
 *     └── types.ts          # module types
 */
export * from './inventory';
export * from './pos';
export * from './purchases';
export * from './sales';
export * from './reports';
export * from './analytics';
export * from './ai';
