import type { ReactNode } from 'react';
import { AlertTriangle, Bot, Package, TrendingUp, Users, Wallet } from 'lucide-react';
import { Badge } from '@/components/common/Badge';
import { cn } from '@/lib/utils';
import type { BusinessAlert, InsightTone, RiskLevel } from '../types';

/* -------------------------------------------------------------------------- */
/* Score ring – the signature AI visual for confidence / health readings.     */
/* -------------------------------------------------------------------------- */

export interface ScoreRingProps {
  value: number;
  size?: number;
  thickness?: number;
  tone?: InsightTone;
  label?: ReactNode;
  className?: string;
}

const RING_TONE: Record<InsightTone, { stroke: string; text: string }> = {
  positive: { stroke: 'stroke-success', text: 'text-success' },
  warning: { stroke: 'stroke-warning', text: 'text-warning' },
  danger: { stroke: 'stroke-destructive', text: 'text-destructive' },
  neutral: { stroke: 'stroke-primary', text: 'text-primary' },
};

export function ScoreRing({
  value,
  size = 132,
  thickness = 10,
  tone = 'positive',
  label,
  className,
}: ScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className={cn('relative inline-flex shrink-0 items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={thickness}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn('transition-[stroke-dashoffset] duration-700 ease-out', RING_TONE[tone].stroke)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-2xl font-bold tabular-nums', RING_TONE[tone].text)}>
          {Math.round(clamped)}
        </span>
        {label && <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Tinted insight card – the standard surface for every AI recommendation.    */
/* -------------------------------------------------------------------------- */

const CARD_TONE: Record<InsightTone, string> = {
  positive: 'border-success/25 bg-success/5',
  warning: 'border-warning/25 bg-warning/5',
  danger: 'border-destructive/25 bg-destructive/5',
  neutral: 'border-primary/20 bg-primary/5',
};

export function InsightCard({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: InsightTone;
  className?: string;
}) {
  return (
    <div className={cn('rounded-xl border p-4 transition-colors', CARD_TONE[tone], className)}>
      {children}
    </div>
  );
}

/** Severity dot + label used across alerts and restock rows. */
export function SeverityChip({ severity }: { severity: RiskLevel }) {
  const meta = {
    high: { label: 'High', variant: 'danger' as const, dot: 'bg-destructive' },
    medium: { label: 'Medium', variant: 'warning' as const, dot: 'bg-warning' },
    low: { label: 'Low', variant: 'info' as const, dot: 'bg-highlight' },
  }[severity];

  return (
    <Badge variant={meta.variant} size="sm" dot>
      {meta.label}
    </Badge>
  );
}

const ALERT_TYPE_ICON_MAP: Record<BusinessAlert['type'], typeof Package> = {
  inventory: Package,
  revenue: TrendingUp,
  customer: Users,
  margin: Wallet,
};

export function AlertTypeIcon({ type, className }: { type: BusinessAlert['type']; className?: string }) {
  const Icon = ALERT_TYPE_ICON_MAP[type];
  return <Icon className={cn('h-4 w-4', className)} />;
}

/** Small labelled metric used across the AI panels. */
export function MetricTile({
  label,
  value,
  hint,
  tone = 'neutral',
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: InsightTone;
  className?: string;
}) {
  return (
    <div className={cn('rounded-lg border border-border bg-card px-3.5 py-3', className)}>
      <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-1 text-lg font-semibold tabular-nums',
          tone === 'positive' && 'text-success',
          tone === 'warning' && 'text-warning',
          tone === 'danger' && 'text-destructive',
          tone === 'neutral' && 'text-foreground',
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export { AlertTriangle, Bot };
