/* -------------------------------------------------------------------------- */
/*  Pulse — command-center dashboard contracts (2026 redesign, UI-only mock)  */
/* -------------------------------------------------------------------------- */

export interface PulseKpi {
  id: string;
  label: string;
  value: string;
  delta: number;
  caption: string;
  /** Progress toward the period goal, 0–100. */
  targetPct: number;
  targetLabel: string;
  /** Tailwind gradient stops for the icon orb. */
  orb: string;
  /** Ambient glow blob class. */
  glow: string;
  /** Gradient stops for the goal meter fill. */
  meter: string;
}

export interface PulsePoint {
  label: string;
  sales: number;
  profit: number;
  /** Gross margin %. */
  margin: number;
}

export interface PulseChannel {
  id: string;
  name: string;
  /** Share of revenue, 0–100. */
  share: number;
  revenue: number;
  /** Hex used for radial arcs & legend bars. */
  color: string;
  trend: number;
}

export type TimelineTone = 'violet' | 'emerald' | 'rose' | 'sky' | 'amber';
export type TimelineIcon = 'check' | 'cart' | 'alert' | 'truck' | 'spark' | 'up';

export interface PulseEvent {
  id: string;
  title: string;
  detail: string;
  time: string;
  tone: TimelineTone;
  icon: TimelineIcon;
}

export type OrderChannel = 'POS' | 'Online' | 'Marketplace';
export type OrderStatus = 'Paid' | 'Pending' | 'Preparing' | 'Refunded';

export interface PulseOrder {
  id: string;
  customer: string;
  initials: string;
  channel: OrderChannel;
  items: number;
  total: number;
  status: OrderStatus;
  ago: string;
}

export interface RestockItem {
  id: string;
  product: string;
  sku: string;
  supplier: string;
  left: number;
  par: number;
  /** Predicted days until stock-out. */
  coverDays: number;
  urgency: 'Critical' | 'Low' | 'Watch';
}

export interface PulseMover {
  id: string;
  name: string;
  category: string;
  units: number;
  revenue: number;
  delta: number;
  /** % of month revenue, drives the mini share bar. */
  share: number;
}

export interface CopilotSuggestion {
  id: string;
  label: string;
  reply: string;
}

export interface CopilotMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
}

export interface HeroTickerItem {
  label: string;
  value: string;
  delta?: number;
}

export interface PulseGoal {
  label: string;
  value: string;
  target: string;
  pct: number;
}