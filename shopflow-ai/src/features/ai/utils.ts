import type { BusinessAlert, HealthFactor, ProductInsight, RestockRecommendation } from './types';

export const HEALTH_STATUS_META = {
  strong: { label: 'Strong', variant: 'success' },
  watch: { label: 'Watch', variant: 'warning' },
  risk: { label: 'At risk', variant: 'danger' },
} as const;

export const PRIORITY_META = {
  urgent: { label: 'Urgent', variant: 'danger' },
  soon: { label: 'Reorder soon', variant: 'warning' },
  watch: { label: 'Watch', variant: 'info' },
} as const;

export const SEVERITY_META = {
  high: { label: 'High', variant: 'danger', dot: 'bg-destructive' },
  medium: { label: 'Medium', variant: 'warning', dot: 'bg-warning' },
  low: { label: 'Low', variant: 'info', dot: 'bg-highlight' },
} as const;

export const SIGNAL_META = {
  Rising: { variant: 'success' },
  Stable: { variant: 'info' },
  Declining: { variant: 'danger' },
} as const;

export const SEGMENT_META = {
  VIP: { variant: 'gradient' },
  Loyal: { variant: 'success' },
  'At risk': { variant: 'danger' },
  New: { variant: 'info' },
} as const;

export const ALERT_TYPE_ICON = {
  inventory: 'package',
  revenue: 'revenue',
  customer: 'customer',
  margin: 'margin',
} as const;

/** Tailwind bar width for a 0–100 score, clamped to the valid range. */
export function scoreWidth(score: number): string {
  const clamped = Math.max(0, Math.min(100, score));
  return `${clamped}%`;
}

export function factorTone(factor: HealthFactor): string {
  if (factor.status === 'strong') return 'bg-success';
  if (factor.status === 'risk') return 'bg-destructive';
  return 'bg-warning';
}

/** Confidence (0–1) rendered as a percentage label. */
export function confidencePct(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

export function riskTone(daysRemaining: number): string {
  if (daysRemaining <= 5) return 'text-destructive';
  if (daysRemaining <= 14) return 'text-warning';
  return 'text-muted-foreground';
}

export function sortedRestock(rows: RestockRecommendation[]): RestockRecommendation[] {
  const weight: Record<RestockRecommendation['priority'], number> = { urgent: 0, soon: 1, watch: 2 };
  return [...rows].sort((a, b) => weight[a.priority] - weight[b.priority] || a.daysRemaining - b.daysRemaining);
}

export function sortedProducts(rows: ProductInsight[]): ProductInsight[] {
  return [...rows].sort((a, b) => b.demandScore - a.demandScore);
}

/** Open alerts first (high → low), newest inside each severity. */
export function sortedAlerts(rows: BusinessAlert[]): BusinessAlert[] {
  const weight: Record<BusinessAlert['severity'], number> = { high: 0, medium: 1, low: 2 };
  return [...rows].sort(
    (a, b) => weight[a.severity] - weight[b.severity] || +new Date(b.createdAt) - +new Date(a.createdAt),
  );
}

/** "3 days ago" style relative label with an absolute fallback. */
export function relativeDayLabel(days: number): string {
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
}
