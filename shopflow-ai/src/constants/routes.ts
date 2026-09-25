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
  SALES_HISTORY: '/sales/history',
  SALES_RETURNS: '/sales/returns',
  SALES_ANALYTICS: '/sales/analytics',
  /** Route pattern (with `:id`) — use `invoicePath()` when navigating. */
  SALES_INVOICE: '/sales/invoices/:id',
  PRODUCTS: '/products',
  CATEGORIES: '/categories',
  PURCHASES: '/purchases',
  PURCHASE_ORDERS: '/purchases/orders',
  PURCHASE_SUPPLIER_ORDERS: '/purchases/supplier-orders',
  PURCHASE_GRN: '/purchases/grn',
  PURCHASE_HISTORY: '/purchases/history',
  PURCHASE_DELIVERIES: '/purchases/deliveries',
  PURCHASE_PAYMENTS: '/purchases/payments',
  /** Route pattern (with `:id`) — use `purchaseOrderPath()` when navigating. */
  PURCHASE_ORDER: '/purchases/orders/:id',
  // Reports & Analytics (Phase 5)
  REPORTS: '/reports',
  REPORTS_REVENUE: '/reports/revenue',
  REPORTS_SALES: '/reports/sales',
  REPORTS_PURCHASES: '/reports/purchases',
  REPORTS_INVENTORY: '/reports/inventory',
  REPORTS_CUSTOMERS: '/reports/customers',
  REPORTS_SUPPLIERS: '/reports/suppliers',
  REPORTS_PROFIT_LOSS: '/reports/profit-loss',
  REPORTS_TAX: '/reports/tax',
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

/** Concrete path for an invoice details screen. */
export const invoicePath = (id: string): string => `/sales/invoices/${id}`;

/** Concrete path for a purchase order details screen. */
export const purchaseOrderPath = (id: string): string => `/purchases/orders/${id}`;

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
