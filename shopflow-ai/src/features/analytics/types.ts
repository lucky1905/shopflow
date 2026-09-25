// Analytics domain contracts — the merged, cross-module business view.
export type AnalyticsDatePreset = 'today' | '7d' | '30d' | '90d' | 'custom';

export interface AnalyticsFilters {
  preset: AnalyticsDatePreset;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  storeId: string;
}

export interface AnalyticsKpis {
  revenue: number;
  revenueChange: number;
  orders: number;
  ordersChange: number;
  profit: number;
  profitChange: number;
  inventoryValue: number;
  inventoryValueChange: number;
  avgOrderValue: number;
  avgOrderValueChange: number;
  growth: number;
  growthChange: number;
}

export interface AnalyticsTrendPoint {
  date: string;
  label: string;
  revenue: number;
  orders: number;
  profit: number;
  purchases: number;
}

export interface AnalyticsSlicePoint {
  name: string;
  value: number;
  sharePct: number;
  color: string;
}

export interface AnalyticsHeatmapCell {
  /** ISO date (YYYY-MM-DD) the cell belongs to. */
  date: string;
  /** Human label for the day, e.g. "Mon 8". */
  label: string;
  /** Trading hour (8–21) the cell represents. */
  hour: number;
  revenue: number;
  orders: number;
  /** 0–1 intensity used for the background colour. */
  intensity: number;
}

export interface AnalyticsProductRow {
  id: string;
  name: string;
  sku: string;
  category: string;
  revenue: number;
  unitsSold: number;
  marginPct: number;
  growth: number;
}

export interface AnalyticsCategoryRow {
  name: string;
  revenue: number;
  orders: number;
  sharePct: number;
  growth: number;
  color: string;
}

export interface AnalyticsHealthFactor {
  label: string;
  score: number;
  change: number;
  status: 'strong' | 'watch' | 'risk';
}

export interface AnalyticsHealth {
  score: number;
  label: string;
  summary: string;
  change: number;
  factors: AnalyticsHealthFactor[];
}

export interface AnalyticsPnL {
  revenue: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  marginPct: number;
  previousRevenue: number;
  previousNetProfit: number;
}

export interface AnalyticsInventoryPerformance {
  totalSkus: number;
  activeSkus: number;
  outOfStock: number;
  lowStock: number;
  overstocked: number;
  sellThroughPct: number;
  stockTurns: number;
  deadStockValue: number;
  topMovers: Array<{ name: string; units: number; sku: string }>;
}

export interface AnalyticsCustomerAnalytics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  repeatRatePct: number;
  churnRisk: number;
  avgLifetimeValue: number;
  segments: Array<{ name: string; customers: number; revenue: number; sharePct: number }>;
}

export interface AnalyticsSupplierAnalytics {
  totalSuppliers: number;
  activeSuppliers: number;
  totalSpend: number;
  avgLeadTimeDays: number;
  onTimeRatePct: number;
  outstandingPayables: number;
  topSuppliers: Array<{
    name: string;
    spend: number;
    orders: number;
    onTimePct: number;
    qualityPct: number;
  }>;
}

export interface AnalyticsDashboardData {
  filters: AnalyticsFilters;
  kpis: AnalyticsKpis;
  trend: AnalyticsTrendPoint[];
  revenueByChannel: AnalyticsSlicePoint[];
  paymentMix: AnalyticsSlicePoint[];
  categoryMix: AnalyticsSlicePoint[];
  heatmap: AnalyticsHeatmapCell[];
  topProducts: AnalyticsProductRow[];
  topCategories: AnalyticsCategoryRow[];
  health: AnalyticsHealth;
  pnl: AnalyticsPnL;
  inventory: AnalyticsInventoryPerformance;
  customers: AnalyticsCustomerAnalytics;
  suppliers: AnalyticsSupplierAnalytics;
}

export type AnalyticsCardKey =
  | 'revenue'
  | 'orders'
  | 'profit'
  | 'inventory'
  | 'aov'
  | 'growth'
  | 'sales'
  | 'purchases'
  | 'pnl'
  | 'inventoryPerformance'
  | 'customers'
  | 'suppliers'
  | 'health'
  | 'revenueMix'
  | 'heatGrid';

export type AnalyticsView = 'overview' | 'sales' | 'purchases' | 'inventory' | 'customers' | 'suppliers';
