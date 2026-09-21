import { useMemo, useState } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn } from '@/lib/utils';
import { PULSE_SERIES } from '../data';
import { GlassCard, Reveal, SectionHead } from './primitives';

const RANGES = [
  { id: 'qtd', label: 'QTD', months: 3 },
  { id: '6m', label: '6M', months: 6 },
  { id: '12m', label: '12M', months: 12 },
] as const;

type RangeId = (typeof RANGES)[number]['id'];

interface TipEntry {
  name?: string;
  dataKey?: string | number;
  value?: number | string;
  color?: string;
}

/** Glassmorphic custom tooltip for the composed chart. */
function PulseTip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TipEntry[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-black/10 bg-card/95 px-4 py-3 shadow-xl backdrop-blur-xl dark:border-white/10">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-1.5 space-y-1">
        {payload.map((entry) => {
          const isMargin = String(entry.dataKey) === 'margin';
          return (
            <p key={String(entry.dataKey)} className="flex items-center gap-2 text-[13px]">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-muted-foreground">{entry.name}</span>
              <span className="ml-auto font-bold tabular-nums">
                {isMargin ? `${Number(entry.value).toFixed(1)}%` : `$${Number(entry.value).toLocaleString()}`}
              </span>
            </p>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Modern analytics board — gradient volume bars + margin line on a dual axis,
 * with a segmented range control. Replaces the previous area-only panel.
 */
export function AnalyticsBoard({ className }: { className?: string }) {
  const [range, setRange] = useState<RangeId>('6m');

  const data = useMemo(() => {
    const months = RANGES.find((r) => r.id === range)?.months ?? 6;
    return PULSE_SERIES.slice(-months);
  }, [range]);

  const totals = useMemo(() => {
    const sales = data.reduce((sum, p) => sum + p.sales, 0);
    const profit = data.reduce((sum, p) => sum + p.profit, 0);
    const margin = (profit / sales) * 100;
    return { sales, profit, margin };
  }, [data]);

  return (
    <Reveal delay={0.12} className={cn('h-full', className)}>
      <GlassCard className="flex h-full flex-col p-6 sm:p-7">
        <SectionHead
          title="Revenue analytics"
          sub="Monthly sales volume & gross margin"
          right={
            <div className="flex items-center gap-1 rounded-full border border-black/[0.06] bg-black/[0.03] p-1 dark:border-white/[0.08] dark:bg-white/[0.05]">
              {RANGES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRange(r.id)}
                  className={cn(
                    'rounded-full px-3.5 py-1.5 text-xs font-bold transition-all',
                    range === r.id
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-600/25'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          }
        />

        {/* Readouts */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-black/[0.05] bg-black/[0.02] p-3.5 dark:border-white/[0.06] dark:bg-white/[0.03]">
            <p className="text-[11px] font-semibold text-muted-foreground">Total sales</p>
            <p className="mt-1 text-xl font-black tracking-tight tabular-nums">
              ${(totals.sales / 1_000_000).toFixed(2)}M
            </p>
            <p className="text-[11px] font-bold text-emerald-500">▲ 18.4%</p>
          </div>
          <div className="rounded-2xl border border-black/[0.05] bg-black/[0.02] p-3.5 dark:border-white/[0.06] dark:bg-white/[0.03]">
            <p className="text-[11px] font-semibold text-muted-foreground">Gross profit</p>
            <p className="mt-1 text-xl font-black tracking-tight tabular-nums">
              ${(totals.profit / 1_000).toFixed(0)}k
            </p>
            <p className="text-[11px] font-bold text-emerald-500">▲ 12.1%</p>
          </div>
          <div className="rounded-2xl border border-black/[0.05] bg-black/[0.02] p-3.5 dark:border-white/[0.06] dark:bg-white/[0.03]">
            <p className="text-[11px] font-semibold text-muted-foreground">Avg margin</p>
            <p className="mt-1 text-xl font-black tracking-tight tabular-nums">{totals.margin.toFixed(1)}%</p>
            <p className="text-[11px] font-bold text-emerald-500">▲ 1.9 pts</p>
          </div>
        </div>

        {/* Chart */}
        <div className="mt-4 h-[320px] w-full flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 12, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="pulse-bar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.55} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="label"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="sales"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={48}
                tickFormatter={(v: number) => `$${Math.round(v / 1000)}k`}
              />
              <YAxis
                yAxisId="margin"
                orientation="right"
                domain={[28, 42]}
                tick={{ fill: '#f59e0b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={38}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip cursor={{ fill: 'hsl(var(--muted) / 0.4)', radius: 10 }} content={<PulseTip />} />
              <Bar
                yAxisId="sales"
                dataKey="sales"
                name="Sales"
                fill="url(#pulse-bar)"
                radius={[8, 8, 2, 2]}
                barSize={26}
                animationDuration={900}
              />
              <Line
                yAxisId="margin"
                type="monotone"
                dataKey="margin"
                name="Margin %"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                animationDuration={1100}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center gap-5 border-t border-black/[0.06] pt-3.5 dark:border-white/[0.07]">
          <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-sm bg-gradient-to-b from-violet-500 to-violet-700" /> Sales volume
          </span>
          <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Gross margin %
          </span>
        </div>
      </GlassCard>
    </Reveal>
  );
}

export default AnalyticsBoard;