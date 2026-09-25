import type { ReportsDatePreset } from './types';

export const REPORT_PRESETS: Array<{ value: ReportsDatePreset; label: string; days?: number }> = [
  { value: 'today', label: 'Today', days: 1 },
  { value: '7d', label: 'Last 7 Days', days: 7 },
  { value: '30d', label: 'Last 30 Days', days: 30 },
  { value: '90d', label: 'Last 90 Days', days: 90 },
  { value: '12m', label: 'Last 12 Months', days: 365 },
  { value: 'custom', label: 'Custom' },
];

export const REPORT_CHANNELS = [
  { value: 'all', label: 'All Channels' },
  { value: 'pos', label: 'POS Terminal' },
  { value: 'online', label: 'Online Store' },
  { value: 'wholesale', label: 'Wholesale B2B' },
] as const;

export const REPORT_CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'Electronics', label: 'Electronics' },
  { value: 'Apparel', label: 'Apparel' },
  { value: 'Groceries', label: 'Groceries' },
  { value: 'Home & Living', label: 'Home & Living' },
  { value: 'Accessories', label: 'Accessories' },
] as const;

export const REPORT_STORES = [
  { value: 'all', label: 'All Locations' },
  { value: 'store_1', label: 'Downtown Flagship' },
  { value: 'store_2', label: 'Suburban Mall' },
  { value: 'store_3', label: 'Airport Kiosk' },
] as const;

export const DEFAULT_REPORT_FILTERS = {
  preset: '30d' as ReportsDatePreset,
  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  endDate: new Date().toISOString().slice(0, 10),
  storeId: 'all',
  channel: 'all' as const,
  category: 'all',
  search: '',
};

export const CHART_COLORS = {
  primary: '#8b5cf6', // Violet / Brand
  secondary: '#06b6d4', // Cyan
  emerald: '#10b981', // Green
  amber: '#f59e0b', // Orange/Amber
  rose: '#f43f5e', // Red/Rose
  indigo: '#6366f1', // Indigo
  sky: '#0ea5e9', // Sky Blue
  slate: '#64748b', // Slate
};

export const COLOR_PALETTE = [
  '#8b5cf6',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#6366f1',
  '#14b8a6',
  '#f97316',
];
