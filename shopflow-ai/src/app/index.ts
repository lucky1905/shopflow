/**
 * App-level composition (providers, bootstrap gate) lives here as the
 * project grows. Currently `src/main.tsx` owns the provider tree:
 * QueryClientProvider → BootstrapGate (theme + session) → RouterProvider.
 *
 * Keep this folder for future app-wide concerns (e.g. feature flags,
 * realtime connections, global error boundaries) so `main.tsx` stays thin.
 */
export {};
