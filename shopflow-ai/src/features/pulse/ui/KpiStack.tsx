import type { ComponentType } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, CircleDollarSign, Receipt, ShoppingBag, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { KPIS } from '../data';
import type { PulseKpi } from '../types';

const KPI_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  revenue: CircleDollarSign,
  orders: ShoppingBag,
  basket: Receipt,
  sellthrough: Target,
};

function KpiCard({ kpi, delay }: { kpi: PulseKpi; delay: number }) {
  const Icon = KPI_ICONS[kpi.id] ?? Target;
  const up = kpi.delta >= 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6 }}
      className="group relative overflow-hidden rounded-3xl border border-black/[0.06] bg-card/85 p-6 backdrop-blur-xl shadow-[0_1px_2px_rgba(15,10,40,0.04),0_24px_60px_-24px_rgba(76,29,149,0.25)] transition-shadow hover:shadow-[0_2px_4px_rgba(15,10,40,0.05),0_36px_80px_-24px_rgba(147,51,234,0.4)] dark:border-white/[0.07]"
    >
      {/* Ambient gradient wash */}
      <div
        className={cn(
          'pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full opacity-[0.16] blur-3xl transition-opacity duration-500 group-hover:opacity-30',
          kpi.glow,
        )}
      />

      <div className="relative flex items-start justify-between">
        <span
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg',
            kpi.orb,
          )}
        >
          <Icon className="h-5.5 w-5.5" />
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold',
            up
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
          )}
        >
          <ArrowUpRight className={cn('h-3 w-3', !up && 'rotate-90')} />
          {Math.abs(kpi.delta).toFixed(1)}%
        </span>
      </div>

      <p className="relative mt-6 text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {kpi.label}
      </p>
      <p className="relative mt-1 text-[38px] font-black leading-none tracking-tighter tabular-nums">
        {kpi.value}
      </p>
      <p className="relative mt-2 text-xs text-muted-foreground">{kpi.caption}</p>

      {/* Goal meter */}
      <div className="relative mt-6 border-t border-black/[0.06] pt-4 dark:border-white/[0.07]">
        <div className="h-2 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${kpi.targetPct}%` }}
            transition={{ duration: 1.1, delay: delay + 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={cn('h-full rounded-full bg-gradient-to-r', kpi.meter)}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
          <span>{kpi.targetLabel}</span>
          <span className="font-bold text-foreground tabular-nums">{kpi.targetPct}%</span>
        </div>
      </div>
    </motion.article>
  );
}

/** Row of extra-large KPI cards with gradient orbs and animated goal meters. */
export function KpiStack({ className }: { className?: string }) {
  return (
    <div className={cn('grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4', className)}>
      {KPIS.map((kpi, i) => (
        <KpiCard key={kpi.id} kpi={kpi} delay={0.08 + i * 0.07} />
      ))}
    </div>
  );
}

export default KpiStack;