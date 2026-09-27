/**
 * Central route path registry.
 * Always reference paths through `ROUTES` so refactors stay safe.
 */
export const ROUTES = {
  // Public & Authentication
  HOME: '/',
  LOGIN: '/login',
  ADMIN_LOGIN: '/admin/login',
  EMPLOYEE_LOGIN: '/employee/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  // Employee workspace (Phase 10)
  EMPLOYEE_ROOT: '/employee',
  EMPLOYEE_BILLING: '/employee/billing',
  EMPLOYEE_RETURNS: '/employee/returns',

  // Dashboard shell (Owner / Admin)
  DASHBOARD: '/dashboard',
  INVENTORY: '/inventory',
  POS: '/pos',
  /**
   * Cashier workspace — a full-screen Express Billing till with no admin
   * chrome. This is the only screen a cashier can reach.
   */
  CASHIER_BILLING: '/billing',
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
  ROUTES.ADMIN_LOGIN,
  ROUTES.EMPLOYEE_LOGIN,
  ROUTES.REGISTER,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
];

/** Paths that must never be reached while authenticated. */
export const AUTH_ONLY_PATHS: string[] = [
  ROUTES.LOGIN,
  ROUTES.ADMIN_LOGIN,
  ROUTES.EMPLOYEE_LOGIN,
  ROUTES.REGISTER,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
];
