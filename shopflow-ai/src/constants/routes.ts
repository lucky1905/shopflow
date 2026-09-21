/**
 * Central route path registry.
 * Always reference paths through `ROUTES` so refactors stay safe.
 */
export const ROUTES = {
  // Public
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  // Dashboard shell
  DASHBOARD: '/dashboard',
  INVENTORY: '/inventory',
  POS: '/pos',
  CUSTOMERS: '/customers',
  SUPPLIERS: '/suppliers',
  SALES: '/sales',
  PRODUCTS: '/products',
  CATEGORIES: '/categories',
  PURCHASES: '/purchases',
  REPORTS: '/reports',
  ANALYTICS: '/analytics',
  AI_INSIGHTS: '/ai-insights',
  SETTINGS: '/settings',
  HELP: '/help',
  PROFILE: '/profile',

  // Errors
  UNAUTHORIZED: '/unauthorized',
  NOT_FOUND: '*',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

/** Publicly accessible paths (no session required). */
export const PUBLIC_PATHS: string[] = [
  ROUTES.HOME,
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
];

/** Paths that must never be reached while authenticated. */
export const AUTH_ONLY_PATHS: string[] = [
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
];
