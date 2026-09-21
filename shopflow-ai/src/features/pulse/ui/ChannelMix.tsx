import {
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/utils/format';
import { ROUTES } from '@/constants';
import { CHANNELS } from '../data';
import { GlassCard, Reveal, SectionHead } from './primitives';

/**
 * Channel mix — a modern multi-ring radial gauge (instead of the previous
 * donut) with gradient legend rows showing share, revenue and trend.
 */
export function ChannelMix({ className }: { className?: string }) {
  const gaugeData = CHANNELS.map((c) => ({
    name: c.name,
    value: c.share,
    fill: c.color,
  }));

  return (
    <Reveal delay={0.18} className={`h-full ${className ?? ''}`}>
      <GlassCard className="flex h-full flex-col p-6 sm:p-7">
        <SectionHead
          title="Channel mix"
          sub="Share of April revenue"
          right={
            <Link
              to={ROUTES.ANALYTICS}
              className="inline-flex items-center gap-1 text-xs font-semibold text-violet-500 transition-colors hover:text-violet-400"
            >
              Deep dive <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          }
        />

        <div className="relative mx-auto mt-2 h-[220px] w-full max-w-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              data={gaugeData}
              innerRadius="24%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
              <RadialBar
                dataKey="value"
                cornerRadius={12}
                background={{ fill: 'hsl(var(--muted))' }}
                animationDuration={1100}
              />
              <Tooltip
                formatter={(v: unknown, name: unknown) => [`${v}%`, String(name)]}
                contentStyle={{
                  borderRadius: 14,
                  fontSize: 12,
                  border: '1px solid hsl(var(--border))',
                  backgroundColor: 'hsl(var(--popover))',
                }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Total</span>
            <span className="text-[26px] font-black tracking-tighter tabular-nums">$284.6k</span>
            <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[11px] font-bold text-violet-500">
              ▲ 12.4%
            </span>
          </div>
        </div>

        <ul className="mt-3 flex-1 space-y-2">
          {CHANNELS.map((c) => (
            <li
              key={c.id}
              className="rounded-2xl border border-black/[0.05] bg-black/[0.02] p-3 transition-colors hover:border-violet-400/30 dark:border-white/[0.06] dark:bg-white/[0.03]"
            >
              <div className="flex items-center justify-between gap-2 text-[13px]">
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="truncate font-semibold">{c.name}</span>
                </span>
                <span className="flex shrink-0 items-baseline gap-2">
                  <span className="font-bold tabular-nums">{formatCurrency(c.revenue, 'USD', { maximumFractionDigits: 0 })}</span>
                  <span
                    className={`text-[11px] font-bold ${c.trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}
                  >
                    {c.trend >= 0 ? '▲' : '▼'} {Math.abs(c.trend)}%
                  </span>
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${c.share}%`, backgroundColor: c.color }}
                />
              </div>
            </li>
          ))}
        </ul>
      </GlassCard>
    </Reveal>
  );
}

export default ChannelMix;