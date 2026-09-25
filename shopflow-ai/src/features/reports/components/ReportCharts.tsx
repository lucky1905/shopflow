import type { ReactNode } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
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
import { COLOR_PALETTE } from '../constants';
import type {
  CategoryBreakdownPoint,
  CustomerSegmentPoint,
  InventoryMovementSummaryPoint,
  OverviewMonthlyPerformance,
  PurchaseSpendByCategoryPoint,
  RevenueByChannelPoint,
  RevenueByPaymentMethodPoint,
  RevenueTrendPoint,
} from '../types';

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
    <div className="rounded-xl border border-border bg-popover px-3.5 py-2.5 text-xs shadow-xl backdrop-blur">
      {label && <p className="mb-1.5 font-semibold text-foreground">{label}</p>}
      <ul className="space-y-1">
        {payload.map((entry, idx) => {
          const numVal = typeof entry.value === 'number' ? entry.value : Number(entry.value);
          const display = currency ? formatCurrency(numVal) : formatNumber(numVal);
          return (
            <li key={idx} className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color ?? 'hsl(var(--primary))' }}
              />
              <span className="text-muted-foreground">{entry.name ?? entry.dataKey}:</span>
              <span className="font-semibold tabular-nums text-foreground">{display}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

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
        No reporting data available for this range
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

const AXIS_TICK = { fill: 'hsl(var(--muted-foreground))', fontSize: 11 };

/* -------------------------------------------------------------------------- */
/*  1. Monthly Performance Chart                                              */
/* -------------------------------------------------------------------------- */
export function MonthlyPerformanceChart({
  data,
  isLoading,
  error,
  onRetry,
  action,
}: {
  data: OverviewMonthlyPerformance[];
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
  action?: ReactNode;
}) {
  return (
    <SectionCard
      title="Monthly Revenue & Profit Trends"
      description="Comparative view of top-line revenue versus net profitability."
      action={action}
    >
      <ChartBody isLoading={isLoading} error={error} onRetry={onRetry} empty={data.length === 0} height={300}>
        <BarChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={60} tickFormatter={(v) => `$${v / 1000}k`} />
          <Tooltip content={<ChartTip />} />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
          <Bar dataKey="revenue" name="Revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="grossProfit" name="Gross Profit" fill="#06b6d4" radius={[4, 4, 0, 0]} />
          <Bar dataKey="netProfit" name="Net Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartBody>
    </SectionCard>
  );
}


/* -------------------------------------------------------------------------- */
/*  2. Category Breakdown Donut                                               */
/* -------------------------------------------------------------------------- */
export function CategoryBreakdownChart({
  data,
  isLoading,
  error,
  onRetry,
}: {
  data: CategoryBreakdownPoint[];
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  return (
    <SectionCard title="Sales by Category" description="Volume distribution by product line.">
      <ChartBody isLoading={isLoading} error={error} onRetry={onRetry} empty={data.length === 0} height={240}>
        <PieChart>
          <Pie
            data={data}
            dataKey="sales"
            nameKey="category"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={4}
          >
            {data.map((entry, index) => (
              <Cell key={`cat-${index}`} fill={entry.color || COLOR_PALETTE[index % COLOR_PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTip />} />
        </PieChart>
      </ChartBody>

      <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
        {data.map((cat, idx) => (
          <li key={cat.category} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: cat.color || COLOR_PALETTE[idx % COLOR_PALETTE.length] }}
            />
            <span className="truncate font-medium">{cat.category}</span>
            <span className="ml-auto text-muted-foreground">{cat.percentage}%</span>
            <span className="font-semibold tabular-nums">{formatCurrency(cat.sales)}</span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

/* -------------------------------------------------------------------------- */
/*  3. Revenue Trend Area Chart                                               */
/* -------------------------------------------------------------------------- */
export function ReportRevenueTrendChart({
  data,
  isLoading,
  error,
  onRetry,
}: {
  data: RevenueTrendPoint[];
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  return (
    <SectionCard title="Gross vs Net Revenue Trend" description="Tracks adjustments, discounts, and customer returns.">
      <ChartBody isLoading={isLoading} error={error} onRetry={onRetry} empty={data.length === 0} height={320}>
        <AreaChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="grossRevGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="netRevGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={60} tickFormatter={(v) => `$${v / 1000}k`} />
          <Tooltip content={<ChartTip />} />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
          <Area type="monotone" dataKey="grossRevenue" name="Gross Revenue" stroke="#8b5cf6" strokeWidth={2} fill="url(#grossRevGrad)" />
          <Area type="monotone" dataKey="netRevenue" name="Net Revenue" stroke="#06b6d4" strokeWidth={2} fill="url(#netRevGrad)" />
        </AreaChart>
      </ChartBody>
    </SectionCard>
  );
}

/* -------------------------------------------------------------------------- */
/*  4. Revenue by Channel & Payment Method                                    */
/* -------------------------------------------------------------------------- */
export function RevenueChannelChart({
  data,
  isLoading,
  error,
  onRetry,
}: {
  data: RevenueByChannelPoint[];
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  return (
    <SectionCard title="Revenue by Channel" description="Channel distribution across POS, Online, and Wholesale.">
      <ChartBody isLoading={isLoading} error={error} onRetry={onRetry} empty={data.length === 0} height={240}>
        <PieChart>
          <Pie data={data} dataKey="revenue" nameKey="channel" innerRadius={55} outerRadius={80} paddingAngle={4}>
            {data.map((c, i) => (
              <Cell key={`chan-${i}`} fill={c.color || COLOR_PALETTE[i % COLOR_PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTip />} />
        </PieChart>
      </ChartBody>
      <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
        {data.map((item, idx) => (
          <li key={item.channel} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.color || COLOR_PALETTE[idx % COLOR_PALETTE.length] }}
            />
            <span className="truncate font-medium">{item.channel}</span>
            <span className="ml-auto text-muted-foreground">{item.sharePct}%</span>
            <span className="font-semibold tabular-nums">{formatCurrency(item.revenue)}</span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

export function RevenuePaymentMethodChart({
  data,
  isLoading,
  error,
  onRetry,
}: {
  data: RevenueByPaymentMethodPoint[];
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  return (
    <SectionCard title="Revenue by Payment Tender" description="Breakdown of customer payment channels.">
      <ChartBody isLoading={isLoading} error={error} onRetry={onRetry} empty={data.length === 0} height={240}>
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
          <XAxis type="number" tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
          <YAxis type="category" dataKey="method" tick={AXIS_TICK} axisLine={false} tickLine={false} width={90} />
          <Tooltip content={<ChartTip />} />
          <Bar dataKey="amount" name="Amount" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`pay-${index}`} fill={entry.color || COLOR_PALETTE[index % COLOR_PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ChartBody>
    </SectionCard>
  );
}

/* -------------------------------------------------------------------------- */
/*  5. Inventory Movement Bar Chart                                           */
/* -------------------------------------------------------------------------- */
export function InventoryMovementChart({
  data,
  isLoading,
  error,
  onRetry,
}: {
  data: InventoryMovementSummaryPoint[];
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  return (
    <SectionCard title="Inventory Flow (Stock In vs Out)" description="Net unit movement trends over previous months.">
      <ChartBody isLoading={isLoading} error={error} onRetry={onRetry} empty={data.length === 0} height={280}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={50} />
          <Tooltip content={<ChartTip currency={false} />} />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Bar dataKey="stockIn" name="Stock In" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="stockOut" name="Stock Out" fill="#f43f5e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartBody>
    </SectionCard>
  );
}


/* -------------------------------------------------------------------------- */
/*  6. Customer Segment Chart                                                 */
/* -------------------------------------------------------------------------- */
export function CustomerSegmentsChart({
  data,
  isLoading,
  error,
  onRetry,
}: {
  data: CustomerSegmentPoint[];
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  return (
    <SectionCard title="Customer Segments Contribution" description="Revenue concentration across shopper tiers.">
      <ChartBody isLoading={isLoading} error={error} onRetry={onRetry} empty={data.length === 0} height={240}>
        <PieChart>
          <Pie data={data} dataKey="totalSpend" nameKey="segment" innerRadius={55} outerRadius={80} paddingAngle={4}>
            {data.map((c, i) => (
              <Cell key={`seg-${i}`} fill={c.color || COLOR_PALETTE[i % COLOR_PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTip />} />
        </PieChart>
      </ChartBody>
      <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
        {data.map((item, idx) => (
          <li key={item.segment} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.color || COLOR_PALETTE[idx % COLOR_PALETTE.length] }}
            />
            <span className="truncate font-medium">{item.segment}</span>
            <span className="ml-auto text-muted-foreground">{item.sharePct}%</span>
            <span className="font-semibold tabular-nums">{formatCurrency(item.totalSpend)}</span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

/* -------------------------------------------------------------------------- */
/*  7. Purchase Spend By Category                                             */
/* -------------------------------------------------------------------------- */
export function PurchaseCategoryChart({
  data,
  isLoading,
  error,
  onRetry,
}: {
  data: PurchaseSpendByCategoryPoint[];
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  return (
    <SectionCard title="Procurement Spend by Category" description="Allocation of purchasing capital across departments.">
      <ChartBody isLoading={isLoading} error={error} onRetry={onRetry} empty={data.length === 0} height={240}>
        <PieChart>
          <Pie data={data} dataKey="spend" nameKey="category" innerRadius={55} outerRadius={80} paddingAngle={4}>
            {data.map((c, i) => (
              <Cell key={`pur-${i}`} fill={c.color || COLOR_PALETTE[i % COLOR_PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTip />} />
        </PieChart>
      </ChartBody>
      <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
        {data.map((item, idx) => (
          <li key={item.category} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.color || COLOR_PALETTE[idx % COLOR_PALETTE.length] }}
            />
            <span className="truncate font-medium">{item.category}</span>
            <span className="ml-auto text-muted-foreground">{item.percentage}%</span>
            <span className="font-semibold tabular-nums">{formatCurrency(item.spend)}</span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

