/**
 * Backend endpoint registry.
 *
 * Paths mirror the FastAPI app exactly (see `backend/main.py` +
 * `backend/routers/`). Endpoints the backend does not implement yet are
 * marked and still resolve through the feature mocks.
 *
 * The dev server proxies `/api` to `VITE_API_BASE_URL` (see vite.config.ts).
 */
export const API_ENDPOINTS = {
  // Health
  HEALTH: '/',
  HEALTH_TEST: '/test',

  // Auth — implemented in Phase 7
  AUTH_LOGIN: '/auth/login',
  AUTH_REGISTER: '/auth/register',
  AUTH_REFRESH: '/auth/refresh',
  AUTH_ME: '/auth/me',
  /** Logout is client-side only: the backend is stateless JWT. */
  AUTH_LOGOUT: '/auth/logout',

  // Products (inventory) — implemented
  PRODUCTS: '/products',
  PRODUCT_BY_ID: (id: number | string) => `/products/${id}`,
  PRODUCT_BY_BARCODE: (barcode: string) => `/products/barcode/${encodeURIComponent(barcode)}`,

  // Sales / POS — implemented
  SALES: '/sales',
  SALE_BY_ID: (id: number | string) => `/sales/${id}`,

  // Sales module screens - no backend route yet, kept on the feature mocks.
  SALES_INVOICES: '/sales/invoices',
  SALES_RETURNS: '/sales/returns',
  SALES_ANALYTICS: '/sales/analytics',

  // Analytics + ML predictions — implemented
  ANALYTICS_DASHBOARD: '/analytics/',
  AI_PREDICT: '/predict/insights',

  // POS module screens - no backend route yet, kept on the feature mocks.
  POS: '/pos',
  POS_SALES: '/pos/sales',
  AI_RECOMMENDATIONS: '/ai/recommendations',

  // Not yet implemented by the backend; the feature services keep using mocks.
  INVENTORY_CATEGORIES: '/inventory/categories',
  INVENTORY_SUPPLIERS: '/inventory/suppliers',
  CUSTOMERS: '/customers',
  PURCHASES: '/purchases',
  PURCHASE_ORDERS: '/purchases/orders',
  PURCHASE_GRNS: '/purchases/grns',
  PURCHASE_PAYMENTS: '/purchases/payments',
  PURCHASE_SUPPLIERS: '/purchases/suppliers',
  REPORTS: '/reports',
  SETTINGS: '/settings',
  HELP_SUPPORT: '/help/support',
} as const;

// Default pagination
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

// Date formats
export const DATE_FORMATS = {
  DATE: 'YYYY-MM-DD',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  DISPLAY: 'MMM DD, YYYY',
  DISPLAY_TIME: 'MMM DD, YYYY HH:mm',
  FULL: 'MMMM DD, YYYY HH:mm:ss',
} as const;

export const DEFAULT_CURRENCY = 'INR';
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '\u20ac',
  GBP: '\u00a3',
  INR: '\u20b9',
};
export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '\u20ac', name: 'Euro' },
  { code: 'GBP', symbol: '\u00a3', name: 'British Pound' },
  { code: 'INR', symbol: '\u20b9', name: 'Indian Rupee' },
] as const;

export const POPULAR_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
] as const;

