import type {
  AIDashboardData,
  AIInsightMeta,
  BusinessAlert,
  BusinessHealth,
  CopilotResponse,
  CustomerInsight,
  DemandForecast,
  ForecastPoint,
  ForecastRange,
  ProductInsight,
  ProductPairing,
  ProfitAnalysis,
  RestockRecommendation,
} from '../types';

export { AI_MOCK_LATENCY_MS } from '../constants';

/* Deterministic PRNG: mock intelligence must be identical on every reload. */
function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const random = createRandom(20260421);

function between(min: number, max: number): number {
  return min + random() * (max - min);
}

function round(value: number, digits = 0): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const HISTORY_DAYS = 150;
const FORECAST_DAYS = 30;
const TOTAL_DAYS = HISTORY_DAYS + FORECAST_DAYS;

/** How many trailing points each forecast range renders (history + horizon). */
export const FORECAST_RANGE_POINTS: Record<ForecastRange, number> = {
  '7D': 21,
  '30D': 60,
  '90D': 120,
};

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * DAY_MS).toISOString().slice(0, 10);
}

function isoHoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

export const MOCK_AI_META: AIInsightMeta = {
  generatedAt: new Date().toISOString(),
  confidence: 0.87,
  model: 'shopflow-insights-v2.4',
};

export const MOCK_BUSINESS_HEALTH: BusinessHealth = {
  score: 78,
  label: 'Healthy momentum',
  summary:
    'Revenue is trending above plan and stock cover is healthy, but gross margin slipped 2.1 points as discount mix increased.',
  change: 6,
  factors: [
    { label: 'Revenue growth', score: 86, change: 9.4, status: 'strong' },
    { label: 'Gross margin', score: 64, change: -2.1, status: 'watch' },
    { label: 'Stock availability', score: 82, change: 1.8, status: 'strong' },
    { label: 'Repeat customers', score: 71, change: 4.2, status: 'watch' },
    { label: 'Cash cycle', score: 69, change: -3.6, status: 'watch' },
    { label: 'Order fulfilment', score: 91, change: 2.4, status: 'strong' },
  ],
};

function buildForecastPoints(): ForecastPoint[] {
  const points: ForecastPoint[] = [];
  let level = 4200;

  for (let index = TOTAL_DAYS - 1; index >= 0; index -= 1) {
    const isHistory = index >= FORECAST_DAYS;
    const date = new Date(Date.now() - index * DAY_MS);
    const dayOfWeek = date.getDay();
    const weekendLift = dayOfWeek === 0 || dayOfWeek === 6 ? 1.22 : 1;
    const drift = isHistory ? 1 + (TOTAL_DAYS - index) * 0.0016 : 1 + (TOTAL_DAYS - index) * 0.0012;
    const noise = between(0.88, 1.12);
    level = level * between(0.994, 1.006);

    const value = roundMoney(level * weekendLift * drift * noise);
    const point: ForecastPoint = {
      date: date.toISOString().slice(0, 10),
      label: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date),
    };

    if (isHistory) {
      point.actual = value;
    } else {
      point.forecast = value;
      point.lower = roundMoney(value * between(0.9, 0.94));
      point.upper = roundMoney(value * between(1.06, 1.11));
    }

    points.push(point);
  }

  return points;
}

export const MOCK_FORECAST_POINTS: ForecastPoint[] = buildForecastPoints();

export const MOCK_DEMAND_FORECAST: DemandForecast = {
  points: MOCK_FORECAST_POINTS,
  next7DaysRevenue: roundMoney(
    MOCK_FORECAST_POINTS.slice(-7).reduce((sum, point) => sum + (point.forecast ?? 0), 0),
  ),
  expectedGrowth: 8.4,
  peakDay: 'Saturday',
  confidence: 0.84,
  summary:
    'Model expects an 8.4% lift over the next 7 days, led by weekend footfall. Spikes align with the promotional calendar on the 12th.',
};

const RESTOCK_CATALOGUE: ReadonlyArray<{
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  dailyVelocity: number;
  unitCost: number;
  priority: RestockRecommendation['priority'];
  reason: string;
  confidence: number;
}> = [
  {
    productId: 'p-1001',
    productName: 'Aurora Wireless Earbuds',
    sku: 'AUR-EAR-01',
    currentStock: 12,
    dailyVelocity: 4.8,
    unitCost: 1280,
    priority: 'urgent',
    reason: 'Velocity up 34% over 14 days; cover falls below 3 days at current burn.',
    confidence: 0.93,
  },
  {
    productId: 'p-1002',
    productName: 'Nimbus Bluetooth Speaker',
    sku: 'NIM-BTS-04',
    currentStock: 21,
    dailyVelocity: 3.1,
    unitCost: 2450,
    priority: 'urgent',
    reason: 'Promo landing page goes live in 4 days and history shows a 2.1x lift.',
    confidence: 0.89,
  },
  {
    productId: 'p-1004',
    productName: 'Lumen Desk Lamp Pro',
    sku: 'LUM-DLP-02',
    currentStock: 9,
    dailyVelocity: 1.7,
    unitCost: 2190,
    priority: 'urgent',
    reason: 'Seasonal lift detected in the last 3 weeks with supplier lead time of 9 days.',
    confidence: 0.86,
  },
  {
    productId: 'p-1003',
    productName: 'Vertex Smart Band',
    sku: 'VTX-SMB-07',
    currentStock: 34,
    dailyVelocity: 2.4,
    unitCost: 1890,
    priority: 'soon',
    reason: 'Steady climb since the fitness bundle launched; cover is under 14 days.',
    confidence: 0.81,
  },
  {
    productId: 'p-1005',
    productName: 'Orbit Mechanical Keyboard',
    sku: 'ORB-MKB-11',
    currentStock: 46,
    dailyVelocity: 1.9,
    unitCost: 3400,
    priority: 'soon',
    reason: 'Attach rate with the Aurora monitor is high, keeping units moving faster than plan.',
    confidence: 0.77,
  },
  {
    productId: 'p-1006',
    productName: 'Pulse Fitness Tracker',
    sku: 'PLS-FIT-05',
    currentStock: 58,
    dailyVelocity: 1.2,
    unitCost: 1550,
    priority: 'watch',
    reason: 'Demand flat, but cover sits just under the 45-day reorder point.',
    confidence: 0.69,
  },
  {
    productId: 'p-1007',
    productName: 'Cobalt USB-C Hub',
    sku: 'CBT-HUB-03',
    currentStock: 73,
    dailyVelocity: 2.1,
    unitCost: 980,
    priority: 'watch',
    reason: 'Consistent baseline seller; worth a small top-up before the festive build-up.',
    confidence: 0.72,
  },
];

export const MOCK_RESTOCK_RECOMMENDATIONS: RestockRecommendation[] = RESTOCK_CATALOGUE.map((row) => {
  const daysRemaining = round(row.currentStock / row.dailyVelocity, 1);
  const targetCoverDays = row.priority === 'urgent' ? 30 : row.priority === 'soon' ? 21 : 14;
  const recommendedQuantity = Math.max(12, Math.ceil(row.dailyVelocity * targetCoverDays - row.currentStock));

  return {
    id: `restock-${row.productId}`,
    productId: row.productId,
    productName: row.productName,
    sku: row.sku,
    currentStock: row.currentStock,
    dailyVelocity: round(row.dailyVelocity, 1),
    daysRemaining,
    recommendedQuantity,
    estimatedCost: roundMoney(recommendedQuantity * row.unitCost),
    priority: row.priority,
    confidence: row.confidence,
    reason: row.reason,
  };
});

export const MOCK_CUSTOMER_INSIGHTS: CustomerInsight[] = [
  {
    id: 'cus-01',
    name: 'Ananya Rao',
    email: 'ananya.rao@example.com',
    segment: 'VIP',
    lifetimeValue: 48200,
    orders: 38,
    lastOrderDaysAgo: 2,
    trend: 14.2,
    opportunity: 'Highest value in the store - prioritise early access to new launches.',
    recommendedAction: 'Enrol in the VIP early-access list and hold stock for her usual basket.',
  },
  {
    id: 'cus-02',
    name: 'Marcus Feld',
    email: 'marcus.feld@example.com',
    segment: 'Loyal',
    lifetimeValue: 21450,
    orders: 21,
    lastOrderDaysAgo: 6,
    trend: 6.8,
    opportunity: 'Buys audio accessories every 6-8 weeks; predictable replenishment window.',
    recommendedAction: 'Send a replenishment nudge with the Aurora earbuds bundle.',
  },
  {
    id: 'cus-03',
    name: 'Priya Nair',
    email: 'priya.nair@example.com',
    segment: 'At risk',
    lifetimeValue: 15890,
    orders: 17,
    lastOrderDaysAgo: 63,
    trend: -34.5,
    opportunity: 'Historically premium baskets, no visit in two months - churn risk is high.',
    recommendedAction: 'Trigger a win-back offer with a 12% loyalty bonus on her top category.',
  },
  {
    id: 'cus-04',
    name: 'Daniel Osei',
    email: 'daniel.osei@example.com',
    segment: 'At risk',
    lifetimeValue: 9340,
    orders: 9,
    lastOrderDaysAgo: 41,
    trend: -18.7,
    opportunity: 'Stopped buying peripherals after switching to a competitor keyboard.',
    recommendedAction: 'Call out the new Orbit keyboard trade-in before he re-purchases elsewhere.',
  },
  {
    id: 'cus-05',
    name: 'Sofia Marchetti',
    email: 'sofia.marchetti@example.com',
    segment: 'New',
    lifetimeValue: 3240,
    orders: 3,
    lastOrderDaysAgo: 4,
    trend: 41.5,
    opportunity: 'Strong first-month engagement across home-office and smart-home categories.',
    recommendedAction: 'Recommend the cross-sell desk setup bundle to lift second order value.',
  },
  {
    id: 'cus-06',
    name: 'Ravi Menon',
    email: 'ravi.menon@example.com',
    segment: 'Loyal',
    lifetimeValue: 17600,
    orders: 24,
    lastOrderDaysAgo: 9,
    trend: 3.1,
    opportunity: 'Buys on weekends; responds to family bundles and UPI cashback offers.',
    recommendedAction: 'Schedule the weekend family-bundle campaign for this segment.',
  },
];

export const MOCK_PRODUCT_INSIGHTS: ProductInsight[] = [
  {
    id: 'p-1001',
    name: 'Aurora Wireless Earbuds',
    sku: 'AUR-EAR-01',
    category: 'Audio',
    revenue: 184200,
    margin: 42.5,
    unitsSold: 1284,
    growth: 34.1,
    stockCoverDays: 2.5,
    demandScore: 94,
    signal: 'Rising',
    recommendation: 'Raise reorder quantity 40% and extend the promo slot - demand is outrunning supply.',
  },
  {
    id: 'p-1002',
    name: 'Nimbus Bluetooth Speaker',
    sku: 'NIM-BTS-04',
    category: 'Audio',
    revenue: 148900,
    margin: 38.9,
    unitsSold: 486,
    growth: 27.6,
    stockCoverDays: 6.8,
    demandScore: 88,
    signal: 'Rising',
    recommendation: 'Secure supplier capacity now; the upcoming campaign will consume cover in 5 days.',
  },
  {
    id: 'p-1004',
    name: 'Lumen Desk Lamp Pro',
    sku: 'LUM-DLP-02',
    category: 'Home office',
    revenue: 96400,
    margin: 44.8,
    unitsSold: 352,
    growth: 21.8,
    stockCoverDays: 5.3,
    demandScore: 82,
    signal: 'Rising',
    recommendation: 'Best margin in the category - protect the price and fix the lead time instead.',
  },
  {
    id: 'p-1003',
    name: 'Orbit Mechanical Keyboard',
    sku: 'ORB-MKB-11',
    category: 'Peripherals',
    revenue: 132600,
    margin: 35.2,
    unitsSold: 312,
    growth: 12.4,
    stockCoverDays: 24.2,
    demandScore: 71,
    signal: 'Stable',
    recommendation: 'Healthy cover - bundle with the monitor to lift attach rate instead of discounting.',
  },
  {
    id: 'p-1007',
    name: 'Cobalt USB-C Hub',
    sku: 'CBT-HUB-03',
    category: 'Peripherals',
    revenue: 64800,
    margin: 51.2,
    unitsSold: 618,
    growth: 5.6,
    stockCoverDays: 34.7,
    demandScore: 58,
    signal: 'Stable',
    recommendation: 'Excellent margin with reliable demand - a small top-up keeps the flywheel running.',
  },
  {
    id: 'p-1006',
    name: 'Pulse Fitness Tracker',
    sku: 'PLS-FIT-05',
    category: 'Wearables',
    revenue: 71300,
    margin: 29.4,
    unitsSold: 460,
    growth: -8.2,
    stockCoverDays: 48.3,
    demandScore: 38,
    signal: 'Declining',
    recommendation: 'Margin is thin and cover is high - pause reorders and test a bundle instead.',
  },
];

export const MOCK_PROFIT_ANALYSIS: ProfitAnalysis = {
  grossRevenue: 486300,
  netProfit: 96440,
  profitMargin: 19.8,
  projectedProfit: 108900,
  opportunity: 21450,
  drivers: [
    {
      label: 'Audio category growth',
      impact: 18200,
      detail: 'Earbuds and speakers added 18.2k of gross profit at 40% margin.',
      type: 'revenue',
    },
    {
      label: 'Discount leakage',
      impact: -11200,
      detail: 'Promo depth averaged 18% on the top 20 SKUs, eroding 11.2k of margin.',
      type: 'margin',
    },
    {
      label: 'Cobalt hub margin',
      impact: 6400,
      detail: 'Suppliers repriced the hub; a 6.4k profit lift needs no extra volume.',
      type: 'margin',
    },
    {
      label: 'Late purchase orders',
      impact: -7300,
      detail: 'Three POs landed after demand peaks, forcing spot-buy at 22% above contract.',
      type: 'cost',
    },
    {
      label: 'Cross-sell attach',
      impact: 9800,
      detail: 'Desktop bundles raised basket value by 9.8k without extra traffic.',
      type: 'revenue',
    },
  ],
  summary:
    'Net margin sits at 19.8%, down 2.1 points. Fixing discount leakage and late purchase orders alone would recover roughly 18.5k of profit.',
};

export const MOCK_CROSS_SELL: ProductPairing[] = [
  {
    id: 'pair-01',
    primaryProduct: 'Aurora Wireless Earbuds',
    suggestedProduct: 'Cobalt USB-C Hub',
    attachRate: 41.2,
    estimatedLift: 12.4,
    estimatedIncrementalRevenue: 28600,
    confidence: 0.88,
    rationale: 'Buyers finishing an audio purchase almost always need a charging or dock accessory.',
  },
  {
    id: 'pair-02',
    primaryProduct: 'Orbit Mechanical Keyboard',
    suggestedProduct: 'Lumen Desk Lamp Pro',
    attachRate: 36.8,
    estimatedLift: 9.7,
    estimatedIncrementalRevenue: 19750,
    confidence: 0.83,
    rationale: 'Desk-setup baskets pair a keyboard with lighting in 1 of every 3 orders.',
  },
  {
    id: 'pair-03',
    primaryProduct: 'Pulse Fitness Tracker',
    suggestedProduct: 'Nimbus Bluetooth Speaker',
    attachRate: 24.5,
    estimatedLift: 6.3,
    estimatedIncrementalRevenue: 11200,
    confidence: 0.74,
    rationale: 'Fitness customers respond to audio bundles during the evening commute window.',
  },
  {
    id: 'pair-04',
    primaryProduct: 'Vertex Smart Band',
    suggestedProduct: 'Aurora Wireless Earbuds',
    attachRate: 19.6,
    estimatedLift: 5.1,
    estimatedIncrementalRevenue: 9400,
    confidence: 0.68,
    rationale: 'Wearable owners upgrade to earbuds within 90 days; upsell during the first reorder cycle.',
  },
];

export const MOCK_BUSINESS_ALERTS: BusinessAlert[] = [
  {
    id: 'alert-01',
    type: 'inventory',
    title: 'Aurora earbuds will stock out in 3 days',
    message:
      'Burn rate is 4.8 units/day against 12 on hand. Reordering now protects an estimated 28.6k of revenue.',
    severity: 'high',
    action: 'Create purchase order',
    createdAt: isoHoursAgo(2),
    metric: '3 days of cover',
  },
  {
    id: 'alert-02',
    type: 'margin',
    title: 'Gross margin down 2.1 points',
    message:
      'Discount depth on the top 20 SKUs rose to 18%. Margin leakage of 11.2k is the single largest drag.',
    severity: 'medium',
    action: 'Review discount rules',
    createdAt: isoHoursAgo(6),
    metric: '11.2k at risk',
  },
  {
    id: 'alert-03',
    type: 'customer',
    title: '3 high-value customers going quiet',
    message:
      'Priya Nair, Daniel Osei and one VIP account have not ordered in 40+ days, representing 36.4k of lifetime value.',
    severity: 'medium',
    action: 'Start win-back campaign',
    createdAt: isoHoursAgo(14),
    metric: '36.4k LTV',
  },
  {
    id: 'alert-04',
    type: 'revenue',
    title: 'Weekend demand trending 22% above plan',
    message:
      'The model sees a sustained weekend lift. Make sure speaker and lamp cover lasts through Sunday.',
    severity: 'low',
    action: 'Check weekend cover',
    createdAt: isoHoursAgo(26),
    metric: '+22% vs plan',
  },
  {
    id: 'alert-05',
    type: 'inventory',
    title: '3 purchase orders arrived after the demand peak',
    message:
      'Spot buying added 7.3k of avoidable cost. Supplier lead times for these categories are now 9-12 days.',
    severity: 'high',
    action: 'Open purchase orders',
    createdAt: isoDaysAgo(1),
    metric: '7.3k extra cost',
  },
];

export const MOCK_AI_DASHBOARD: AIDashboardData = {
  meta: MOCK_AI_META,
  health: MOCK_BUSINESS_HEALTH,
  forecast: MOCK_DEMAND_FORECAST,
  restockRecommendations: MOCK_RESTOCK_RECOMMENDATIONS,
  customers: MOCK_CUSTOMER_INSIGHTS,
  products: MOCK_PRODUCT_INSIGHTS,
  profit: MOCK_PROFIT_ANALYSIS,
  crossSell: MOCK_CROSS_SELL,
  alerts: MOCK_BUSINESS_ALERTS,
};

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/**
 * In-memory "database" for the mock backend. Services read from here, so
 * replacing `ai.service.ts` with real HTTP calls is the only change needed.
 */
export const aiMockDb = {
  dashboard: MOCK_AI_DASHBOARD,
  getDashboard: (): AIDashboardData => clone(MOCK_AI_DASHBOARD),
};

/* Copilot rule engine â€” the mock stand-in for a real LLM endpoint. */

export type CopilotTopic = 'restock' | 'profit' | 'customers' | 'products' | 'forecast';

export interface CopilotRule {
  topic: CopilotTopic;
  keywords: readonly string[];
  build: (data: AIDashboardData) => CopilotResponse;
}

export const money = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

export const COPILOT_RULES: readonly CopilotRule[] = [
  {
    topic: 'restock',
    keywords: ['restock', 'reorder', 'stock up', 'replenish', 'supplier order', 'buy more', 'running out'],
    build: (data) => {
      const urgent = data.restockRecommendations.filter((row) => row.priority === 'urgent');
      const cost = urgent.reduce((sum, row) => sum + row.estimatedCost, 0);
      return {
        answer: `Start with ${urgent.length} urgent items. ${urgent
          .map((row) => `${row.productName} (${row.currentStock} left, ${row.daysRemaining} days of cover)`)
          .join('; ')}. One consolidated purchase order costs about ${money(cost)} and protects roughly ${money(
          28600,
        )} of revenue over the next fortnight.`,
        suggestions: ['Which products are trending fastest?', 'Why did profit margin change?'],
        relatedAlertIds: ['alert-01'],
      };
    },
  },
  {
    topic: 'profit',
    keywords: ['profit', 'margin', 'loss', 'money', 'discount', 'cost', 'expensive'],
    build: (data) => {
      const sorted = [...data.profit.drivers].sort((a, b) => b.impact - a.impact);
      const best = sorted[0];
      const worst = sorted[sorted.length - 1];
      return {
        answer: `Net margin is ${data.profit.profitMargin}% on ${money(
          data.profit.grossRevenue,
        )} of revenue, giving ${money(data.profit.netProfit)} net profit. Biggest tailwind: ${best.label.toLowerCase()} (${money(
          best.impact,
        )}). Biggest drag: ${worst.label.toLowerCase()} (${money(worst.impact)}). I see ${money(
          data.profit.opportunity,
        )} of recoverable profit if you tighten discount rules and fix late purchase orders.`,
        suggestions: ['What should I restock today?', 'How many customers are at risk?'],
        relatedAlertIds: ['alert-02', 'alert-05'],
      };
    },
  },
  {
    topic: 'customers',
    keywords: ['customer', 'client', 'churn', 'loyal', 'vip', 'retention', 'repeat'],
    build: (data) => {
      const atRisk = data.customers.filter((row) => row.segment === 'At risk');
      const ltv = atRisk.reduce((sum, row) => sum + row.lifetimeValue, 0);
      return {
        answer: `${atRisk.length} customers are drifting, representing ${money(
          ltv,
        )} of lifetime value. ${atRisk[0]?.name ?? 'The top account'} is the priority, and a win-back offer with a loyalty bonus is the highest-return action. Your VIP cohort is up 14.2% and worth protecting with early access to new launches.`,
        suggestions: ['What should I restock today?', 'Why did profit margin change?'],
        relatedAlertIds: ['alert-03'],
      };
    },
  },
  {
    topic: 'products',
    keywords: ['product', 'fastest', 'best seller', 'top selling', 'trending', 'declining', 'sku'],
    build: (data) => {
      const rising = [...data.products].sort((a, b) => b.demandScore - a.demandScore).slice(0, 3);
      const declining = data.products.find((row) => row.signal === 'Declining');
      return {
        answer: `Demand is led by ${rising
          .map((row) => `${row.name} (score ${row.demandScore}, ${row.growth > 0 ? '+' : ''}${row.growth}%)`)
          .join(', ')}. ${
          declining
            ? `Watch ${declining.name}: it is declining ${Math.abs(
                declining.growth,
              )}% with ${declining.stockCoverDays} days of cover, so pause reorders.`
            : 'No product is currently in decline.'
        }`,
        suggestions: ['What should I restock today?', 'Why did profit margin change?'],
        relatedAlertIds: [],
      };
    },
  },
  {
    topic: 'forecast',
    keywords: ['forecast', 'predict', 'next week', 'trend', 'demand', 'revenue', 'sales'],
    build: (data) => ({
      answer: `Expect ${money(
        data.forecast.next7DaysRevenue,
      )} over the next 7 days, a ${data.forecast.expectedGrowth}% lift at ${Math.round(
        data.forecast.confidence * 100,
      )}% confidence. ${data.forecast.peakDay} is the peak day. ${data.forecast.summary}`,
      suggestions: ['What should I restock today?', 'Why did profit margin change?'],
      relatedAlertIds: ['alert-04'],
    }),
  },
];

/** Rule-based matcher used by the mock copilot. */
export function resolveCopilotRule(question: string): CopilotRule {
  const normalised = question.toLowerCase();
  return (
    COPILOT_RULES.find((rule) => rule.keywords.some((keyword) => normalised.includes(keyword))) ??
    COPILOT_RULES[COPILOT_RULES.length - 1]
  );
}
