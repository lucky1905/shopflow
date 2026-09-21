// API endpoints (consumed by the service layer)
export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: '/auth/login',
  AUTH_REGISTER: '/auth/register',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_REFRESH: '/auth/refresh',
  AUTH_ME: '/auth/me',
  AUTH_FORGOT_PASSWORD: '/auth/forgot-password',
  AUTH_RESET_PASSWORD: '/auth/reset-password',

  // Users
  USERS: '/users',
  USERS_PROFILE: '/users/profile',

  // Stores
  STORES: '/stores',
  STORES_CURRENT: '/stores/current',

  // Inventory
  INVENTORY: '/inventory',
  INVENTORY_ITEMS: '/inventory/items',
  INVENTORY_CATEGORIES: '/inventory/categories',
  INVENTORY_SUPPLIERS: '/inventory/suppliers',

  // POS
  POS: '/pos',
  POS_SALES: '/pos/sales',
  POS_RECEIPTS: '/pos/receipts',
  POS_CUSTOMERS: '/pos/customers',

  // Reports
  REPORTS: '/reports',
  REPORTS_SALES: '/reports/sales',
  REPORTS_INVENTORY: '/reports/inventory',
  REPORTS_PROFIT: '/reports/profit',

  // Analytics
  ANALYTICS: '/analytics',
  ANALYTICS_DASHBOARD: '/analytics/dashboard',

  // AI Insights
  AI_INSIGHTS: '/ai/insights',
  AI_PREDICTIONS: '/ai/predictions',
  AI_RECOMMENDATIONS: '/ai/recommendations',

  // Settings
  SETTINGS: '/settings',
  SETTINGS_GENERAL: '/settings/general',
  SETTINGS_USERS: '/settings/users',
  SETTINGS_ROLES: '/settings/roles',
  SETTINGS_STORES: '/settings/stores',
  SETTINGS_NOTIFICATIONS: '/settings/notifications',
  SETTINGS_THEME: '/settings/theme',

  // Help
  HELP_DOCUMENTATION: '/help/documentation',
  HELP_SUPPORT: '/help/support',
  HELP_ABOUT: '/help/about',
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

// Currency
export const DEFAULT_CURRENCY = 'USD';
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
};
export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
] as const;

// Timezones
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