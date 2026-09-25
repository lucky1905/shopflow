import type { ReactNode } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SectionCard } from '@/components/common/SectionCard';
import { ErrorState } from '@/components/common/ErrorState';
import { formatCurrency, formatNumber } from '@/utils/format';
import type { ChannelPoint, SalesTrendPoint, TopProductPoint } from '../types';

/* -------------------------------------------------------------------------- */
/*  Shared tooltip & states                                                   */
/* -------------------------------------------------------------------------- */

interface TipEntry {
  name?: string;
  dataKey?: string | number;
  value?: number | string;
  color?: string;
}

function ChartTip({
  active,
  payload,
  label,
  currency = true,
}: {
  active?: boolean;
  payload?: TipEntry[];
  label?: string;
  currency?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-popover px-3.5 py-2.5 text-xs shadow-xl">
      <p className="font-semibold text-muted-foreground">{label}</p>
      <div className="mt-1 space-y-1">
        {payload.map((entry) => (
          <p key={String(entry.dataKey)} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="ml-auto font-bold tabular-nums text-foreground">
              {currency && typeof entry.value === 'number'
                ? formatCurrency(entry.value)
                : formatNumber(Number(entry.value ?? 0))}
            </span>
          </p>
        ))}
      </div>
    </div>
  );
}

const AXIS_TICK = { fill: 'hsl(var(--muted-foreground))', fontSize: 11 };

function ChartBody({
  isLoading,
  error,
  onRetry,
  height = 280,
  empty,
  children,
}: {
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
  height?: number;
  empty: boolean;
  children: ReactNode;
}) {
  if (isLoading) {
    return <div className="w-full animate-pulse rounded-lg bg-muted" style={{ height }} />;
  }
  if (error) {
    return <ErrorState compact message={error} onRetry={onRetry} />;
  }
  if (empty) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground"
        style={{ height }}
      >
        No data for this range yet.
      </div>
    );
  }
  return (
    <div style={{ height, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Revenue trend (area)                                                      */
/* -------------------------------------------------------------------------- */

export interface RevenueTrendChartProps {
  data: SalesTrendPoint[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  action?: ReactNode;
  height?: number;
}

export function RevenueTrendChart({
  data,
  isLoading = false,
  error = null,
  onRetry,
  action,
  height = 280,
}: RevenueTrendChartProps) {
  return (
    <SectionCard
      title="Revenue trend"
      description="Daily net revenue across the selected range"
      action={action}
    >
      <ChartBody
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
        height={height}
        empty={data.length === 0}
      >
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="sales-revenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={48}
            tickFormatter={(v: number) => `$${Math.round(v / 100) / 10}k`}
          />
          <Tooltip cursor={{ stroke: 'hsl(var(--border))' }} content={<ChartTip />} />
          <Area
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke="#8b5cf6"
            strokeWidth={2.5}
            fill="url(#sales-revenue)"
            animationDuration={900}
          />
        </AreaChart>
      </ChartBody>
    </SectionCard>
  );
}

/* -------------------------------------------------------------------------- */
/*  Channel mix (donut)                                                       */
/* -------------------------------------------------------------------------- */

export function ChannelMixChart({
  data,
  isLoading = false,
  error = null,
  onRetry,
}: {
  data: ChannelPoint[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  return (
    <SectionCard title="Channel mix" description="Share of net revenue by sales channel">
      <ChartBody
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
        height={220}
        empty={data.every((point) => point.revenue === 0)}
      >
        <PieChart>
          <Pie
            data={data}
            dataKey="revenue"
            nameKey="name"
            innerRadius="55%"
            outerRadius="85%"
            paddingAngle={3}
            animationDuration={900}
          >
            {data.map((point) => (
              <Cell key={point.name} fill={point.color} />
            ))}
          </Pie>
          <Tooltip content={<ChartTip />} />
        </PieChart>
      </ChartBody>

      <ul className="mt-4 space-y-2 border-t border-border pt-3.5">
        {data.map((point) => (
          <li key={point.name} className="flex items-center gap-2.5 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: point.color }}
            />
            <span className="truncate font-medium text-foreground">{point.name}</span>
            <span className="ml-auto tabular-nums text-muted-foreground">{point.sharePct}%</span>
            <span className="w-24 text-right font-semibold tabular-nums text-foreground">
              {formatCurrency(point.revenue)}
            </span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

/* -------------------------------------------------------------------------- */
/*  Top products (horizontal bars)                                            */
/* -------------------------------------------------------------------------- */

export function TopProductsChart({
  data,
  isLoading = false,
  error = null,
  onRetry,
}: {
  data: TopProductPoint[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  return (
    <SectionCard title="Top products" description="Best sellers by revenue in this range">
      <ChartBody
        isLoading={isLoading}
        error={error}
        onRetry={onRetry}
        height={260}
        empty={data.length === 0}
      >
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 6" horizontal={false} stroke="hsl(var(--border))" />
          <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={130}
          />
          <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTip />} />
          <Bar
            dataKey="revenue"
            name="Revenue"
            fill="#06b6d4"
            radius={[0, 8, 8, 0]}
            barSize={16}
            animationDuration={900}
          />
        </BarChart>
      </ChartBody>
    </SectionCard>
  );
}