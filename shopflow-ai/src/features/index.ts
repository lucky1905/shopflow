/**
 * Feature-module registry (placeholder).
 *
 * Each business module (inventory, pos, customers, …) will own:
 *   features/<module>/
 *     ├── api.ts            # TanStack Query hooks + service calls
 *     ├── components/       # module-specific UI
 *     ├── pages/            # route-level screens (re-exported via src/pages)
 *     ├── schemas.ts        # zod schemas
 *     └── types.ts          # module types (re-exported via src/types)
 *
 * Domain logic does NOT live here yet by design – this foundation only
 * provides layouts, routing, reusable components, auth UI, stores, theme
 * and the API layer for modules to plug into.
 */
export {};
