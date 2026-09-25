// App configuration constants
export const APP_NAME = 'ShopFlow AI';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'AI-Powered Inventory Management & POS Platform';
export const APP_TAGLINE = 'AI-powered inventory & POS for modern retail';

// Persistence keys (single source of truth for localStorage / zustand persist)
export const STORAGE_KEYS = {
  AUTH: 'shopflow-auth',
  ACCESS_TOKEN: 'shopflow-token',
  REFRESH_TOKEN: 'shopflow-refresh-token',
  USER: 'shopflow-user',
  THEME: 'shopflow-theme',
  SIDEBAR: 'shopflow-sidebar',
  STORE: 'shopflow-store',
  POS_CART: 'shopflow-pos-cart',
  SALES_FILTERS: 'shopflow-sales-filters',
  PURCHASE_FILTERS: 'shopflow-purchase-filters',
  REPORTS_FILTERS: 'shopflow-reports-filters',
} as const;

export * from './routes';
export * from './navigation';
export * from './api';
