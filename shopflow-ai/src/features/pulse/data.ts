import type { PulseDashboardData } from './api/dashboard.service';
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
} from './types';

/* -------------------------------------------------------------------------- */
/*  Hero                                                                       */
/* -------------------------------------------------------------------------- */

const FALLBACK_GOAL: PulseGoal = {
  label: 'April revenue goal',
  value: '$284,650',
  target: '$400,000',
  pct: 71,
};

const FALLBACK_HERO_TICKER: HeroTickerItem[] = [
  { label: 'Sales today', value: '$9,412', delta: 14.2 },
  { label: 'Orders today', value: '412', delta: 8.7 },
  { label: 'Avg basket', value: '$22.84', delta: 3.1 },
  { label: 'Gross margin', value: '36.2%', delta: 1.8 },
];

/* -------------------------------------------------------------------------- */
/*  KPIs — XL cards with goal meters                                           */
/* -------------------------------------------------------------------------- */

const FALLBACK_KPIS: PulseKpi[] = [
  {
    id: 'revenue',
    label: 'Net revenue',
    value: '$284,650',
    delta: 12.4,
    caption: 'Rolling 30 days · all channels',
    targetPct: 71,
    targetLabel: '71% of $400k goal',
    orb: 'from-violet-500 to-fuchsia-500',
    glow: 'bg-violet-500',
    meter: 'from-violet-500 to-fuchsia-500',
  },
  {
    id: 'orders',
    label: 'Orders',
    value: '12,480',
    delta: 8.2,
    caption: '2,916 checks this week',
    targetPct: 64,
    targetLabel: '64% of 19.5k monthly',
    orb: 'from-cyan-500 to-sky-500',
    glow: 'bg-cyan-500',
    meter: 'from-cyan-500 to-sky-500',
  },
  {
    id: 'basket',
    label: 'Avg basket',
    value: '$22.81',
    delta: 3.6,
    caption: 'Upsell prompts running at POS',
    targetPct: 58,
    targetLabel: '58% of $39 stretch',
    orb: 'from-amber-400 to-orange-500',
    glow: 'bg-amber-500',
    meter: 'from-amber-400 to-orange-500',
  },
  {
    id: 'sellthrough',
    label: 'Sell-through',
    value: '87.4%',
    delta: 5.1,
    caption: 'Stock health across 3 sites',
    targetPct: 92,
    targetLabel: '92% of 95% target',
    orb: 'from-emerald-400 to-teal-500',
    glow: 'bg-emerald-500',
    meter: 'from-emerald-400 to-teal-500',
  },
];

/* -------------------------------------------------------------------------- */
/*  Analytics                                                                  */
/* -------------------------------------------------------------------------- */

const FALLBACK_PULSE_SERIES: PulsePoint[] = [
  { label: 'Jan', sales: 186_000, profit: 61_400, margin: 33.0 },
  { label: 'Feb', sales: 172_500, profit: 58_900, margin: 34.2 },
  { label: 'Mar', sales: 201_800, profit: 69_200, margin: 34.3 },
  { label: 'Apr', sales: 284_650, profit: 103_100, margin: 36.2 },
  { label: 'May', sales: 243_200, profit: 84_700, margin: 34.8 },
  { label: 'Jun', sales: 226_900, profit: 77_300, margin: 34.1 },
  { label: 'Jul', sales: 258_400, profit: 91_600, margin: 35.5 },
  { label: 'Aug', sales: 271_300, profit: 96_800, margin: 35.7 },
  { label: 'Sep', sales: 264_100, profit: 92_400, margin: 35.0 },
  { label: 'Oct', sales: 292_700, profit: 105_900, margin: 36.2 },
  { label: 'Nov', sales: 338_500, profit: 124_700, margin: 36.8 },
  { label: 'Dec', sales: 371_900, profit: 139_600, margin: 37.5 },
];

const FALLBACK_CHANNELS: PulseChannel[] = [
  { id: 'pos', name: 'In-store POS', share: 46, revenue: 131_400, color: '#8b5cf6', trend: 9.4 },
  { id: 'online', name: 'Online store', share: 28, revenue: 79_700, color: '#d946ef', trend: 18.6 },
  { id: 'market', name: 'Marketplace', share: 17, revenue: 48_400, color: '#22d3ee', trend: 6.2 },
  { id: 'wholesale', name: 'Wholesale', share: 9, revenue: 25_150, color: '#f59e0b', trend: -2.4 },
];

/* -------------------------------------------------------------------------- */
/*  Feeds & queues                                                             */
/* -------------------------------------------------------------------------- */

const FALLBACK_EVENTS: PulseEvent[] = [
  { id: 'e1', title: 'Daily sales target hit', detail: 'Crossed $9.4k at 4:12 PM — 5 hours early', time: '4m', tone: 'emerald', icon: 'check' },
  { id: 'e2', title: 'Order #10842 paid', detail: '$184.20 · Card · Downtown Store POS', time: '12m', tone: 'violet', icon: 'cart' },
  { id: 'e3', title: 'Sunflower Oil below par', detail: '34 units left · auto-drafted PO-2091', time: '38m', tone: 'rose', icon: 'alert' },
  { id: 'e4', title: 'GrainHub truck dispatched', detail: 'ETA Thursday 9:00 AM · 3 pallets', time: '1h', tone: 'sky', icon: 'truck' },
  { id: 'e5', title: 'Copilot re-forecast weekend', detail: 'Demand +22% Fri–Sun · staffing suggested', time: '2h', tone: 'violet', icon: 'spark' },
  { id: 'e6', title: 'Beverages promo published', detail: 'End-cap pricing live on 12 SKUs', time: '3h', tone: 'amber', icon: 'up' },
];

const FALLBACK_LIVE_ORDERS: PulseOrder[] = [
  { id: 'o1', customer: 'Aarav Mehta', initials: 'AM', channel: 'POS', items: 4, total: 184.2, status: 'Paid', ago: '2m' },
  { id: 'o2', customer: 'Sara Khan', initials: 'SK', channel: 'Online', items: 2, total: 96.5, status: 'Preparing', ago: '6m' },
  { id: 'o3', customer: 'Guest checkout', initials: 'GC', channel: 'Marketplace', items: 1, total: 42.9, status: 'Pending', ago: '11m' },
  { id: 'o4', customer: 'Rohan Iyer', initials: 'RI', channel: 'POS', items: 6, total: 231.0, status: 'Paid', ago: '18m' },
  { id: 'o5', customer: 'Mia Dsouza', initials: 'MD', channel: 'Online', items: 3, total: 58.75, status: 'Refunded', ago: '26m' },
];

const FALLBACK_RESTOCK_QUEUE: RestockItem[] = [
  { id: 'r1', product: 'Sunflower Oil 1L', sku: 'GRO-OIL-001', supplier: 'FreshLine Foods', left: 34, par: 120, coverDays: 6, urgency: 'Critical' },
  { id: 'r2', product: 'Basmati Rice 5kg', sku: 'GRO-RIC-014', supplier: 'GrainHub Co.', left: 58, par: 150, coverDays: 8, urgency: 'Critical' },
  { id: 'r3', product: 'Whole Milk 1L', sku: 'DAI-MLK-022', supplier: 'DailyDairy', left: 72, par: 140, coverDays: 11, urgency: 'Low' },
  { id: 'r4', product: 'Cola Classic 2L', sku: 'BEV-COL-008', supplier: 'BevServe', left: 90, par: 160, coverDays: 13, urgency: 'Low' },
  { id: 'r5', product: 'Paper Bags M', sku: 'PKG-BAG-003', supplier: 'PackWell', left: 210, par: 400, coverDays: 17, urgency: 'Watch' },
];

const FALLBACK_TOP_MOVERS: PulseMover[] = [
  { id: 'm1', name: 'Basmati Rice 5kg', category: 'Groceries', units: 1240, revenue: 18600, delta: 14.2, share: 92 },
  { id: 'm2', name: 'Sunflower Oil 1L', category: 'Groceries', units: 1084, revenue: 12980, delta: 11.6, share: 74 },
  { id: 'm3', name: 'Whole Milk 1L', category: 'Dairy', units: 976, revenue: 7320, delta: 8.4, share: 52 },
  { id: 'm4', name: 'Cola Classic 2L', category: 'Beverages', units: 862, revenue: 6896, delta: 6.1, share: 41 },
  { id: 'm5', name: 'Dark Chocolate 90g', category: 'Snacks', units: 690, revenue: 5520, delta: 22.8, share: 33 },
];

/* -------------------------------------------------------------------------- */
/*  Copilot                                                                    */
/* -------------------------------------------------------------------------- */

const FALLBACK_SUGGESTIONS: CopilotSuggestion[] = [
  {
    id: 's1',
    label: 'Build a weekend restock plan',
    reply: 'For Fri–Sun I recommend +600 units of Basmati Rice and +400 of Sunflower Oil. PO-2091 already covers the oil — want me to draft the rice order to GrainHub?',
  },
  {
    id: 's2',
    label: 'Why did margin dip on Tuesday?',
    reply: 'Tuesday ran a 2-for-1 beverages promo, which cut blended margin by 3.1 pts. Volume was up 18%, so net profit still grew $420. I can model the promo for next week if you like.',
  },
  {
    id: 's3',
    label: 'Draft a purchase order',
    reply: 'Drafted PO-2092: 600 × Basmati Rice 5kg from GrainHub Co. — $2,880, delivery Thursday. It is waiting in Purchases for your approval.',
  },
];

const FALLBACK_COPILOT_GREETING =
  "Morning! Overnight I reviewed 14 days of sales and flagged 5 SKUs trending toward stock-out. Ask me anything about revenue, margin, or inventory — I'll keep it short.";
/* -------------------------------------------------------------------------- */
/* Live bindings                                                            */
/*                                                                             */
/* The Pulse components keep importing these names. Declaring them as `let`   */
/* creates ES module live bindings, so re-assigning them from the provider     */
/* updates every consumer on the next render - no component changes required.   */
/* -------------------------------------------------------------------------- */

export let GOAL = FALLBACK_GOAL;
export let HERO_TICKER = FALLBACK_HERO_TICKER;
export let KPIS = FALLBACK_KPIS;
export let PULSE_SERIES = FALLBACK_PULSE_SERIES;
export let CHANNELS = FALLBACK_CHANNELS;
export let EVENTS = FALLBACK_EVENTS;
export let LIVE_ORDERS = FALLBACK_LIVE_ORDERS;
export let RESTOCK_QUEUE = FALLBACK_RESTOCK_QUEUE;
export let TOP_MOVERS = FALLBACK_TOP_MOVERS;
export let SUGGESTIONS = FALLBACK_SUGGESTIONS;
export let COPILOT_GREETING = FALLBACK_COPILOT_GREETING;

/** True once live backend figures have replaced the bundled dataset. */
export let isLive = false;

/**
 * Replaces the bundled dataset with live backend figures.
 *
 * Empty arrays are ignored so a partially-populated response can never blank
 * a panel that the fallback dataset renders correctly.
 */
export function hydratePulse(data: PulseDashboardData): void {
  GOAL = data.goal;
  HERO_TICKER = data.ticker;
  KPIS = data.kpis;
  if (data.series.length > 0) PULSE_SERIES = data.series;
  if (data.channels.length > 0) CHANNELS = data.channels;
  if (data.events.length > 0) EVENTS = data.events;
  if (data.orders.length > 0) LIVE_ORDERS = data.orders;
  if (data.restock.length > 0) RESTOCK_QUEUE = data.restock;
  if (data.movers.length > 0) TOP_MOVERS = data.movers;
  if (data.suggestions.length > 0) SUGGESTIONS = data.suggestions;
  COPILOT_GREETING = data.copilotGreeting;
  isLive = true;
}
