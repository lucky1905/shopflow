import { motion } from 'framer-motion';
import { ArrowUpRight, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants';
import { RESTOCK_QUEUE } from '../data';
import type { RestockItem } from '../types';
import { GlassCard, Reveal, SectionHead } from './primitives';

const URGENCY = {
  Critical: { stripe: 'bg-rose-500', pill: 'bg-rose-500/10 text-rose-600 dark:text-rose-400', pulse: true },
  Low: { stripe: 'bg-amber-500', pill: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', pulse: false },
  Watch: { stripe: 'bg-sky-500', pill: 'bg-sky-500/10 text-sky-600 dark:text-sky-400', pulse: false },
} as const;

function Row({ item, delay }: { item: RestockItem; delay: number }) {
  const tone = URGENCY[item.urgency];
  const coverPct = Math.min(100, Math.round((item.coverDays / 21) * 100));

  return (
    <motion.li
      initial={{ opacity: 0, x: -18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex items-center gap-4 overflow-hidden rounded-2xl border border-black/[0.05] bg-black/[0.02] p-4 pl-5 transition-all hover:-translate-y-0.5 hover:border-violet-400/30 hover:shadow-md dark:border-white/[0.06] dark:bg-white/[0.03]"
    >
      {/* Urgency stripe */}
      <span aria-hidden="true" className={cn('absolute inset-y-0 left-0 w-1', tone.stripe)} />

      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-black/[0.06] bg-card text-muted-foreground dark:border-white/[0.08] dark:bg-white/[0.05]">
        <Package className="h-5 w-5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold leading-tight">{item.product}</p>
        <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="rounded-md bg-black/[0.05] px-1.5 py-0.5 font-mono font-semibold dark:bg-white/[0.08]">
            {item.sku}
          </span>
          {item.supplier}
        </p>
        {/* Days-of-cover meter */}
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1 w-24 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
            <div
              className={cn('h-full rounded-full', tone.stripe)}
              style={{ width: `${coverPct}%` }}
            />
          </div>
          <span className="text-[10px] font-semibold text-muted-foreground">
            {item.left} left / par {item.par}
          </span>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-xl font-black leading-none tabular-nums">{item.coverDays}</p>
        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">days cover</p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide',
            tone.pill,
          )}
        >
          {tone.pulse && <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-70" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-500" /></span>}
          {item.urgency}
        </span>
        <Link
          to={ROUTES.PURCHASES}
          className="inline-flex items-center gap-0.5 rounded-lg border border-black/[0.07] px-2.5 py-1 text-[11px] font-bold transition-all hover:border-violet-400/50 hover:text-violet-500 dark:border-white/[0.09]"
        >
          Reorder <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    </motion.li>
  );
}

/**
 * Restock queue — urgency-striped rows with days-of-cover meters,
 * ranked by the AI demand forecast.
 */
export function RestockQueue({ className }: { className?: string }) {
  return (
    <Reveal delay={0.14} className={cn('h-full', className)}>
      <GlassCard className="flex h-full flex-col p-6 sm:p-7">
        <SectionHead
          title="Restock queue"
          sub="Ranked by predicted days of cover"
          right={
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
              <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-70" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-500" /></span>
              2 critical
            </span>
          }
        />
        <ul className="mt-5 flex-1 space-y-2.5">
          {RESTOCK_QUEUE.map((item, i) => (
            <Row key={item.id} item={item} delay={0.18 + i * 0.06} />
          ))}
        </ul>
      </GlassCard>
    </Reveal>
  );
}

export default RestockQueue;