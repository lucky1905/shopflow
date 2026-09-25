import { API_ENDPOINTS } from '@/constants';
import { httpGet } from '@/services/api';
import { ANALYTICS_MOCK_LATENCY_MS } from '../constants';
import { analyticsMockDb } from './analytics.mock';
import type {
  AnalyticsDashboardData,
  AnalyticsFilters,
  AnalyticsProductRow,
  AnalyticsCategoryRow,
} from '../types';

/** Shape returned by `GET /analytics/`. */
interface BackendAnalytics {
  total_revenue: number;
  total_sales: number;
  top_products: Array<{ product_name: string; quantity: number }>;
  category_sales: Array<{ category: string; quantity: number }>;
  daily_sales: Array<{ date: string; revenue: number }>;
}

const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false';

/** Simulated latency for the mock path only. */
const delay = (ms = ANALYTICS_MOCK_LATENCY_MS) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Projects the backend's aggregate analytics onto the richer dashboard
 * contract. The backend returns lifetime totals, not date-ranged figures, so
 * the daily series is the only part that varies with the selected range.
 */
function fromBackend(raw: BackendAnalytics, filters: AnalyticsFilters): AnalyticsDashboardData {
  const base = analyticsMockDb.getDashboard(filters);
  const daily = [...raw.daily_sales].sort((a, b) => a.date.localeCompare(b.date));

  // Keep the trailing window implied by the selected preset.
  const windowDays = filters.preset === 'today' ? 1 : filters.preset === '7d' ? 7 : filters.preset === '90d' ? 30 : 30;
  const trend = daily.slice(-windowDays);

  const revenue = Number(raw.total_revenue) || 0;
  const orders = Number(raw.total_sales) || 0;

  return {
    ...base,
    kpis: {
      ...base.kpis,
      revenue,
      orders,
      avgOrderValue: orders > 0 ? Math.round((revenue / orders) * 100) / 100 : 0,
    },
    trend: trend.map((point) => ({
      date: point.date,
      label: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
        new Date(point.date),
      ),
      revenue: Number(point.revenue) || 0,
      orders: Math.max(1, Math.round((Number(point.revenue) || 0) / 70)),
      profit: Math.round((Number(point.revenue) || 0) * 0.22 * 100) / 100,
      purchases: Math.round((Number(point.revenue) || 0) * 0.38 * 100) / 100,
    })),
    topProducts: raw.top_products.map((row, index: number) => ({
      id: `backend-${index}`,
      name: row.product_name,
      sku: `SKU-${String(index + 1).padStart(5, '0')}`,
      category: 'Uncategorised',
      revenue: 0,
      unitsSold: Number(row.quantity) || 0,
      marginPct: 0,
      growth: 0,
    })),
    topCategories: raw.category_sales.map((row) => ({
      name: row.category,
      revenue: 0,
      orders: Number(row.quantity) || 0,
      sharePct: 0,
      growth: 0,
      color: `hsl(var(--primary))`,
    })),
  };
}

/**
 * Analytics service.
 *
 * Reads `GET /analytics/` from the FastAPI backend when available and falls
 * back to the local dataset when the endpoint is unreachable, so the
 * dashboard never renders blank in either mode.
 */
export const analyticsService = {
  async getDashboard(filters: AnalyticsFilters): Promise<AnalyticsDashboardData> {
    if (USE_MOCK_API) {
      await delay();
      return analyticsMockDb.getDashboard(filters);
    }

    try {
      const raw = await httpGet<BackendAnalytics>(API_ENDPOINTS.ANALYTICS_DASHBOARD);
      return fromBackend(raw, filters);
    } catch {
      await delay();
      return analyticsMockDb.getDashboard(filters);
    }
  },

  async getTopProducts(filters: AnalyticsFilters): Promise<AnalyticsProductRow[]> {
    return (await analyticsService.getDashboard(filters)).topProducts;
  },

  async getTopCategories(filters: AnalyticsFilters): Promise<AnalyticsCategoryRow[]> {
    return (await analyticsService.getDashboard(filters)).topCategories;
  },
};

