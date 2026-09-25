import type { AnalyticsCardKey, AnalyticsDatePreset, AnalyticsView } from './types';

export const ANALYTICS_MOCK_LATENCY_MS = 520;
export const ANALYTICS_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export const ANALYTICS_DATE_PRESETS: ReadonlyArray<{
  value: AnalyticsDatePreset;
  label: string;
  days: number;
}> = [
  { value: 'today', label: 'Today', days: 1 },
  { value: '7d', label: 'Last 7 days', days: 7 },
  { value: '30d', label: 'Last 30 days', days: 30 },
  { value: '90d', label: 'Last 90 days', days: 90 },
  { value: 'custom', label: 'Custom', days: 30 },
];

export const ANALYTICS_VIEWS: ReadonlyArray<{ id: AnalyticsView; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'sales', label: 'Sales' },
  { id: 'purchases', label: 'Purchases' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'customers', label: 'Customers' },
  { id: 'suppliers', label: 'Suppliers' },
];

export const ANALYTICS_STORES = [
  { value: 'all', label: 'All stores' },
  { value: 's-01', label: 'Downtown Flagship' },
  { value: 's-02', label: 'Riverside Mall' },
  { value: 's-03', label: 'Airport Terminal 2' },
  { value: 's-04', label: 'Northgate Outlet' },
] as const;

/** Recharts palette shared by every chart so the module reads as one system. */
export const ANALYTICS_PALETTE = [
  'hsl(var(--primary))',
  'hsl(var(--highlight))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--destructive))',
  'hsl(var(--muted-foreground))',
] as const;

export const CARD_LABELS: Record<AnalyticsCardKey, string> = {
  revenue: 'Revenue',
  orders: 'Orders',
  profit: 'Profit',
  inventory: 'Inventory value',
  aov: 'Avg order value',
  growth: 'Growth',
  sales: 'Sales trend',
  purchases: 'Purchase trend',
  pnl: 'Profit & loss',
  inventoryPerformance: 'Inventory performance',
  customers: 'Customer analytics',
  suppliers: 'Supplier analytics',
  health: 'Business health',
  revenueMix: 'Revenue mix',
  heatGrid: 'Sales activity',
};

export const HEALTH_STATUS_META = {
  strong: { label: 'Strong', variant: 'success' },
  watch: { label: 'Watch', variant: 'warning' },
  risk: { label: 'At risk', variant: 'danger' },
} as const;

export const DEFAULT_ANALYTICS_FILTERS = {
  preset: '30d' as AnalyticsDatePreset,
  startDate: '',
  endDate: '',
  storeId: 'all',
};
