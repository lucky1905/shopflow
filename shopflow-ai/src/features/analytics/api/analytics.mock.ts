import { ANALYTICS_PALETTE, DEFAULT_ANALYTICS_FILTERS } from '../constants';
import type {
  AnalyticsCategoryRow,
  AnalyticsCustomerAnalytics,
  AnalyticsDashboardData,
  AnalyticsFilters,
  AnalyticsHealth,
  AnalyticsHeatmapCell,
  AnalyticsInventoryPerformance,
  AnalyticsKpis,
  AnalyticsPnL,
  AnalyticsProductRow,
  AnalyticsSlicePoint,
  AnalyticsSupplierAnalytics,
  AnalyticsTrendPoint,
} from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;

/* Deterministic PRNG so the dashboard is identical on every reload. */
function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const random = createRandom(904215);

const between = (min: number, max: number) => min + random() * (max - min);
const round = (value: number, digits = 0) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};
const money = (value: number) => Math.round(value * 100) / 100;

const CATEGORY_SEED: ReadonlyArray<{ name: string; weight: number; color: string }> = [
  { name: 'Audio', weight: 0.31, color: ANALYTICS_PALETTE[0] },
  { name: 'Peripherals', weight: 0.24, color: ANALYTICS_PALETTE[1] },
  { name: 'Home office', weight: 0.18, color: ANALYTICS_PALETTE[2] },
  { name: 'Wearables', weight: 0.15, color: ANALYTICS_PALETTE[3] },
  { name: 'Accessories', weight: 0.12, color: ANALYTICS_PALETTE[4] },
];

const PRODUCT_SEED: ReadonlyArray<{ name: string; sku: string; category: string; price: number }> = [
  { name: 'Aurora Wireless Earbuds', sku: 'AUR-EAR-01', category: 'Audio', price: 79 },
  { name: 'Nimbus Bluetooth Speaker', sku: 'NIM-BTS-04', category: 'Audio', price: 149 },
  { name: 'Halo Studio Headphones', sku: 'HAL-STH-09', category: 'Audio', price: 219 },
  { name: 'Orbit Mechanical Keyboard', sku: 'ORB-MKB-11', category: 'Peripherals', price: 129 },
  { name: 'Vector Wireless Mouse', sku: 'VEC-MSE-02', category: 'Peripherals', price: 49 },
  { name: 'Lumen Desk Lamp Pro', sku: 'LUM-DLP-02', category: 'Home office', price: 89 },
  { name: 'Terra Monitor Arm', sku: 'TER-MAR-06', category: 'Home office', price: 109 },
  { name: 'Vertex Smart Band', sku: 'VTX-SMB-07', category: 'Wearables', price: 119 },
  { name: 'Pulse Fitness Tracker', sku: 'PLS-FIT-05', category: 'Wearables', price: 69 },
  { name: 'Cobalt USB-C Hub', sku: 'CBT-HUB-03', category: 'Accessories', price: 39 },
  { name: 'Slate Laptop Sleeve', sku: 'SLA-SLV-08', category: 'Accessories', price: 29 },
  { name: 'Nova Webcam 4K', sku: 'NOV-WBC-10', category: 'Peripherals', price: 99 },
];

/** Number of daily points for a filter, keeping the trend chart readable. */
function trendDayCount(filters: AnalyticsFilters): number {
  if (filters.preset === 'today') return 24; // hourly
  if (filters.preset === 'custom') {
    const start = new Date(filters.startDate).getTime();
    const end = new Date(filters.endDate).getTime();
    const days = Number.isFinite(start) && Number.isFinite(end) ? Math.round((end - start) / DAY_MS) + 1 : 30;
    return Math.max(2, Math.min(180, days));
  }
  return 30;
}

function buildTrend(filters: AnalyticsFilters): AnalyticsTrendPoint[] {
  const count = trendDayCount(filters);
  const hourly = filters.preset === 'today';
  const points: AnalyticsTrendPoint[] = [];
  const end = new Date();

  for (let i = count - 1; i >= 0; i -= 1) {
    const at = new Date(end.getTime() - i * (hourly ? 60 * 60 * 1000 : DAY_MS));
    const weekend = at.getDay() === 0 || at.getDay() === 6;
    const drift = 1 + (count - i) * 0.0021;
    const base = hourly ? between(180, 420) : between(2900, 5200);
    const revenue = money(base * (weekend ? 1.24 : 1) * drift * between(0.9, 1.12));
    const orders = Math.max(1, Math.round(revenue / between(58, 86)));
    const profit = money(revenue * between(0.19, 0.27));
    const purchases = money(revenue * between(0.28, 0.46));

    points.push({
      date: at.toISOString().slice(0, 10),
      label: hourly
        ? `${String(at.getHours()).padStart(2, '0')}:00`
        : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(at),
      revenue,
      orders,
      profit,
      purchases,
    });
  }

  return points;
}

const toSlice = (
  items: ReadonlyArray<{ name: string; weight: number; color: string }>,
  total: number,
): AnalyticsSlicePoint[] =>
  items.map((item) => ({
    name: item.name,
    value: money(total * item.weight),
    sharePct: round(item.weight * 100, 1),
    color: item.color,
  }));

function buildKpis(trend: AnalyticsTrendPoint[]): AnalyticsKpis {
  const revenue = money(trend.reduce((sum, p) => sum + p.revenue, 0));
  const orders = trend.reduce((sum, p) => sum + p.orders, 0);
  const profit = money(trend.reduce((sum, p) => sum + p.profit, 0));
  const aov = orders > 0 ? money(revenue / orders) : 0;
  const avgDailyRevenue = revenue / Math.max(1, trend.length);

  return {
    revenue,
    revenueChange: round(between(4.2, 12.8), 1),
    orders,
    ordersChange: round(between(1.4, 9.6), 1),
    profit,
    profitChange: round(between(-3.4, 7.9), 1),
    inventoryValue: money(between(486000, 742000)),
    inventoryValueChange: round(between(-2.1, 5.4), 1),
    avgOrderValue: aov,
    avgOrderValueChange: round(between(-2.6, 6.1), 1),
    growth: avgDailyRevenue > 0 ? round(between(3.1, 11.4), 1) : 0,
    growthChange: round(between(-1.2, 3.4), 1),
  };
}

/** Trading hours rendered by the heatmap (store opens 08:00, closes 21:00). */
export const HEATMAP_HOURS = Array.from({ length: 14 }, (_, index) => 8 + index);

/** Indexed by `Date#getDay()` (0 = Sunday). */
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Hourly demand shape: quiet mornings, a lunch peak and a strong evening
 * peak, so the grid reads like a real trading day.
 */
function hourWeight(hour: number): number {
  if (hour < 10) return 0.45;
  if (hour < 12) return 0.85;
  if (hour < 14) return 1.35; // lunch
  if (hour < 16) return 1.05;
  if (hour < 18) return 1.2;
  if (hour < 20) return 1.5; // evening peak
  return 0.95;
}

/**
 * 14-day x 14-hour revenue intensity grid.
 *
 * Each cell carries its own `hour` because `date` is a plain YYYY-MM-DD
 * string: re-deriving the hour with `new Date(cell.date).getHours()` parses as
 * UTC midnight and returns the wrong local hour outside UTC, which silently
 * blanks the whole grid.
 */
function buildHeatmap(): AnalyticsHeatmapCell[] {
  const cells: AnalyticsHeatmapCell[] = [];
  const today = new Date();

  for (let day = 13; day >= 0; day -= 1) {
    const at = new Date(today.getTime() - day * DAY_MS);
    const weekend = at.getDay() === 0 || at.getDay() === 6;
    const date = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}-${String(at.getDate()).padStart(2, '0')}`;
    // Built explicitly so the label always reads "Sat 12", instead of depending
    // on how the runtime's Intl formats a short weekday.
    const label = `${WEEKDAY_LABELS[at.getDay()]} ${at.getDate()}`;
    const dayFactor = weekend ? between(1.18, 1.42) : between(0.86, 1.12);

    for (const hour of HEATMAP_HOURS) {
      const revenue = money(between(210, 520) * hourWeight(hour) * dayFactor);
      cells.push({
        date,
        label,
        hour,
        revenue,
        orders: Math.max(1, Math.round(revenue / between(48, 96))),
        intensity: 0,
      });
    }
  }

  // Normalise revenue into 0-1 so the colour scale spans the full range.
  const max = Math.max(...cells.map((cell) => cell.revenue));
  const min = Math.min(...cells.map((cell) => cell.revenue));
  const range = Math.max(1, max - min);
  for (const cell of cells) {
    cell.intensity = round((cell.revenue - min) / range, 3);
  }

  return cells;
}

function buildTopProducts(): AnalyticsProductRow[] {
  return PRODUCT_SEED.map((product) => {
    const unitsSold = Math.round(between(120, 1480));
    return {
      id: product.sku,
      name: product.name,
      sku: product.sku,
      category: product.category,
      revenue: money(unitsSold * product.price),
      unitsSold,
      marginPct: round(between(22, 52), 1),
      growth: round(between(-12, 38), 1),
    };
  }).sort((a, b) => b.revenue - a.revenue);
}

function buildTopCategories(): AnalyticsCategoryRow[] {
  return CATEGORY_SEED.map((category) => ({
    name: category.name,
    revenue: money(between(58000, 214000)),
    orders: 0,
    sharePct: round(category.weight * 100, 1),
    growth: round(between(-8, 26), 1),
    color: category.color,
  })).map((row) => ({ ...row, orders: Math.round(row.revenue / between(62, 94)) }));
}

function buildHealth(): AnalyticsHealth {
  return {
    score: Math.round(between(72, 84)),
    label: 'Healthy momentum',
    summary:
      'Revenue and fulfilment are both above plan. Gross margin is the one factor to watch - discount depth on the top SKUs is eroding 2.1 points.',
    change: round(between(3, 8), 1),
    factors: [
      { label: 'Revenue growth', score: Math.round(between(80, 92)), change: round(between(4, 11), 1), status: 'strong' },
      { label: 'Gross margin', score: Math.round(between(58, 68)), change: round(between(-3.4, -1.2), 1), status: 'watch' },
      { label: 'Stock availability', score: Math.round(between(76, 88)), change: round(between(0.6, 3.2), 1), status: 'strong' },
      { label: 'Repeat customers', score: Math.round(between(64, 76)), change: round(between(1.4, 5.6), 1), status: 'watch' },
      { label: 'Supplier reliability', score: Math.round(between(70, 84)), change: round(between(-1.8, 2.4), 1), status: 'strong' },
    ],
  };
}

function buildPnL(trend: AnalyticsTrendPoint[]): AnalyticsPnL {
  const revenue = money(trend.reduce((sum, p) => sum + p.revenue, 0));
  const cogs = money(revenue * between(0.58, 0.66));
  const grossProfit = money(revenue - cogs);
  const expenses = money(grossProfit * between(0.42, 0.52));
  const netProfit = money(grossProfit - expenses);
  const previousRevenue = money(revenue / between(1.04, 1.12));
  const previousNetProfit = money(previousRevenue * (netProfit / Math.max(1, revenue)));

  return {
    revenue,
    cogs,
    grossProfit,
    expenses,
    netProfit,
    marginPct: round(revenue > 0 ? (netProfit / revenue) * 100 : 0, 1),
    previousRevenue,
    previousNetProfit,
  };
}

function buildInventory(): AnalyticsInventoryPerformance {
  const totalSkus = Math.round(between(420, 520));
  const outOfStock = Math.round(between(6, 18));
  const lowStock = Math.round(between(22, 46));
  return {
    totalSkus,
    activeSkus: totalSkus - outOfStock - lowStock,
    outOfStock,
    lowStock,
    overstocked: Math.round(between(18, 38)),
    sellThroughPct: round(between(58, 82), 1),
    stockTurns: round(between(3.2, 6.4), 1),
    deadStockValue: money(between(18400, 46200)),
    topMovers: buildTopProducts()
      .slice(0, 5)
      .map((product) => ({ name: product.name, units: product.unitsSold, sku: product.sku })),
  };
}

function buildCustomers(): AnalyticsCustomerAnalytics {
  const totalCustomers = Math.round(between(2400, 3900));
  const newCustomers = Math.round(totalCustomers * between(0.16, 0.24));
  return {
    totalCustomers,
    newCustomers,
    returningCustomers: totalCustomers - newCustomers,
    repeatRatePct: round(between(38, 54), 1),
    churnRisk: Math.round(between(120, 310)),
    avgLifetimeValue: money(between(860, 1640)),
    segments: [
      { name: 'VIP', customers: Math.round(totalCustomers * 0.06), revenue: money(between(212000, 268000)), sharePct: 41.2 },
      { name: 'Loyal', customers: Math.round(totalCustomers * 0.22), revenue: money(between(168000, 214000)), sharePct: 28.4 },
      { name: 'Promising', customers: Math.round(totalCustomers * 0.34), revenue: money(between(96000, 132000)), sharePct: 19.1 },
      { name: 'At risk', customers: Math.round(totalCustomers * 0.14), revenue: money(between(38000, 62000)), sharePct: 11.3 },
    ],
  };
}

function buildSuppliers(): AnalyticsSupplierAnalytics {
  const names = ['Nova Electronics', 'Apex Distribution', 'Vertex Supply Co', 'Lumen Wholesale', 'Orbit Trading'];
  return {
    totalSuppliers: 12,
    activeSuppliers: Math.round(between(8, 11)),
    totalSpend: money(between(268000, 486000)),
    avgLeadTimeDays: round(between(6.2, 12.4), 1),
    onTimeRatePct: round(between(78, 94), 1),
    outstandingPayables: money(between(42000, 118000)),
    topSuppliers: names.map((name) => ({
      name,
      spend: money(between(28000, 142000)),
      orders: Math.round(between(6, 34)),
      onTimePct: round(between(72, 98), 1),
      qualityPct: round(between(84, 99), 1),
    })),
  };
}

/** Assembles the full payload the dashboard renders from. */
export function buildAnalyticsDashboard(filters: AnalyticsFilters): AnalyticsDashboardData {
  const trend = buildTrend(filters);
  const kpis = buildKpis(trend);
  const pnl = buildPnL(trend);

  return {
    filters,
    kpis,
    trend,
    revenueByChannel: [
      { name: 'In store', value: money(kpis.revenue * 0.58), sharePct: 58, color: ANALYTICS_PALETTE[0] },
      { name: 'Online', value: money(kpis.revenue * 0.27), sharePct: 27, color: ANALYTICS_PALETTE[1] },
      { name: 'Wholesale', value: money(kpis.revenue * 0.1), sharePct: 10, color: ANALYTICS_PALETTE[2] },
      { name: 'Marketplace', value: money(kpis.revenue * 0.05), sharePct: 5, color: ANALYTICS_PALETTE[3] },
    ],
    paymentMix: [
      { name: 'UPI', value: money(kpis.revenue * 0.42), sharePct: 42, color: ANALYTICS_PALETTE[0] },
      { name: 'Card', value: money(kpis.revenue * 0.28), sharePct: 28, color: ANALYTICS_PALETTE[1] },
      { name: 'Cash', value: money(kpis.revenue * 0.18), sharePct: 18, color: ANALYTICS_PALETTE[2] },
      { name: 'Wallet', value: money(kpis.revenue * 0.12), sharePct: 12, color: ANALYTICS_PALETTE[3] },
    ],
    categoryMix: toSlice(CATEGORY_SEED, kpis.revenue),
    heatmap: buildHeatmap(),
    topProducts: buildTopProducts(),
    topCategories: buildTopCategories(),
    health: buildHealth(),
    pnl,
    inventory: buildInventory(),
    customers: buildCustomers(),
    suppliers: buildSuppliers(),
  };
}

/** In-memory "database" backing the mock service. */
export const analyticsMockDb = {
  getDashboard: (filters: AnalyticsFilters): AnalyticsDashboardData => buildAnalyticsDashboard(filters),
  defaultFilters: DEFAULT_ANALYTICS_FILTERS,
};
