import type { ReactNode } from 'react';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SectionCard } from '@/components/common/SectionCard';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { formatCurrency, formatNumber } from '@/utils/format';
import { compactMoney } from '../utils';
import type { AnalyticsSlicePoint, AnalyticsTrendPoint } from '../types';

export interface AnalyticsChartCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  height?: number;
  className?: string;
  children: ReactNode;
}

const axisProps = {
  tickLine: false,
  axisLine: false,
  tick: { fontSize: 11, fill: 'hsl(var(--muted-foreground))' },
} as const;

const tooltipProps = {
  contentStyle: {
    borderRadius: 12,
    border: '1px solid hsl(var(--border))',
    background: 'hsl(var(--popover))',
    fontSize: 12,
  },
  labelStyle: { color: 'hsl(var(--foreground))', fontWeight: 600 },
} as const;

/** Shared shell so every chart handles loading / error / empty identically. */
export function AnalyticsChartCard({
  title,
  description,
  icon,
  action,
  isLoading,
  error,
  onRetry,
  isEmpty,
  emptyTitle = 'No data in this range',
  emptyDescription = 'Try widening the date range or selecting a different store.',
  height = 280,
  className,
  children,
}: AnalyticsChartCardProps) {
  return (
    <SectionCard title={title} description={description} icon={icon} action={action} className={className}>
      {error ? (
        <ErrorState
          title={`${title} unavailable`}
          message="We could not load this chart right now."
          onRetry={onRetry}
          compact
        />
      ) : isLoading ? (
        <LoadingSkeleton variant="card" />
      ) : isEmpty ? (
        <EmptyState title={emptyTitle} description={emptyDescription} compact />
      ) : (
        <div style={{ height }} className="w-full">
          {children}
        </div>
      )}
    </SectionCard>
  );
}

/** Revenue area + orders line sharing one time axis. */
export function RevenueAreaChart({ data }: { data: AnalyticsTrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="analytics-revenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="label" {...axisProps} minTickGap={24} />
        <YAxis yAxisId="left" {...axisProps} width={64} tickFormatter={compactMoney} />
        <YAxis yAxisId="right" orientation="right" {...axisProps} width={44} />
        <Tooltip
          {...tooltipProps}
          formatter={(value, name) => [
            name === 'orders' ? formatNumber(Number(value ?? 0)) : formatCurrency(Number(value ?? 0)),
            name === 'revenue' ? 'Revenue' : 'Orders',
          ]}
        />
        <Legend verticalAlign="top" height={28} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="revenue"
          name="revenue"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          fill="url(#analytics-revenue)"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="orders"
          name="orders"
          stroke="hsl(var(--highlight))"
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/** Grouped bars for a like-for-like comparison of two series. */
export function TrendBarChart({
  data,
  keys,
}: {
  data: AnalyticsTrendPoint[];
  keys: Array<{ key: 'profit' | 'purchases'; label: string; color: string }>;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="label" {...axisProps} minTickGap={20} />
        <YAxis {...axisProps} width={64} tickFormatter={compactMoney} />
        <Tooltip
          {...tooltipProps}
          cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
          formatter={(value, name) => [formatCurrency(Number(value ?? 0)), String(name)]}
        />
        <Legend verticalAlign="top" height={28} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        {keys.map((entry) => (
          <Bar key={entry.key} dataKey={entry.key} name={entry.label} fill={entry.color} radius={[5, 5, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Donut with a centred total. */
export function MixDonutChart({ data, centerLabel }: { data: AnalyticsSlicePoint[]; centerLabel: string }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="relative h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="58%"
            outerRadius="82%"
            paddingAngle={2}
            stroke="hsl(var(--card))"
            strokeWidth={2}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip {...tooltipProps} formatter={(value, name) => [formatCurrency(Number(value ?? 0)), String(name)]} />
          <Legend verticalAlign="bottom" height={30} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-8">
        <span className="text-lg font-semibold tabular-nums text-foreground">
          {formatCurrency(total, 'USD', { notation: 'compact' })}
        </span>
        <span className="text-[11px] text-muted-foreground">{centerLabel}</span>
      </div>
    </div>
  );
}


