import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCompactNumber, formatCurrency } from '@/utils/format';
import { TOP_MOVERS } from '../data';
import { DeltaChip, GlassCard, Reveal, SectionHead } from './primitives';

const MEDALS = [
  'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-500/30',
  'bg-gradient-to-br from-slate-300 to-slate-400 text-white',
  'bg-gradient-to-br from-amber-600 to-amber-700 text-white',
];

/**
 * Top movers — ranked best sellers with animated share bars and medals
 * for the podium. Replaces the previous plain list.
 */
export function TopMovers({ className }: { className?: string }) {
  return (
    <Reveal delay={0.22} className={cn('h-full', className)}>
      <GlassCard className="flex h-full flex-col p-6 sm:p-7">
        <SectionHead title="Top movers" sub="Best sellers · this month" />

        <ul className="mt-5 flex-1 space-y-3">
          {TOP_MOVERS.map((p, i) => (
            <motion.li
              key={p.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.24 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="group rounded-2xl border border-black/[0.05] bg-black/[0.02] p-3.5 transition-all hover:-translate-y-0.5 hover:border-violet-400/30 hover:shadow-md dark:border-white/[0.06] dark:bg-white/[0.03]"
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[13px] font-black',
                    MEDALS[i] ?? 'bg-black/[0.05] text-muted-foreground dark:bg-white/[0.08]',
                  )}
                >
                  {i === 0 ? <Crown className="h-4 w-4" /> : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold leading-tight">{p.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {p.category} · {formatCompactNumber(p.units)} units
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[13px] font-black tabular-nums">{formatCurrency(p.revenue, 'USD', { maximumFractionDigits: 0 })}</p>
                  <DeltaChip value={p.delta} className="mt-0.5" />
                </div>
              </div>
              {/* Share bar */}
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${p.share}%` }}
                  transition={{ duration: 0.9, delay: 0.35 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className={cn(
                    'h-full rounded-full',
                    i === 0
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                      : 'bg-gradient-to-r from-violet-500 to-fuchsia-500',
                  )}
                />
              </div>
            </motion.li>
          ))}
        </ul>
      </GlassCard>
    </Reveal>
  );
}

export default TopMovers;